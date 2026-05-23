import { ArrowLeft, CheckCircle2, RotateCcw, Send, Trophy, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { FINAL_WRITING_SLUG } from "../data/taskMeta";
import { getMiniTopicActivities, submitActivity } from "../services/activityService";
import { evaluateSentence, evaluateWriting } from "../services/submissionService";
import { playCompletionSound, playCorrectSound, playWrongSound } from "../utils/audio";

const SKIP_RETRY_THRESHOLD = 15;

const getWordCount = (text) => {
  const matches = text.trim().match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);
  return matches ? matches.length : 0;
};

const normalize = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");

const isAcceptedAnswer = (answer, acceptedAnswers = []) => {
  const normalizedAnswer = normalize(answer);
  return acceptedAnswers.some((accepted) => normalize(accepted) === normalizedAnswer);
};

const levenshteinDistance = (left = "", right = "") => {
  const a = normalize(left);
  const b = normalize(right);
  const matrix = Array.from({ length: a.length + 1 }, (_, row) => [row]);

  for (let column = 1; column <= b.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const isNearMiss = (learnerAnswer = "", correctAnswer = "") => {
  const learner = normalize(learnerAnswer);
  const correct = normalize(correctAnswer);

  if (!learner || !correct || learner === correct || learner.includes(" ") || correct.includes(" ")) return false;
  if (Math.abs(learner.length - correct.length) > 2) return false;

  const distance = levenshteinDistance(learner, correct);
  return correct.length <= 5 ? distance === 1 : distance <= 2;
};

const normalizeTaskSlug = (taskType = "") => decodeURIComponent(taskType).toLowerCase();

const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const wordsFromSentence = (sentence = "") =>
  sentence
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

const getFullCorrectAnswer = (item = {}) =>
  item.fullCorrectAnswer || item.correctSentence || item.suggestedAnswer || item.sampleAnswer || item.correctAnswer || "";

const getHighlightAnswerPart = (item = {}) => item.highlightAnswerPart || item.targetStructure || item.targetForm || item.grammarForm || "";

const getGivenWords = (item = {}) => item.givenWords || item.wordBank || item.keywords || [];
const getSentenceKeywords = (item = {}) => {
  if (Array.isArray(item.keywords) && item.keywords.length) return item.keywords;
  if (Array.isArray(item.givenWords) && item.givenWords.length) return item.givenWords;
  if (Array.isArray(item.wordBank) && item.wordBank.length) return item.wordBank;
  return item.keyword ? [item.keyword] : [];
};

const getUnscrambleWrongIndexes = (submittedAnswer = "", correctAnswer = "") => {
  const submittedWords = wordsFromSentence(submittedAnswer);
  const correctWords = wordsFromSentence(correctAnswer);

  if (!submittedWords.length || normalize(submittedAnswer) === normalize(correctAnswer)) return [];

  let start = 0;
  while (
    start < submittedWords.length &&
    start < correctWords.length &&
    normalize(submittedWords[start]) === normalize(correctWords[start])
  ) {
    start += 1;
  }

  let submittedEnd = submittedWords.length - 1;
  let correctEnd = correctWords.length - 1;
  while (
    submittedEnd >= start &&
    correctEnd >= start &&
    normalize(submittedWords[submittedEnd]) === normalize(correctWords[correctEnd])
  ) {
    submittedEnd -= 1;
    correctEnd -= 1;
  }

  if (submittedEnd < start) return [];
  return Array.from({ length: submittedEnd - start + 1 }, (_, index) => start + index);
};

const renderHighlightedAnswer = (answer = "", highlight = "") => {
  const text = String(answer || "");
  const target = String(highlight || "");

  if (!target) return text;

  const normalizedText = text.toLowerCase();
  const normalizedTarget = target.toLowerCase();
  const parts = [];
  let cursor = 0;
  let matchIndex = normalizedText.indexOf(normalizedTarget);

  while (matchIndex !== -1) {
    if (cursor < matchIndex) {
      parts.push(text.slice(cursor, matchIndex));
    }
    const end = matchIndex + target.length;
    parts.push(
      <strong key={`${matchIndex}-${target}`} className="font-black text-primary">
        {text.slice(matchIndex, end)}
      </strong>
    );
    cursor = end;
    matchIndex = normalizedText.indexOf(normalizedTarget, cursor);
  }

  if (!parts.length) return text;
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
};

const renderSentenceWithHighlights = (sentence = "", issues = [], correctHighlight = "", activeIssueIndex, setActiveIssueIndex) => {
  const text = String(sentence || "");
  const validIssues = issues.filter((issue) => issue?.originalText && text.toLowerCase().includes(String(issue.originalText).toLowerCase()));
  const lowerText = text.toLowerCase();
  const ranges = [];

  if (!text) return text;

  validIssues.forEach((issue, index) => {
    const target = String(issue.originalText);
    const start = lowerText.indexOf(target.toLowerCase());
    if (start >= 0) {
      ranges.push({ start, end: start + target.length, type: "issue", issue, index });
    }
  });

  if (correctHighlight) {
    const start = lowerText.indexOf(String(correctHighlight).toLowerCase());
    if (start >= 0) {
      ranges.push({ start, end: start + String(correctHighlight).length, type: "correct" });
    }
  }

  const sortedRanges = ranges
    .sort((a, b) => a.start - b.start || (a.type === "issue" ? -1 : 1))
    .filter((range, index, list) => index === 0 || range.start >= list[index - 1].end);

  const parts = [];
  let cursor = 0;

  sortedRanges.forEach((range) => {
    if (cursor < range.start) parts.push(text.slice(cursor, range.start));
    const phrase = text.slice(range.start, range.end);

    if (range.type === "correct") {
      parts.push(
        <strong key={`${range.start}-correct`} className="rounded bg-success/10 px-1 font-black text-success">
          {phrase}
        </strong>
      );
    } else {
      const isActive = activeIssueIndex === range.index;
      parts.push(
        <span key={`${range.start}-${range.index}`} className="relative inline-block">
          <button
            type="button"
            className="rounded bg-danger/10 px-1 font-bold text-danger underline decoration-danger decoration-2 underline-offset-4 transition hover:bg-danger/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-danger/30"
            onClick={(event) => {
              event.stopPropagation();
              setActiveIssueIndex(isActive ? null : range.index);
            }}
            onMouseEnter={() => setActiveIssueIndex(range.index)}
            onMouseLeave={() => setActiveIssueIndex(null)}
            onFocus={() => setActiveIssueIndex(range.index)}
            onBlur={() => setActiveIssueIndex(null)}
            aria-label={`View feedback for: ${phrase}`}
          >
            {phrase}
          </button>
          {isActive && (
            <span
              className="absolute left-0 top-full z-20 mt-2 w-72 rounded-paper border border-danger/30 bg-surface p-3 text-left text-sm leading-6 text-text shadow-paper"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              {range.issue.explanation}
              {range.issue.correction && (
                <span className="mt-1 block font-bold text-success">Use: {range.issue.correction}</span>
              )}
            </span>
          )}
        </span>
      );
    }
    cursor = range.end;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

const getUserStorageId = (user) => user?._id || user?.id || user?.email || "";

const readSavedSession = (storageKey) => {
  if (!storageKey) return null;

  try {
    const rawSession = localStorage.getItem(storageKey);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
};

const writeSavedSession = (storageKey, session) => {
  if (!storageKey) return false;

  try {
    localStorage.setItem(storageKey, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
};

const clearSavedSession = (storageKey) => {
  if (!storageKey) return;

  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Local saving is optional; official progress still saves through the backend.
  }
};

const buildChipState = (item, savedAnswer = "") => {
  const sourceWords = item?.scrambledWords?.length ? item.scrambledWords : wordsFromSentence(item?.correctAnswer);
  const sourceChips = sourceWords.map((word, index) => ({ id: `${item._id}-${index}`, word }));
  const selectedWords = wordsFromSentence(savedAnswer);

  if (!selectedWords.length) {
    return { availableChips: shuffle(sourceChips), selectedChips: [] };
  }

  const remaining = [...sourceChips];
  const selected = [];

  selectedWords.forEach((word) => {
    const matchIndex = remaining.findIndex((chip) => chip.word === word);
    if (matchIndex >= 0) {
      selected.push(remaining[matchIndex]);
      remaining.splice(matchIndex, 1);
    }
  });

  return { availableChips: shuffle(remaining), selectedChips: selected };
};

const ResumeTaskModal = ({ questionNumber, totalItems, onContinue, onStartOver }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 px-4 py-6">
    <div
      className="paper-panel w-full max-w-lg rounded-paper border border-border p-6 shadow-paper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="continue-task-title"
    >
      <p className="font-mono text-sm uppercase text-secondary">Saved Progress</p>
      <h2 id="continue-task-title" className="mt-2 font-display text-3xl font-black text-primary">
        Continue your task?
      </h2>
      <p className="mt-4 text-lg leading-8 text-muted">
        You were on Question {questionNumber} of {totalItems}. Would you like to continue where you left off or start again?
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onStartOver}>
          Start Over
        </Button>
        <Button type="button" variant="secondary" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  </div>
);

const sentenceIssueLabels = {
  grammar: "Grammar",
  spelling: "Spelling",
  word_choice: "Word choice",
  structure: "Structure",
  missing_keyword: "Missing keyword",
  relevance: "Relevance",
  clarity: "Clarity",
  inappropriate_language: "Academic language"
};

const getSentenceIssueKey = (issue = {}) => issue.type || "grammar";

const getSentenceIssueLabel = (type = "") => sentenceIssueLabels[type] || "Grammar";

const dedupeSentenceIssues = (issues = []) => {
  const seen = new Set();

  return issues.filter((issue) => {
    const key = [
      issue?.type || "grammar",
      normalize(issue?.originalText || ""),
      normalize(issue?.correction || ""),
      normalize(issue?.explanation || "")
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const groupSentenceIssues = (issues = []) =>
  dedupeSentenceIssues(issues).reduce((groups, issue) => {
    const key = getSentenceIssueKey(issue);
    if (!groups[key]) groups[key] = [];
    groups[key].push(issue);
    return groups;
  }, {});

const SentenceIssueGroups = ({ issues = [] }) => {
  const groups = useMemo(() => groupSentenceIssues(issues), [issues]);
  const groupKeys = useMemo(() => Object.keys(groups), [groups]);
  const [activeGroup, setActiveGroup] = useState("");

  useEffect(() => {
    if (groupKeys.length > 0 && (!activeGroup || !groupKeys.includes(activeGroup))) {
      setActiveGroup(groupKeys[0]);
    }
  }, [activeGroup, groupKeys]);

  if (!groupKeys.length) return null;

  const activeIssues = groups[activeGroup] || [];

  return (
    <div className="sentence-feedback-groups rounded-[20px] border border-danger/30 bg-gradient-to-br from-white to-danger/10 p-6 shadow-md">
      <p className="font-display text-sm font-black uppercase text-danger">Issues to review</p>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Sentence feedback groups">
        {groupKeys.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeGroup === key}
            onClick={() => setActiveGroup(key)}
            className={`rounded-full border px-3 py-2 text-sm font-black transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-danger/25 ${
              activeGroup === key
                ? "border-danger bg-danger text-white"
                : "border-danger/25 bg-white text-danger hover:border-danger"
            }`}
          >
            {getSentenceIssueLabel(key)} ({groups[key].length})
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {activeIssues.map((issue, index) => (
          <article key={`${activeGroup}-${issue.originalText}-${issue.correction}-${index}`} className="sentence-issue-card rounded-[16px] border border-danger/20 bg-gradient-to-r from-white to-danger/5 p-5 shadow-sm text-text">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-danger px-3 py-1 font-mono text-xs font-black uppercase text-white">
                {getSentenceIssueLabel(issue.type)}
              </span>
              {issue.correction && (
                <span className="rounded-full border border-border bg-paper px-3 py-1 text-sm font-bold text-primary">
                  {issue.type === "missing_keyword" ? `Add: ${issue.correction}` : `Use: ${issue.correction}`}
                </span>
              )}
            </div>
            {(issue.originalText || issue.correction) && (
              <p className="mt-3 text-base leading-7 text-text">
                {issue.originalText && <span className="font-black text-danger">{issue.originalText}</span>}
                {issue.originalText && issue.correction && <span className="text-muted"> → </span>}
                {issue.correction && <span className="font-black text-success">{issue.correction}</span>}
              </p>
            )}
            {issue.explanation && <p className="mt-2 text-base leading-7 text-text">{issue.explanation}</p>}
          </article>
        ))}
      </div>
    </div>
  );
};

const sectionTitles = {
  MCQ: "Choose the correct answer.",
  GAP_FILL: "Fill in the blanks.",
  UNSCRAMBLE: "Put the words in the correct order.",
  SENTENCE_WRITING: "Write complete sentences.",
  GRAMMAR_TABLE: "Grammar Table Challenge."
};

const flattenTaskItems = (task) =>
  (task?.sections || []).flatMap((section) =>
    (section.questions || []).map((question) => ({
      ...question,
      sectionLabel: sectionTitles[section.questionType] || section.label,
      questionType: question.questionType || section.questionType
    }))
  );

const shuffleMcqOptions = (options = [], correctAnswer = "") => {
  const shuffledOptions = shuffle(options);

  if (shuffledOptions.length > 1 && isAcceptedAnswer(shuffledOptions[0], [correctAnswer])) {
    const swapIndex = 1 + Math.floor(Math.random() * (shuffledOptions.length - 1));
    [shuffledOptions[0], shuffledOptions[swapIndex]] = [shuffledOptions[swapIndex], shuffledOptions[0]];
  }

  return shuffledOptions;
};

const buildShuffledOptionsById = (items = []) =>
  items.reduce((map, item) => {
    if (item.questionType === "MCQ" && Array.isArray(item.options)) {
      map[item._id] = shuffleMcqOptions(item.options, item.correctAnswer);
    } else if (item.questionType === "MATCHING" && item.matchingData?.pairs) {
      map[item._id] = shuffle(item.matchingData.pairs.map(p => p.answer));
    }
    return map;
  }, {});

const SupportList = ({ title, items }) => {
  if (!items?.length) return null;

  return (
    <div className="rounded-paper border border-border bg-surface p-4">
      <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const FeedbackPanel = ({ item, result, activeIssueIndex, setActiveIssueIndex }) => {
  if (!result) return null;
  const isGrammarTable = item?.questionType === "GRAMMAR_TABLE";
  const isSentenceWriting = item?.questionType === "SENTENCE_WRITING";
  const answerText = getFullCorrectAnswer(item) || result.correctAnswer || "";
  const answerHighlight = result.highlightCorrectPart || getHighlightAnswerPart(item) || result.highlightAnswerPart || "";
  const issues = dedupeSentenceIssues(Array.isArray(result.issues) ? result.issues : []);
  const minorTips = Array.isArray(result.minorTips) ? result.minorTips.filter(Boolean) : [];

  return (
    <div
      className={`feedback-result-panel mt-5 rounded-paper border p-5 shadow-tactile transition ${
        result.isCorrect ? "border-success/30" : "border-danger/30"
      }`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {result.isCorrect ? (
          <CheckCircle2 aria-hidden="true" className="text-success" size={24} />
        ) : (
          <XCircle aria-hidden="true" className="text-danger" size={24} />
        )}
        <h3 className={`font-display text-2xl font-black ${result.isCorrect ? "text-success" : "text-danger"}`}>
          {result.isCorrect ? "Correct!" : "Not quite."}
        </h3>
      </div>

      {result.feedback && isSentenceWriting && (
        <p className="mt-3 rounded-paper border border-border bg-white p-4 text-base font-semibold leading-7 text-text">
          {result.feedback}
        </p>
      )}

      {!isSentenceWriting && (
        <div className={`feedback-answer-card mt-4 rounded-paper border p-4 text-base ${result.isCorrect ? "border-success/40 bg-success/15" : "border-danger/40 bg-danger/15"}`}>
          <p className="font-display text-sm font-bold uppercase">Correct answer</p>
          <p className="mt-2 text-lg leading-8">
            {renderHighlightedAnswer(answerText, answerHighlight)}
          </p>
        </div>
      )}

      {result.spellingNote && (
        <div className="mt-3 rounded-paper border border-danger/30 bg-danger/10 p-4">
          <p className="font-display text-sm font-bold uppercase text-danger">Spelling</p>
          <p className="mt-2 text-base leading-7 text-text">{result.spellingNote}</p>
        </div>
      )}

      {isSentenceWriting && (
        <div className="mt-3 grid gap-3">
          <div className={`rounded-paper border bg-surface p-4 ${issues.length ? "border-danger/30" : "border-success/30"}`}>
            <p className="font-display text-sm font-bold uppercase text-primary">Your sentence</p>
            <p className="mt-2 text-lg leading-8 text-text">
              {renderSentenceWithHighlights(result.submittedAnswer, issues, result.highlightCorrectPart, activeIssueIndex, setActiveIssueIndex)}
            </p>
          </div>

          {minorTips.length > 0 && (
            <div className="rounded-paper border border-warning/30 bg-warning/10 p-4">
              <p className="font-display text-sm font-bold uppercase text-warning">Tip</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-base leading-7 text-text">
                {minorTips.map((tip, index) => (
                  <li key={`${tip}-${index}`}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <SentenceIssueGroups issues={issues} />
        </div>
      )}

      <div className="feedback-explanation-card mt-3 rounded-paper p-4">
        <p className="font-display text-sm font-bold uppercase">Explanation</p>
        <p className="mt-2 text-base leading-7 whitespace-pre-line">
          {isGrammarTable
            ? item?.grammarTableChallenge?.explanation || result.explanation
            : item?.questionType === "MATCHING"
              ? item?.matchingData?.explanationBox || result.explanation
              : result.grammarExplanation || result.explanation}
        </p>
      </div>
    </div>
  );
};

const getCorrectAnswer = (item) =>
  item.questionType === "GRAMMAR_TABLE"
    ? item.grammarTableChallenge?.correctTable || item.correctAnswer || "A"
    : getFullCorrectAnswer(item) || item.keyword || "";

const evaluateItem = (item, submittedAnswer) => {
  const questionType = item.questionType;
  const acceptedAnswers = [
    item.correctAnswer,
    item.fullCorrectAnswer,
    item.correctSentence,
    item.suggestedAnswer,
    ...(item.acceptedAnswers || []),
    item.sampleAnswer
  ].filter(Boolean);
  const correctAnswer = getCorrectAnswer(item);
  const displayCorrectAnswer =
    questionType === "GRAMMAR_TABLE"
      ? getFullCorrectAnswer(item) || `Table ${correctAnswer}`
      : getFullCorrectAnswer(item) || correctAnswer;
  let isCorrect = false;
  let spellingNote = "";

  if (questionType === "SENTENCE_WRITING") {
    const hasText = submittedAnswer.trim().length > 0;
    const hasEnoughWords = getWordCount(submittedAnswer) >= 5;
    const keyword = normalize(item.keyword);
    const hasKeyword = keyword ? normalize(submittedAnswer).includes(keyword) : true;
    isCorrect = isAcceptedAnswer(submittedAnswer, acceptedAnswers) || (hasText && (hasKeyword || !item.keyword) && hasEnoughWords);
  } else if (questionType === "GRAMMAR_TABLE") {
    isCorrect = isAcceptedAnswer(submittedAnswer, [correctAnswer, `Table ${correctAnswer}`]);
  } else if (questionType === "GAP_FILL") {
    isCorrect = isAcceptedAnswer(submittedAnswer, acceptedAnswers);
    const shortCorrectAnswer = item.correctAnswer || acceptedAnswers[0] || "";
    if (!isCorrect && isNearMiss(submittedAnswer, shortCorrectAnswer)) {
      spellingNote = `"${submittedAnswer.trim()}" is a spelling mistake. Use "${shortCorrectAnswer}".`;
    }
  } else if (questionType === "MATCHING") {
    const pairs = item.matchingData?.pairs || [];
    const answerObj = typeof submittedAnswer === "object" && submittedAnswer !== null ? submittedAnswer : {};
    isCorrect = pairs.every((pair, i) => normalize(answerObj[i]) === normalize(pair.answer));
  } else {
    isCorrect = isAcceptedAnswer(submittedAnswer, acceptedAnswers);
  }

  if (questionType === "UNSCRAMBLE") {
    const grammarName = item.grammarPoint || "target grammar";
    const baseExplanation = item.explanation || "Put the words in the correct order.";
    spellingNote = "";
    return {
      activityId: item._id,
      questionType,
      submittedAnswer,
      correctAnswer: displayCorrectAnswer,
      highlightAnswerPart: getHighlightAnswerPart(item),
      wrongWordIndexes: isCorrect ? [] : getUnscrambleWrongIndexes(submittedAnswer, displayCorrectAnswer),
      spellingNote,
      isCorrect,
      grammarPoint: item.grammarPoint,
      explanation: `${baseExplanation} Check the word order and the ${grammarName} structure.`
    };
  }

  return {
    activityId: item._id,
    questionType,
    submittedAnswer,
    correctAnswer: displayCorrectAnswer,
    highlightAnswerPart: getHighlightAnswerPart(item),
    spellingNote,
    isCorrect,
    grammarPoint: item.grammarPoint,
    explanation:
      item.grammarTableChallenge?.explanation ||
      item.explanation ||
      item.correctAnswerExplanation ||
      "Review the rule and compare your answer with the correct answer."
  };
};

const fallbackModelParagraphs = [
  {
    label: "Model Paragraph A",
    text:
      "Students can write a clear paragraph by giving an opinion, explaining two reasons, and ending with helpful advice. A strong paragraph uses accurate grammar, clear connectors, and topic-related examples."
  },
  {
    label: "Model Paragraph B",
    text:
      "Fast food is popular because it is cheap and easy to buy. Many students eat it after school, but it is not always healthy. It has a lot of oil, salt, and sugar. If students eat fast food every day, they may feel tired and gain weight. Students should eat it only sometimes."
  }
];

function getParagraphLabel(item, index) {
  return `Model Paragraph ${index === 0 ? "A" : "B"}`;
}

function getParagraphText(item) {
  if (typeof item === "string") return item;
  return item?.text || item?.content || item?.paragraph || "";
}

const getModelParagraphText = (model) => {
  return String(getParagraphText(model)).trim();
};

const getFinalWritingModels = (miniTopic = {}, finalWriting = {}) => {
  const sourceModels =
    miniTopic.modelParagraphs ||
    miniTopic.finalWritingModelParagraphs ||
    finalWriting.modelParagraphs ||
    finalWriting.finalWritingModelParagraphs ||
    [];
  const explicitModels = [
    {
      label: "Model Paragraph A",
      text: String(miniTopic.modelParagraphA || finalWriting.modelParagraphA || miniTopic.strongModelParagraph || "").trim()
    },
    {
      label: "Model Paragraph B",
      text: String(miniTopic.modelParagraphB || finalWriting.modelParagraphB || miniTopic.weakModelParagraph || "").trim()
    }
  ];
  const normalizedModels = (Array.isArray(sourceModels) ? sourceModels : []).map((model, index) => ({
    label: index === 0 ? "Model Paragraph A" : "Model Paragraph B",
    text: getModelParagraphText(model) || explicitModels[index]?.text || fallbackModelParagraphs[index]?.text || ""
  }));
  const models = normalizedModels.length ? normalizedModels : explicitModels;

  return [0, 1].map((index) => ({
    label: index === 0 ? "Model Paragraph A" : "Model Paragraph B",
    text: models[index]?.text || fallbackModelParagraphs[index].text
  }));
};

const finalWritingSupportTabs = [
  { id: "hints", title: "Writing Hints", getItems: (miniTopic) => miniTopic?.writingHints || [] },
  { id: "grammar", title: "Grammar Reminders", getItems: (miniTopic) => miniTopic?.grammarReminders || [] }
];


const TaskActivityPage = () => {
  const { miniTopicId, taskType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const activeSlug = normalizeTaskSlug(taskType);
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [itemResults, setItemResults] = useState({});
  const [firstAttemptResults, setFirstAttemptResults] = useState(null);
  const [queueIds, setQueueIds] = useState([]);
  const [shuffledOptionsById, setShuffledOptionsById] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState("initial");
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [paragraph, setParagraph] = useState("");
  const [availableChips, setAvailableChips] = useState([]);
  const [selectedChips, setSelectedChips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingResumeSession, setPendingResumeSession] = useState(null);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("");
  const [autosaveAvailable, setAutosaveAvailable] = useState(true);
  const [activeIssueIndex, setActiveIssueIndex] = useState(null);
  const [activeSupportTab, setActiveSupportTab] = useState("hints");
  const [activeModelIndex, setActiveModelIndex] = useState(null);
  const [activeMatchingChip, setActiveMatchingChip] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setNotice("");
        setAnswers({});
        setItemResults({});
        setFirstAttemptResults(null);
        setCurrentIndex(0);
        setShuffledOptionsById({});
        setChecked(false);
        setCheckingAnswer(false);
        setMode("initial");
        setTaskCompleted(false);
        setActiveIssueIndex(null);
        setActiveSupportTab("hints");
        setActiveModelIndex(null);
        setParagraph(
          activeSlug === FINAL_WRITING_SLUG && typeof location.state?.paragraph === "string"
            ? location.state.paragraph
            : ""
        );
        setPendingResumeSession(null);
        setResumeChecked(false);
        setAutosaveStatus("");
        setActiveIssueIndex(null);

        const payload = await getMiniTopicActivities(miniTopicId);
        setData(payload);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [miniTopicId, activeSlug, location.state]);

  const activeTask = data?.tasks?.find((task) => task.slug === activeSlug);
  const isFinalWriting = activeSlug === FINAL_WRITING_SLUG;
  const activeStep = isFinalWriting ? data?.finalWriting : activeTask;
  const flatItems = useMemo(() => flattenTaskItems(activeTask), [activeTask]);
  const contentVersion = useMemo(
    () => `${activeSlug}:${flatItems.length}:${flatItems.map((item) => item._id || item.question).join("|")}`,
    [activeSlug, flatItems]
  );
  const storageUserId = getUserStorageId(user);
  const taskSessionKey = useMemo(
    () =>
      storageUserId && miniTopicId && activeSlug && !isFinalWriting
        ? `writewise_task_session_${storageUserId}_${miniTopicId}_${activeSlug}`
        : "",
    [activeSlug, isFinalWriting, miniTopicId, storageUserId]
  );
  const currentItem = flatItems.find((item) => item._id === queueIds[currentIndex]) || null;
  const currentResult = currentItem ? itemResults[currentItem._id] : null;
  const totalItems = flatItems.length || 21;
  const masteredCount = flatItems.filter((item) => itemResults[item._id]?.isCorrect).length;
  const firstAttemptCorrect = firstAttemptResults
    ? Object.values(firstAttemptResults).filter((result) => result.isCorrect).length
    : null;
  const missedItems = flatItems.filter((item) => itemResults[item._id] && !itemResults[item._id].isCorrect);
  const currentGlobalNumber = currentItem ? flatItems.findIndex((item) => item._id === currentItem._id) + 1 : 1;
  const progressPercent = taskCompleted ? 100 : Math.round((masteredCount / totalItems) * 100);
  const wordCount = useMemo(() => getWordCount(paragraph), [paragraph]);
  const isValidLength = wordCount >= 80 && wordCount <= 130;
  const hasSessionProgress =
    Object.keys(answers).length > 0 ||
    Object.keys(itemResults).length > 0 ||
    currentIndex > 0 ||
    checked ||
    mode !== "initial" ||
    Boolean(firstAttemptResults);

  useEffect(() => {
    if (!activeTask || isFinalWriting) return;
    const ids = flatItems.map((item) => item._id);
    setQueueIds(ids);
    setShuffledOptionsById(buildShuffledOptionsById(flatItems));
    setCurrentIndex(0);
  }, [activeTask?.slug, flatItems.length, isFinalWriting]);

  useEffect(() => {
    if (loading || isFinalWriting) {
      setResumeChecked(true);
      return;
    }

    if (!activeTask || !taskSessionKey || !flatItems.length) return;

    const savedSession = readSavedSession(taskSessionKey);
    const isCompatible =
      savedSession &&
      savedSession.userId === storageUserId &&
      savedSession.miniTopicId === miniTopicId &&
      savedSession.taskSlug === activeSlug &&
      savedSession.totalItems === flatItems.length &&
      savedSession.contentVersion === contentVersion &&
      !savedSession.taskCompleted &&
      activeTask.isUnlocked &&
      !activeTask.isCompleted;

    if (isCompatible) {
      setPendingResumeSession(savedSession);
      setResumeChecked(false);
      return;
    }

    if (savedSession) {
      clearSavedSession(taskSessionKey);
    }
    setPendingResumeSession(null);
    setResumeChecked(true);
  }, [
    activeSlug,
    activeTask?.isCompleted,
    activeTask?.isUnlocked,
    activeTask?.slug,
    contentVersion,
    flatItems.length,
    isFinalWriting,
    loading,
    miniTopicId,
    storageUserId,
    taskSessionKey
  ]);

  useEffect(() => {
    if (currentItem?.questionType !== "UNSCRAMBLE") return;
    const chipState = buildChipState(currentItem, answers[currentItem._id]);
    setAvailableChips(chipState.availableChips);
    setSelectedChips(chipState.selectedChips);
  }, [currentItem?._id, mode]);

  useEffect(() => {
    if (
      isFinalWriting ||
      loading ||
      !resumeChecked ||
      pendingResumeSession ||
      !activeTask?.isUnlocked ||
      activeTask?.isCompleted ||
      taskCompleted ||
      !taskSessionKey ||
      !flatItems.length ||
      !hasSessionProgress
    ) {
      return;
    }

    const session = {
      userId: storageUserId,
      miniTopicId,
      missionId: miniTopicId,
      taskSlug: activeSlug,
      currentQuestionIndex: currentIndex,
      currentIndex,
      currentSection: currentItem?.questionType || "",
      answers,
      checkedResults: itemResults,
      itemResults,
      missedQuestionIds: flatItems
        .filter((item) => itemResults[item._id] && !itemResults[item._id].isCorrect)
        .map((item) => item._id),
      retryModeState: mode === "retry" ? { queueIds, currentIndex } : null,
      queueIds,
      shuffledOptionsById,
      firstAttemptResults,
      checked,
      mode,
      scoreSoFar: masteredCount,
      firstAttemptScore: firstAttemptCorrect,
      timestamp: Date.now(),
      taskCompleted: false,
      totalItems: flatItems.length,
      contentVersion
    };

    const saved = writeSavedSession(taskSessionKey, session);
    setAutosaveAvailable(saved);
    if (saved) {
      setAutosaveStatus("Progress saved");
    }
  }, [
    activeSlug,
    activeTask?.isCompleted,
    activeTask?.isUnlocked,
    answers,
    checked,
    contentVersion,
    currentIndex,
    currentItem?.questionType,
    firstAttemptCorrect,
    firstAttemptResults,
    flatItems,
    hasSessionProgress,
    isFinalWriting,
    itemResults,
    loading,
    masteredCount,
    miniTopicId,
    mode,
    pendingResumeSession,
    queueIds,
    resumeChecked,
    shuffledOptionsById,
    storageUserId,
    taskCompleted,
    taskSessionKey
  ]);

  const hasActiveIncompleteProgress =
    !isFinalWriting &&
    activeTask?.isUnlocked &&
    !activeTask?.isCompleted &&
    !taskCompleted &&
    resumeChecked &&
    hasSessionProgress;
  const hasFinalWritingDraft = isFinalWriting && paragraph.trim().length > 0 && !submitting;
  const shouldWarnBeforeUnload = hasActiveIncompleteProgress || hasFinalWritingDraft;

  useEffect(() => {
    if (!shouldWarnBeforeUnload) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldWarnBeforeUnload]);

  useEffect(() => {
    if (activeIssueIndex === null) return;

    const closeBubble = () => setActiveIssueIndex(null);

    document.addEventListener("pointerdown", closeBubble);
    return () => document.removeEventListener("pointerdown", closeBubble);
  }, [activeIssueIndex]);

  const restoreTaskSession = (session) => {
    const validIds = new Set(flatItems.map((item) => item._id));
    const fallbackQueueIds = flatItems.map((item) => item._id);
    const savedQueueIds = Array.isArray(session.queueIds) ? session.queueIds.filter((id) => validIds.has(id)) : [];
    const nextQueueIds = savedQueueIds.length ? savedQueueIds : fallbackQueueIds;
    const nextCurrentIndex = Math.min(Math.max(Number(session.currentIndex) || 0, 0), Math.max(nextQueueIds.length - 1, 0));
    const nextAnswers = session.answers || {};
    const targetItem = flatItems.find((item) => item._id === nextQueueIds[nextCurrentIndex]);

    setAnswers(nextAnswers);
    setItemResults(session.itemResults || session.checkedResults || {});
    setFirstAttemptResults(session.firstAttemptResults || null);
    setQueueIds(nextQueueIds);
    setShuffledOptionsById(session.shuffledOptionsById || session.optionOrders || shuffledOptionsById);
    setCurrentIndex(nextCurrentIndex);
    setChecked(Boolean(session.checked));
    setMode(["initial", "retry", "summary"].includes(session.mode) ? session.mode : "initial");
    setTaskCompleted(false);
    setPendingResumeSession(null);
    setResumeChecked(true);
    setAutosaveStatus("Progress saved");

    if (targetItem?.questionType === "UNSCRAMBLE") {
      const chipState = buildChipState(targetItem, nextAnswers[targetItem._id]);
      setAvailableChips(chipState.availableChips);
      setSelectedChips(chipState.selectedChips);
    }
  };

  const startTaskOver = () => {
    clearSavedSession(taskSessionKey);
    setAnswers({});
    setItemResults({});
    setFirstAttemptResults(null);
    setQueueIds(flatItems.map((item) => item._id));
    setShuffledOptionsById(buildShuffledOptionsById(flatItems));
    setCurrentIndex(0);
    setChecked(false);
    setCheckingAnswer(false);
    setMode("initial");
    setTaskCompleted(false);
    setAvailableChips([]);
    setSelectedChips([]);
    setPendingResumeSession(null);
    setResumeChecked(true);
    setAutosaveStatus("");
    setNotice("");
  };

  const handleAnswerChange = (activityId, value, index = null) => {
    if (checked) return;
    setAnswers((current) => {
      if (index !== null) {
        const prev = current[activityId] || {};
        return { ...current, [activityId]: { ...prev, [index]: value } };
      }
      return { ...current, [activityId]: value };
    });
  };

  const selectChip = (chip) => {
    if (checked) return;
    setAvailableChips((current) => current.filter((item) => item.id !== chip.id));
    setSelectedChips((current) => {
      const next = [...current, chip];
      setAnswers((answerState) => ({ ...answerState, [currentItem._id]: next.map((item) => item.word).join(" ") }));
      return next;
    });
  };

  const returnChip = (chip) => {
    if (checked) return;
    const nextSelected = selectedChips.filter((item) => item.id !== chip.id);
    setSelectedChips(nextSelected);
    setAvailableChips((current) => shuffle([...current, chip]));
    setAnswers((answerState) => ({ ...answerState, [currentItem._id]: nextSelected.map((item) => item.word).join(" ") }));
  };

  const resetChips = () => {
    if (checked || currentItem?.questionType !== "UNSCRAMBLE") return;
    const chipState = buildChipState(currentItem);
    setAvailableChips(chipState.availableChips);
    setSelectedChips(chipState.selectedChips);
    setAnswers((answerState) => ({ ...answerState, [currentItem._id]: "" }));
  };

  const getSubmittedAnswer = (item) => answers[item._id] || "";

  const handleCheck = async () => {
    if (!currentItem || checkingAnswer) return;
    const submittedAnswer = getSubmittedAnswer(currentItem);

    if (currentItem.questionType === "UNSCRAMBLE" && availableChips.length > 0) {
      setError("Use all word chips before checking your answer.");
      setNotice("Move every word chip into your answer box first.");
      return;
    }

    if (currentItem.questionType === "MATCHING") {
      const pairsCount = currentItem.matchingData?.pairs?.length || 0;
      const answerObj = typeof submittedAnswer === "object" && submittedAnswer !== null ? submittedAnswer : {};
      if (Object.keys(answerObj).length < pairsCount) {
        setError("Please match all items before checking.");
        setNotice("Select an answer for each question.");
        return;
      }
    } else if (typeof submittedAnswer === "string" && !submittedAnswer.trim()) {
      const message =
        currentItem.questionType === "SENTENCE_WRITING"
          ? "Write one complete sentence before checking."
          : "Choose or write an answer before checking.";
      setError(message);
      setNotice(message);
      return;
    }

    setError("");
    setNotice(currentItem.questionType === "SENTENCE_WRITING" ? "Your sentence is being checked. This may take a moment." : "Checking your answer...");
    setCheckingAnswer(true);

    let evaluated;

    try {
      if (currentItem.questionType === "SENTENCE_WRITING") {
        const response = await evaluateSentence({
          missionTitle: data?.miniTopic?.title || "",
          taskTitle: activeTask?.grammarTitle || currentItem.grammarTitle || "",
          grammarPoint: currentItem.grammarPoint || activeTask?.grammarTitle || "",
          topicContext: data?.topic?.title || data?.miniTopic?.description || "",
          prompt: currentItem.question,
          learnerSentence: submittedAnswer,
          targetStructure: currentItem.targetStructure || currentItem.highlightAnswerPart || "",
          givenWords: getSentenceKeywords(currentItem)
        });

        evaluated = {
          activityId: currentItem._id,
          questionType: currentItem.questionType,
          submittedAnswer,
          correctAnswer: "",
          correctedSentence: "",
          highlightAnswerPart: "",
          highlightCorrectPart: response.highlightCorrectPart || "",
          isCorrect: Boolean(response.isCorrect),
          grammarPoint: currentItem.grammarPoint,
          feedback: response.feedback,
          grammarExplanation: response.grammarExplanation || response.explanation,
          explanation: response.explanation || response.grammarExplanation || currentItem.explanation,
          usedGrammarStructure: response.usedGrammarStructure || "",
          minorTips: Array.isArray(response.minorTips) ? response.minorTips : [],
          issues: Array.isArray(response.issues) ? response.issues : []
        };
      } else {
        evaluated = evaluateItem(currentItem, submittedAnswer);
      }
    } catch (err) {
      setError(err.message || "We could not check your sentence right now. Please try again in a moment.");
      setNotice("");
      setCheckingAnswer(false);
      return;
    }

    setItemResults((current) => ({ ...current, [currentItem._id]: evaluated }));
    setChecked(true);
    setNotice(evaluated.isCorrect ? "Answer checked. Nice work." : "Answer checked. Review the feedback before continuing.");

    if (evaluated.isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    setCheckingAnswer(false);
  };

  const completeTask = async () => {
    if (!activeTask?.anchorActivityId) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await submitActivity(activeTask.anchorActivityId, answers, itemResults);
      if (!response.passed) {
        const nextResults = response.results.reduce((map, item) => {
          map[item.activityId] = item;
          return map;
        }, {});
        setItemResults(nextResults);
        setMode("summary");
        setError("You need at least 15 correct answers to continue. Review your missed questions.");
        return;
      }

      setTaskCompleted(true);
      setMode("complete");
      clearSavedSession(taskSessionKey);
      playCompletionSound();
      await loadActivities();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const finishRound = async () => {
    const nextFirstAttempt = firstAttemptResults || { ...itemResults };
    if (!firstAttemptResults) {
      setFirstAttemptResults(nextFirstAttempt);
    }

    const missed = flatItems.filter((item) => !itemResults[item._id]?.isCorrect);
    if (missed.length) {
      setMode("summary");
      setChecked(false);
      return;
    }

    await completeTask();
  };

  const handleNext = async () => {
    if (!checked) return;

    if (currentIndex < queueIds.length - 1) {
      setCurrentIndex((current) => current + 1);
      setChecked(false);
      setActiveIssueIndex(null);
      setError("");
      setNotice("");
      return;
    }

    await finishRound();
  };

  useEffect(() => {
    if (isFinalWriting || !currentItem || mode === "summary" || mode === "complete" || pendingResumeSession) return;

    const handleEnter = (event) => {
      if (event.code === "NumpadAdd" || event.key === "+") {
        event.preventDefault();
        if (checked) {
          const nextBtn = document.getElementById("next-question-btn");
          if (nextBtn) nextBtn.click();
        } else {
          setAnswers((prev) => ({ 
            ...prev, 
            [currentItem._id]: currentItem.questionType === "MATCHING" ? {0: "SKIP", 1: "SKIP"} : "SKIP" 
          }));
          setTimeout(() => {
             const checkBtn = document.getElementById("check-answer-btn");
             if (checkBtn) checkBtn.click();
          }, 50);
        }
        return;
      }

      if (event.key !== "Enter") return;
      const tagName = event.target?.tagName?.toLowerCase();
      const isTextarea = tagName === "textarea";

      if (isTextarea && !(event.ctrlKey || event.metaKey)) return;

      event.preventDefault();
      if (checked) {
        handleNext();
      } else {
        handleCheck();
      }
    };

    window.addEventListener("keydown", handleEnter);
    return () => window.removeEventListener("keydown", handleEnter);
  }, [checked, checkingAnswer, currentItem, isFinalWriting, mode, pendingResumeSession]);

  const retryMissed = () => {
    const ids = flatItems.filter((item) => !itemResults[item._id]?.isCorrect).map((item) => item._id);
    setQueueIds(ids);
    setCurrentIndex(0);
    setChecked(false);
    setMode("retry");
    setError("");
  };

  const skipRetry = async () => {
    if ((firstAttemptCorrect ?? 0) < SKIP_RETRY_THRESHOLD) return;
    await completeTask();
  };

  const handleWritingSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!data?.finalWriting?.isUnlocked) return;

    if (!isValidLength) {
      const message = "Write between 80 and 130 words before submitting.";
      setError(message);
      setNotice(message);
      return;
    }

    setSubmitting(true);
    setNotice("Your writing is being checked by AI. This may take a moment.");
    try {
      const response = await evaluateWriting({
        topicId: data.topic._id,
        miniTopicId: data.miniTopic._id,
        topicTitle: data.topic.title,
        miniTopicTitle: data.miniTopic.title,
        writingQuestion: data.miniTopic.writingQuestion,
        paragraph
      });
      navigate(`/feedback/${response.submissionId}`, { state: { evaluation: response } });
    } catch (err) {
      setError(err.message);
      setNotice("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitTask = () => {
    const hasDraftWriting = isFinalWriting && paragraph.trim().length > 0 && !submitting;
    const shouldConfirm = hasActiveIncompleteProgress || hasDraftWriting || checkingAnswer || submitting;

    if (
      shouldConfirm &&
      !window.confirm("Are you sure you want to leave this task? Your saved progress will stay on this device.")
    ) {
      return;
    }

    navigate(`/mini-topics/${miniTopicId}`);
  };

  const optionClass = (option) => {
    const selected = answers[currentItem._id] === option;
    const isCorrectOption = isAcceptedAnswer(option, [currentItem.correctAnswer]);

    if (!checked) {
      return selected ? "border-secondary bg-violet-700 font-black text-white" : "border-border bg-surface text-primary hover:border-secondary";
    }

    if (isCorrectOption) return "border-success bg-success/10 font-black text-success";
    if (selected) return "border-danger bg-danger/10 text-danger";
    return "border-border bg-surface text-muted opacity-70";
  };

  const renderCurrentQuestion = () => {
    if (!currentItem) return null;
    const givenWords = currentItem.questionType === "SENTENCE_WRITING" ? getSentenceKeywords(currentItem) : getGivenWords(currentItem);

    if (currentItem.questionType === "MCQ") {
      const displayOptions = shuffledOptionsById[currentItem._id] || currentItem.options;

      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {displayOptions.map((option) => (
            <button
              key={option}
              type="button"
              disabled={checked}
              onClick={() => handleAnswerChange(currentItem._id, option)}
              className={`min-h-20 rounded-paper border px-5 py-4 text-left text-lg transition duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/40 ${optionClass(option)}`}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (currentItem.questionType === "GAP_FILL") {
      const resultClass = checked
        ? currentResult?.isCorrect
          ? "border-success bg-success/10 text-success"
          : "border-danger bg-danger/10 text-danger"
        : "border-border bg-surface text-primary";

      return (
        <input
          type="text"
          value={answers[currentItem._id] || ""}
          disabled={checked}
          onChange={(event) => handleAnswerChange(currentItem._id, event.target.value)}
          className={`w-full rounded-paper border px-4 py-4 text-xl transition ${resultClass}`}
          placeholder="Type your answer"
        />
      );
    }

    if (currentItem.questionType === "UNSCRAMBLE") {
      const wrongWordIndexes = checked && currentResult && !currentResult.isCorrect ? currentResult.wrongWordIndexes || [] : [];

      return (
        <div className="space-y-4">
          <div className="unscramble-answer-box min-h-20 rounded-paper border p-4">
            <p className="mb-2 font-display text-base font-bold text-primary">Your sentence</p>
            <div className="flex min-h-10 flex-wrap gap-2">
              {selectedChips.length ? (
                selectedChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={checked}
                    onClick={() => returnChip(chip)}
                    className={`rounded-paper border px-3 py-2 font-semibold transition duration-200 hover:-translate-y-0.5 hover:border-warning focus-visible:outline focus-visible:outline-4 focus-visible:outline-warning/30 disabled:opacity-100 ${
                      checked && currentResult?.isCorrect
                        ? "border-success/40 bg-success/10 text-success"
                        : wrongWordIndexes.includes(selectedChips.indexOf(chip))
                          ? "border-danger/40 bg-danger/10 text-danger underline decoration-danger decoration-2 underline-offset-4"
                          : "unscramble-selected-chip border-secondary/30 bg-surface text-primary"
                    }`}
                    aria-label={`Remove ${chip.word} from your answer`}
                  >
                    {chip.word}
                  </button>
                ))
              ) : (
                <span className="text-base text-muted">Choose word chips below.</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                disabled={checked}
                onClick={() => selectChip(chip)}
                className="rounded-paper border border-border bg-surface px-3 py-2 font-semibold text-primary transition hover:border-secondary focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/40 disabled:opacity-50"
              >
                {chip.word}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={resetChips} disabled={checked}>
              <RotateCcw aria-hidden="true" size={16} />
              Reset
            </Button>
          </div>
        </div>
      );
    }

    if (currentItem.questionType === "MATCHING") {
      const pairs = currentItem.matchingData?.pairs || [];
      const options = shuffledOptionsById[currentItem._id] || [];
      const currentAnswers = answers[currentItem._id] || {};
      
      const selectedValues = Object.values(currentAnswers);
      const availableOptions = options.filter(opt => !selectedValues.includes(opt));

      return (
        <div className="rounded-paper border border-border bg-paperSoft p-6">
          <p className="font-display text-xl font-black text-primary mb-6">{currentItem.matchingData?.question || "Match the modal verbs with the correct sentences."}</p>
          <div className="space-y-5">
            {pairs.map((pair, index) => {
              const selectedValue = currentAnswers[index] || "";
              const isPairCorrect = checked ? normalize(selectedValue) === normalize(pair.answer) : null;
              
              let zoneClass = "border-2 border-dashed border-border bg-surface hover:border-secondary hover:bg-secondary/5";
              if (checked) {
                if (isPairCorrect) {
                  zoneClass = "border-success bg-success/10 text-success font-bold";
                } else {
                  zoneClass = "border-danger bg-danger/10 text-danger font-bold";
                }
              } else if (selectedValue) {
                zoneClass = "border-secondary bg-violet-50 text-secondary font-bold shadow-sm";
              } else if (activeMatchingChip) {
                zoneClass = "border-warning border-dashed bg-warning/5 animate-pulse";
              }
              
              const handleDrop = (e) => {
                e.preventDefault();
                if (checked) return;
                const opt = e.dataTransfer.getData("text/plain");
                if (opt) {
                  handleAnswerChange(currentItem._id, opt, index);
                }
              };

              const handleZoneClick = () => {
                if (checked) return;
                if (selectedValue) {
                  // Click to return/remove chip
                  const newAnswers = { ...currentAnswers };
                  delete newAnswers[index];
                  setAnswers((prev) => ({ ...prev, [currentItem._id]: newAnswers }));
                } else if (activeMatchingChip) {
                  // Place active chip
                  handleAnswerChange(currentItem._id, activeMatchingChip, index);
                  setActiveMatchingChip(null);
                }
              };

              // Split by blank line e.g. ______ or ______ (should) or ______ (must)
              const parts = pair.question.split(/_{2,}/);

              return (
                <div key={index} className="flex flex-col p-4 bg-white rounded-paper border border-border shadow-sm gap-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-base leading-8 text-text font-display font-medium">
                    <span className="font-semibold text-muted mr-1">{index + 11}.</span>
                    <span>{parts[0]}</span>
                    
                    <div
                      onDragOver={(e) => !checked && e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={handleZoneClick}
                      className={`inline-flex items-center justify-center min-w-[130px] h-10 px-3 py-1.5 rounded-paper border cursor-pointer text-base transition-all duration-200 ${zoneClass}`}
                    >
                      {selectedValue ? (
                        <span className="font-bold">{selectedValue}</span>
                      ) : (
                        <span className="text-muted text-xs font-mono uppercase tracking-wider">Drop / Click here</span>
                      )}
                    </div>

                    {parts[1] && <span>{parts[1]}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="font-mono text-xs uppercase tracking-wider text-muted mb-4 font-black">
              Available Modal Verbs (Drag or Click to place)
            </p>
            <div className="flex flex-wrap gap-3">
              {availableOptions.map((opt) => {
                const isActive = activeMatchingChip === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={checked}
                    draggable={!checked}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", opt);
                    }}
                    onClick={() => {
                      if (checked) return;
                      // Auto place in first empty slot if clicked directly
                      const firstEmptyIdx = pairs.findIndex((_, idx) => !currentAnswers[idx]);
                      if (firstEmptyIdx !== -1) {
                        handleAnswerChange(currentItem._id, opt, firstEmptyIdx);
                      } else {
                        setActiveMatchingChip(isActive ? null : opt);
                      }
                    }}
                    className={`px-4 py-2.5 text-base font-bold rounded-paper border transition shadow-sm hover:-translate-y-0.5 active:scale-95 ${
                      isActive
                        ? "border-warning bg-warning/20 text-warning scale-105 shadow-tactile animate-pulse"
                        : "border-secondary/30 bg-surface text-primary hover:border-secondary focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/40"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (currentItem.questionType === "GRAMMAR_TABLE") {
      const challenge = currentItem.grammarTableChallenge || {};
      const tables = challenge.tables?.length
        ? challenge.tables
        : [
            { key: "A", label: "Table A", form: currentItem.grammarSummary?.form, use: currentItem.grammarSummary?.use, example: currentItem.grammarSummary?.example },
            { key: "B", label: "Table B", form: "Incorrect form", use: "This table does not explain the rule accurately.", example: "Students should to study." }
          ];

      return (
        <div className="grid gap-4 md:grid-cols-2">
          {tables.map((table) => {
            const hasAnswer = !!answers[currentItem._id];
            const selected = answers[currentItem._id] === table.key;
            const correct = table.key === (challenge.correctTable || currentItem.correctAnswer || "A");
            const checkedClass = checked
              ? correct
                ? "grammar-table-card-correct"
                : selected
                  ? "grammar-table-card-wrong"
                  : "grammar-table-card-muted"
              : selected
                ? (table.key === "A" ? "grammar-table-card-selected-a" : "grammar-table-card-selected-b")
                : hasAnswer
                  ? "grammar-table-card-unselected"
                  : "grammar-table-card-idle";

            return (
              <button
                key={table.key}
                type="button"
                disabled={checked}
                onClick={() => handleAnswerChange(currentItem._id, table.key)}
                className={`grammar-table-card overflow-hidden rounded-paper border text-left shadow-tactile transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/40 ${checkedClass}`}
              >
                <div className={`grammar-table-card-header px-5 py-3 ${table.key === "A" ? "grammar-table-card-header-a" : "grammar-table-card-header-b"}`}>
                  <p className="font-display text-xl font-black">
                    {table.label || `Table ${table.key}`}
                  </p>
                </div>
                <dl className="divide-y divide-border text-base">
                  <div className="grid gap-2 px-5 py-4 sm:grid-cols-[96px_1fr]">
                    <dt className="font-display font-bold text-primary">Form</dt>
                    <dd className="text-muted" style={{ whiteSpace: 'pre-line' }}>{table.form}</dd>
                  </div>
                  <div className="grid gap-2 px-5 py-4 sm:grid-cols-[96px_1fr]">
                    <dt className="font-display font-bold text-primary">Use</dt>
                    <dd className="text-muted" style={{ whiteSpace: 'pre-line' }}>{table.use}</dd>
                  </div>
                  <div className="grid gap-2 px-5 py-4 sm:grid-cols-[96px_1fr]">
                    <dt className="font-display font-bold text-primary">Example</dt>
                    <dd className="font-semibold text-primary" style={{ whiteSpace: 'pre-line' }}>{table.example}</dd>
                  </div>
                </dl>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="rounded-paper border border-border bg-paperSoft p-5">
        <p className="font-display text-xl font-black text-primary mb-5">{currentItem.question}</p>
        {givenWords.length > 0 && (
          <div className="mt-4">
            <p className="font-mono text-sm uppercase text-muted">Keywords</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {givenWords.map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm font-bold text-primary"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
        <label className="mt-5 block">
          <span className="font-display text-base font-bold text-primary mb-2 block">Your sentence</span>
          <textarea
            value={answers[currentItem._id] || ""}
            disabled={checked}
            onChange={(event) => handleAnswerChange(currentItem._id, event.target.value)}
            className="mt-2 min-h-28 w-full rounded-paper border border-border bg-surface px-4 py-4 text-lg leading-8 disabled:opacity-80"
            placeholder="Write one complete sentence"
          />
        </label>
      </div>
    );
  };

  const renderSummary = () => {
    const firstScore = firstAttemptCorrect ?? masteredCount;
    const canSkipRetry = firstScore >= SKIP_RETRY_THRESHOLD;

    return (
      <Card className="p-7">
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${taskCompleted ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
            {taskCompleted ? <Trophy aria-hidden="true" size={30} /> : <RotateCcw aria-hidden="true" size={30} />}
          </div>
          <div>
            <p className="font-mono text-sm uppercase text-secondary">Task Summary</p>
            <h2 className="mt-1 font-display text-3xl font-black text-primary">
              {taskCompleted
                ? "Task completed."
                : canSkipRetry
                  ? "You can continue or review your missed questions."
                  : "You need at least 15 correct answers to continue. Review your missed questions."}
            </h2>
            <div className="mt-4 grid gap-3 text-lg sm:grid-cols-2">
              <p className="rounded-paper border border-border bg-paperSoft p-4">
                First attempt: <span className="font-black text-primary">{firstScore} / {totalItems}</span>
              </p>
              <p className="rounded-paper border border-border bg-paperSoft p-4">
                Final mastery: <span className="font-black text-primary">{taskCompleted ? totalItems : masteredCount} / {totalItems}</span>
              </p>
            </div>
            {!taskCompleted && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" onClick={retryMissed}>
                  <RotateCcw aria-hidden="true" size={17} />
                  Retry Missed Questions
                </Button>
                {canSkipRetry && (
                  <Button type="button" variant="outline" onClick={skipRetry} disabled={submitting}>
                    Skip Retry
                  </Button>
                )}
              </div>
            )}
            {taskCompleted && (
              <Button as={Link} to={`/mini-topics/${miniTopicId}`} variant="secondary" className="mt-6">
                Back to Mission Map
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderPractice = () => {
    if (mode === "summary" || mode === "complete") return renderSummary();

    return (
      <Card className="task-practice-card overflow-hidden p-0">
        <div className="border-b border-border bg-paperSoft p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-sm uppercase text-secondary">
                {mode === "retry" ? `Review ${currentIndex + 1} of ${queueIds.length}` : `Question ${currentGlobalNumber} of ${totalItems}`}
              </p>
              <h2 className="mt-1 font-display text-2xl font-black text-primary">{currentItem?.sectionLabel}</h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-sm text-muted">{progressPercent}% mastered</p>
              {autosaveStatus && autosaveAvailable && (
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-success">{autosaveStatus}</p>
              )}
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full border border-border bg-surface">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progressPercent, currentGlobalNumber === 1 ? 4 : progressPercent)}%` }}
            />
          </div>
        </div>

        <div className="p-6">
          {currentItem?.questionType !== "SENTENCE_WRITING" && currentItem?.question?.trim() && (
            <p className="mb-5 font-display text-xl font-black leading-8 text-primary">{currentItem?.question}</p>
          )}
          {renderCurrentQuestion()}
          <FeedbackPanel
            item={currentItem}
            result={checked ? currentResult : null}
            activeIssueIndex={activeIssueIndex}
            setActiveIssueIndex={setActiveIssueIndex}
          />

          <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-base text-muted">
              {checkingAnswer
                ? currentItem?.questionType === "SENTENCE_WRITING"
                  ? "Checking your sentence..."
                  : "Checking your answer..."
                : checked
                  ? "Review the feedback, then continue."
                  : "Answer the question, then check it."}
            </p>
            <div className="flex gap-3">
              {!checked ? (
                <Button id="check-answer-btn" type="button" variant="secondary" onClick={handleCheck} disabled={checkingAnswer}>
                  {checkingAnswer && currentItem?.questionType === "SENTENCE_WRITING" ? "Checking your sentence..." : checkingAnswer ? "Checking Answer..." : "Check Answer"}
                </Button>
              ) : (
                <Button id="next-question-btn" type="button" variant="secondary" onClick={handleNext} disabled={submitting}>
                  {currentIndex < queueIds.length - 1 ? "Next Question" : "View Results"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderFinalWriting = () => {
    if (!data?.finalWriting?.isUnlocked) {
      return (
        <Card className="p-7">
          <h2 className="font-display text-3xl font-bold text-primary">Final Writing Locked</h2>
          <p className="mt-3 text-lg leading-8 text-muted">
            Complete Task 1, Task 2, Task 3, Task 4, and Task 5 before opening Final Writing.
          </p>
        </Card>
      );
    }
    const displayModels = getFinalWritingModels(data?.miniTopic, data?.finalWriting);
    const activeSupport = finalWritingSupportTabs.find((tab) => tab.id === activeSupportTab) || finalWritingSupportTabs[0];
    const activeSupportItems = activeSupport.getItems(data?.miniTopic);
    const finalWritingModelParagraphs =
      data?.miniTopic?.finalWritingModelParagraphs || data?.finalWriting?.finalWritingModelParagraphs || [];

    if (import.meta.env.DEV) {
      console.log("Final writing model paragraphs:", finalWritingModelParagraphs);
    }

    return (
      <Card className="final-writing-card p-7">
        <form onSubmit={handleWritingSubmit}>
          <div className="mb-5">
            <p className="font-mono text-sm uppercase text-secondary">Final Writing</p>
            <h2 className="mt-2 font-display text-3xl font-black text-primary">100-word Paragraph</h2>
            <p className="mt-3 rounded-paper border border-border bg-paperSoft p-4 text-lg font-semibold text-text">
              Write a short paragraph using grammar from Task 1 to Task 5.
            </p>
          </div>

          <div className="mb-5 rounded-paper writing-question-box-gold p-5">
            <p className="font-display text-xs font-black uppercase tracking-wider writing-question-title">
              Writing Question
            </p>
            <p className="mt-2 text-lg font-bold leading-8 writing-question-text uppercase tracking-wide">
              {data.miniTopic.writingQuestion}
            </p>
          </div>

          <div className="final-writing-tabs mb-5 rounded-paper border border-border bg-surface p-4">
            <div className="grid gap-3 md:grid-cols-[260px_1fr]">
              <div className="flex flex-col gap-2" role="tablist" aria-label="Writing support">
                {finalWritingSupportTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeSupportTab === tab.id}
                    onClick={() => setActiveSupportTab(tab.id)}
                    className={`rounded-paper border px-4 py-3 text-left font-display text-base font-black transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/30 ${
                      activeSupportTab === tab.id
                        ? "border-secondary bg-secondary text-white"
                        : "border-border bg-white text-primary hover:border-secondary"
                    }`}
                  >
                    {tab.title}
                  </button>
                ))}
              </div>
              <div className="rounded-paper border border-border bg-white p-5">
                <h3 className="font-display text-xl font-black text-primary">{activeSupport.title}</h3>
                {activeSupportItems.length ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-muted">
                    {activeSupportItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-base text-muted">No support notes are available for this section.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-paper border border-border bg-paperSoft p-5">
            <p className="font-display text-xl font-bold text-primary">Model Paragraphs</p>
            <p className="mt-2 text-base leading-7 text-muted">
              One of these paragraphs is stronger. Open a model only when you need a guide.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {displayModels.map((model, index) => (
                <button
                  key={`model-${index}`}
                  type="button"
                  onClick={() => setActiveModelIndex(activeModelIndex === index ? null : index)}
                  className={`rounded-paper border p-4 text-left shadow-tactile transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/30 ${
                    activeModelIndex === index ? "border-secondary bg-white" : "border-border bg-surface hover:border-secondary"
                  }`}
                >
                  <h3 className="font-display text-lg font-bold text-primary">{model.label}</h3>
                  <p className="mt-2 text-sm font-semibold text-secondary">
                    {activeModelIndex === index ? "Hide model paragraph" : "Click to view model paragraph"}
                  </p>
                </button>
              ))}
            </div>
            {activeModelIndex !== null && displayModels[activeModelIndex] && (
              <article className="mt-4 rounded-paper border border-secondary/30 bg-white p-5 shadow-tactile">
                <h3 className="font-display text-lg font-black text-primary">{displayModels[activeModelIndex].label}</h3>
                <p className="mt-3 text-base leading-8 text-muted">{displayModels[activeModelIndex].text}</p>
              </article>
            )}
          </div>

          <label className="block">
            <span className="font-display text-xl font-bold text-primary">Your paragraph</span>
            <textarea
              value={paragraph}
              onChange={(event) => setParagraph(event.target.value)}
              className="mt-3 min-h-[280px] w-full rounded-paper border border-border bg-surface px-4 py-3.5 text-lg leading-8"
              placeholder="Write your paragraph here"
            />
          </label>
          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className={`font-mono text-base ${isValidLength ? "text-success" : "text-muted"}`}>
              {wordCount} words / required 80-130
            </p>
            <Button type="submit" variant="secondary" disabled={submitting}>
              <Send aria-hidden="true" size={17} />
              {submitting ? "Submitting Final Writing" : "Submit Final Writing"}
            </Button>
          </div>
        </form>
      </Card>
    );
  };

  if (loading) {
    return <LoadingState label="Loading task" />;
  }

  if (!activeStep) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="p-7">
          <h1 className="font-display text-3xl font-black text-primary">Task not found</h1>
          <p className="mt-3 text-lg text-muted">Choose a task from the mission map.</p>
          <Button as={Link} to={`/mini-topics/${miniTopicId}`} variant="secondary" className="mt-6">
            <ArrowLeft aria-hidden="true" size={17} />
            Back to Map
          </Button>
        </Card>
      </section>
    );
  }

  const isLocked = !activeStep?.isUnlocked;

  return (
    <section className="mx-auto max-w-[92rem] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">{data?.topic?.title}</p>
          <h1 className="mt-2 font-display text-3xl font-black text-primary sm:text-4xl">
            {isFinalWriting ? "Final Writing" : `Task ${activeTask.taskNumber}: ${activeTask.grammarTitle}`}
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-muted">
            Mission {data?.miniTopic?.order}: {data?.miniTopic?.title}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleExitTask}>
          <ArrowLeft aria-hidden="true" size={17} />
          Back to Map
        </Button>
      </div>

      {error && <p className="mb-6 rounded-paper border border-danger/30 bg-danger/10 p-4 text-danger">{error}</p>}
      {notice && (
        <p className="mb-6 rounded-paper border border-secondary/30 bg-surface p-4 font-semibold text-primary" role="status">
          {notice}
        </p>
      )}
      {pendingResumeSession && !isFinalWriting && !isLocked && (
        <ResumeTaskModal
          questionNumber={(pendingResumeSession.currentIndex || 0) + 1}
          totalItems={pendingResumeSession.totalItems || totalItems}
          onContinue={() => restoreTaskSession(pendingResumeSession)}
          onStartOver={startTaskOver}
        />
      )}

      {isFinalWriting ? (
        renderFinalWriting()
      ) : isLocked ? (
        <Card className="p-7">
          <h2 className="font-display text-3xl font-bold text-primary">Task Locked</h2>
          <p className="mt-3 text-lg leading-8 text-muted">
            Complete the previous grammar task to unlock this task.
          </p>
        </Card>
      ) : pendingResumeSession ? null : (
        renderPractice()
      )}
    </section>
  );
};

export default TaskActivityPage;
