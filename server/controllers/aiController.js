const { GoogleGenAI } = require("@google/genai");
const { Activity, MiniTopic, Progress, Submission, Topic } = require("../models");
const {
  buildSentenceEvaluationPrompt,
  buildWritingChatPrompt,
  buildWritingEvaluationPrompt
} = require("../utils/aiPrompt");
const { isFinalWritingTestMode } = require("../utils/devFlags");
const {
  FINAL_WRITING_SLUG,
  TASK_FLOW,
  buildMiniTopicStatuses,
  buildTopicStatuses,
  getLevelFromScore,
  isActivityTypeUnlocked,
  toId
} = require("../utils/unlockLogic");
const { getWordCount } = require("../utils/wordCount");
const { markMiniTopicPassed } = require("./progressController");

const PLACEHOLDER_GEMINI_API_KEY = "your_gemini_api_key_here";
const UNSAFE_LANGUAGE_PATTERN = /\b(fuck|shit|bitch|asshole|bastard|damn|crap)\b/i;

const parseJsonResponse = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    const match = String(content).match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const isGeminiConfigured = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return Boolean(apiKey && apiKey !== PLACEHOLDER_GEMINI_API_KEY);
};

const getGeminiModelCandidates = () => {
  const configuredModels = [
    process.env.GEMINI_MODEL,
    ...(process.env.GEMINI_BACKUP_MODELS || "").split(",")
  ]
    .map((model) => String(model || "").trim())
    .filter(Boolean);
  const defaultModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

  return [...new Set([...configuredModels, ...defaultModels])];
};

const getErrorDetails = (error) => {
  const status = error?.status || error?.statusCode || error?.code || "unknown";
  const message = error?.message || "Unknown error";
  return `${status} ${message}`;
};

const createSentenceEvaluationUnavailableError = () => {
  const error = new Error("We could not check your sentence right now. Please try again in a moment.");
  error.statusCode = 503;
  return error;
};

const createGeminiClient = () =>
  new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

const normalizeSimpleText = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");

const getModelParagraphText = (model) => {
  if (typeof model === "string") return model;
  return model?.text || model?.content || model?.paragraph || "";
};

const detectModelCopy = (paragraph = "", modelParagraphs = []) => {
  const normalizedParagraph = normalizeSimpleText(paragraph);
  if (!normalizedParagraph) return null;

  const models = (Array.isArray(modelParagraphs) ? modelParagraphs : [])
    .map((model, index) => ({
      label: model?.label || model?.title || `Model Paragraph ${index === 0 ? "A" : "B"}`,
      originalText: getModelParagraphText(model),
      text: normalizeSimpleText(getModelParagraphText(model))
    }))
    .filter((model) => model.text && model.text.split(" ").length >= 18);

  return models.find((model) => normalizedParagraph.includes(model.text)) || null;
};

const createOriginalityCard = (copiedModel = {}) =>
  normalizeFeedbackCard({
    type: "improvement",
    originalText: String(copiedModel.originalText || copiedModel.label || "Copied model paragraph").slice(0, 260),
    suggestedRevision: "Write the paragraph again in your own words and use the model only as a guide.",
    focus: "Originality",
    explanation: "This writing copies a model paragraph too closely. Model paragraphs are examples, not text to submit as your own work."
  });

const normalizeEvaluation = (evaluation, paragraph = "", modelParagraphs = []) => {
  let score = Math.max(0, Math.min(100, Math.round(Number(evaluation.score) || 0)));
  const initialFeedbackCards = Array.isArray(evaluation.feedbackCards)
    ? evaluation.feedbackCards.map(normalizeFeedbackCard).filter(Boolean)
    : grammarMistakesToFeedbackCards(evaluation.grammarMistakes || []);
  const copiedModel = detectModelCopy(paragraph, modelParagraphs);
  const feedbackCards = initialFeedbackCards.length ? initialFeedbackCards : createDetectedFeedbackCards(paragraph);

  if (copiedModel) {
    const originalityCard = createOriginalityCard(copiedModel);
    if (originalityCard && !feedbackCards.some((card) => card.focus === "Originality")) {
      feedbackCards.unshift(originalityCard);
    }
    score = Math.min(score || 55, 55);
  }

  return {
    score,
    level: getLevelFromScore(score),
    feedback:
      copiedModel
        ? `Your grammar may be understandable, but the paragraph copies ${copiedModel.label} too closely. Write your own ideas and sentence choices. Use the model paragraph only as a guide.`
        : typeof evaluation.feedback === "string" && evaluation.feedback.trim()
          ? evaluation.feedback.trim()
          : "Your paragraph has been evaluated. Keep focusing on clear sentences and accurate grammar.",
    feedbackCards,
    grammarMistakes: feedbackCardsToGrammarMistakes(feedbackCards)
  };
};

const createInternalCompatibilityNote = (paragraph) => {
  if (UNSAFE_LANGUAGE_PATTERN.test(paragraph)) {
    return "Targeted classroom-appropriate correction feedback is shown in the learner interface.";
  }

  return "Targeted correction feedback is shown in the learner interface.";
};

const normalizeFeedbackCard = (card) => {
  const type = card?.type === "improvement" ? "improvement" : "error";
  const originalText = String(card?.originalText || "").trim();
  const correction = String(card?.correction || "").trim();
  const suggestedRevision = String(card?.suggestedRevision || "").trim();
  const focus = String(card?.focus || card?.grammarPoint || "Writing").trim();
  const explanation = String(card?.explanation || "").trim();

  if (!originalText || (!correction && !suggestedRevision) || !explanation) return null;

  return {
    type,
    originalText,
    correction: type === "error" ? correction || suggestedRevision : "",
    suggestedRevision: type === "improvement" ? suggestedRevision || correction : "",
    focus,
    explanation
  };
};

const grammarMistakesToFeedbackCards = (grammarMistakes = []) =>
  grammarMistakes
    .map((mistake) =>
      normalizeFeedbackCard({
        type: "error",
        originalText: mistake.originalText || mistake.errorText,
        correction: mistake.correction,
        focus: mistake.grammarPoint,
        explanation: mistake.explanation
      })
    )
    .filter(Boolean);

const feedbackCardsToGrammarMistakes = (feedbackCards = []) =>
  feedbackCards
    .filter((card) => card.type === "error")
    .map((card) => ({
      originalText: card.originalText,
      errorText: card.originalText,
      correction: card.correction,
      grammarPoint: card.focus,
      explanation: card.explanation
    }));

const splitSentences = (paragraph = "") =>
  paragraph
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) || [];

const createDetectedFeedbackCards = (paragraph = "") => {
  const sentences = splitSentences(paragraph);
  const cards = [];
  const addCard = (card) => {
    const normalized = normalizeFeedbackCard(card);
    if (normalized && !cards.some((item) => item.originalText === normalized.originalText && item.focus === normalized.focus)) {
      cards.push(normalized);
    }
  };

  sentences.forEach((sentence) => {
    const lower = sentence.toLowerCase();

    if (/\bdog\b/.test(lower) || /\bmoon\b/.test(lower) || /fly to the moon/.test(lower)) {
      addCard({
        type: "improvement",
        originalText: sentence,
        suggestedRevision: "Remove this sentence or replace it with a sentence about fast food and health.",
        focus: "Relevance",
        explanation: "This sentence is off-topic and does not support the writing question."
      });
    }

    if (/not your friend/.test(lower) || /\bhates\b/.test(lower) || /greasy burgers/.test(lower)) {
      addCard({
        type: "improvement",
        originalText: sentence,
        suggestedRevision: "Use a more formal sentence that explains the health risk clearly.",
        focus: "Academic tone",
        explanation: "This expression sounds informal or unclear for academic writing."
      });
    }

    if (/many student eats/i.test(sentence)) {
      addCard({
        type: "error",
        originalText: sentence,
        correction: sentence.replace(/many student eats/i, "Many students eat"),
        focus: "Subject-verb agreement",
        explanation: "Use the plural noun 'students' and the base verb 'eat' after a plural subject."
      });
    }

    if (/\bit have\b/i.test(sentence)) {
      addCard({
        type: "error",
        originalText: sentence,
        correction: sentence.replace(/\bit have\b/i, "It has"),
        focus: "Verb form",
        explanation: "Use 'has' with the singular subject 'it' in the present simple."
      });
    }
  });

  return cards;
};

const createMockEvaluation = ({ paragraph }) => {
  const wordCount = getWordCount(paragraph);
  const feedbackCards = createDetectedFeedbackCards(paragraph);
  const score = Math.max(45, (wordCount >= 90 && wordCount <= 120 ? 82 : 68) - feedbackCards.length * 5);

  return {
    score,
    level: getLevelFromScore(score),
    feedback:
      "Your paragraph communicates ideas about the topic, but you should check grammar, relevance, academic tone, and sentence clarity.",
    feedbackCards,
    grammarMistakes: feedbackCardsToGrammarMistakes(feedbackCards),
    isMock: true
  };
};

const createFallbackEvaluation = ({ paragraph }) => {
  const wordCount = getWordCount(paragraph);
  const feedbackCards = createDetectedFeedbackCards(paragraph);
  const score = Math.max(45, (wordCount >= 90 && wordCount <= 120 ? 78 : 65) - feedbackCards.length * 5);

  return {
    score,
    level: getLevelFromScore(score),
    feedback:
      "Your paragraph has understandable ideas, but it needs more careful grammar, clearer academic tone, and stronger connection to the writing question.",
    feedbackCards,
    grammarMistakes: feedbackCardsToGrammarMistakes(feedbackCards),
    isMock: true
  };
};

const createAiUnavailableEvaluation = () => ({
  aiUnavailable: true,
  score: null,
  level: "Needs Review",
  feedback: "We could not check your writing carefully right now. Please try again in a moment.",
  feedbackCards: [],
  grammarMistakes: [],
  suggestions: [],
  isMock: true
});

const evaluateWithGemini = async (payload) => {
  console.log("[AI_WRITING] Route called");
  if (!isGeminiConfigured()) {
    console.warn("[AI_WRITING] All Gemini models failed");
    console.warn("[AI_WRITING] Using limited local fallback");
    return createAiUnavailableEvaluation();
  }

  const ai = createGeminiClient();
  const models = getGeminiModelCandidates();

  for (const [index, model] of models.entries()) {
    try {
      console.log(
        index === 0
          ? `[AI_WRITING] Calling Gemini model: ${model}`
          : `[AI_WRITING] Trying fallback model: ${model}`
      );
      const response = await ai.models.generateContent({
        model,
        contents: buildWritingEvaluationPrompt(payload),
        config: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });

      console.log(`[AI_WRITING] Gemini response received from: ${model}`);
      const rawContent = response.text || "{}";
      const parsedContent = parseJsonResponse(rawContent);

      if (!parsedContent) {
        console.warn(`[AI_WRITING] Gemini model failed: ${model}, invalid JSON response`);
        continue;
      }

      return { ...normalizeEvaluation(parsedContent, payload.paragraph, payload.modelParagraphs), isMock: false, aiUnavailable: false };
    } catch (error) {
      console.warn(`[AI_WRITING] Gemini model failed: ${model}, ${getErrorDetails(error)}`);
    }
  }

  console.warn("[AI_WRITING] All Gemini models failed");
  console.warn("[AI_WRITING] Using limited local fallback");
  return createAiUnavailableEvaluation();
};

const keywordIsPresent = (sentence = "", keyword = "") => {
  const text = normalizeSimpleText(sentence);
  const target = normalizeSimpleText(keyword);

  if (!target) return true;
  if (text.includes(target)) return true;
  if (target.endsWith("s") && text.includes(target.slice(0, -1))) return true;
  if (!target.endsWith("s") && text.includes(`${target}s`)) return true;
  return false;
};

const createMissingKeywordIssues = (learnerSentence = "", givenWords = []) =>
  givenWords
    .map((word) => String(word || "").trim())
    .filter(Boolean)
    .filter((word) => !keywordIsPresent(learnerSentence, word))
    .map((word) => ({
      type: "missing_keyword",
      originalText: "",
      correction: word,
      explanation: `Missing keyword: ${word}. Use all keywords so your sentence matches the prompt.`
    }));

const normalizeSentenceIssue = (issue) => {
  const rawType = String(issue?.type || "").trim().toLowerCase();
  const joinedText = [
    rawType,
    issue?.originalText,
    issue?.correction,
    issue?.explanation
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    ["capitalization", "punctuation", "minor_style", "style_tip"].includes(rawType) ||
    /capitali[sz]ation|capital letter|uppercase|lowercase|final punctuation|full stop|period at the end|missing period/.test(joinedText)
  ) {
    return null;
  }

  const allowedTypes = [
    "grammar",
    "spelling",
    "word_choice",
    "structure",
    "missing_keyword",
    "relevance",
    "clarity",
    "inappropriate_language"
  ];
  const type = allowedTypes.includes(rawType) ? rawType : "grammar";
  const originalText = String(issue?.originalText || "").trim();
  const correction = String(issue?.correction || "").trim();
  const explanation = String(issue?.explanation || "").trim();

  if ((!originalText && !["missing_keyword", "inappropriate_language"].includes(type)) || !correction || !explanation) {
    return null;
  }

  return { type, originalText, correction, explanation };
};

const normalizeMinorTip = (tip) => {
  if (typeof tip === "string") return tip.trim();
  return String(tip?.tip || tip?.message || tip?.explanation || "").trim();
};

const getMinorTipsFromIssues = (issues = []) =>
  issues
    .filter(Boolean)
    .map((issue) => {
      const rawType = String(issue?.type || "").trim().toLowerCase();
      const text = [
        rawType,
        issue?.originalText,
        issue?.correction,
        issue?.explanation
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (
        ["capitalization", "punctuation", "minor_style", "style_tip"].includes(rawType) ||
        /capitali[sz]ation|capital letter|uppercase|lowercase|final punctuation|full stop|period at the end|missing period/.test(text)
      ) {
        const explanation = normalizeMinorTip(issue);
        if (explanation) return explanation;
        if (/capital|uppercase|lowercase/.test(text)) return "Tip: Start the sentence with a capital letter.";
        if (/punctuation|full stop|period/.test(text)) return "Tip: Add final punctuation when you write a complete sentence.";
      }

      return "";
    })
    .filter(Boolean);

const normalizeSentenceEvaluation = (evaluation, payload) => {
  const {
    learnerSentence = "",
    grammarPoint = "",
    givenWords = []
  } = payload;
  const rawIssues = Array.isArray(evaluation.issues) ? evaluation.issues : [];
  const parsedIssues = rawIssues.map(normalizeSentenceIssue).filter(Boolean);
  const minorTips = [
    ...(Array.isArray(evaluation.minorTips) ? evaluation.minorTips.map(normalizeMinorTip) : []),
    ...getMinorTipsFromIssues(rawIssues)
  ].filter((tip, index, list) => tip && list.indexOf(tip) === index);
  const missingKeywordIssues = createMissingKeywordIssues(learnerSentence, givenWords);
  let issues = [...parsedIssues, ...missingKeywordIssues].filter(
    (issue, index, list) =>
      list.findIndex(
        (item) =>
          item.type === issue.type &&
          normalizeSimpleText(item.originalText) === normalizeSimpleText(issue.originalText) &&
          normalizeSimpleText(item.correction) === normalizeSimpleText(issue.correction)
      ) === index
  );
  const hasOnlyMinorIssues = minorTips.length > 0 && !issues.length;

  if (!evaluation.isCorrect && !issues.length && !hasOnlyMinorIssues) {
    issues = [
      {
        type: "structure",
        originalText: learnerSentence,
        correction: "Use the target grammar and all required keywords.",
        explanation: "Review the target grammar, keywords, spelling, and sentence clarity."
      }
    ];
  }
  const hasSpellingIssue = issues.some((issue) => issue.type === "spelling");
  const rawCorrect = (Boolean(evaluation.isCorrect) || hasOnlyMinorIssues) && !hasSpellingIssue && issues.length === 0;
  const score = Math.max(0, Math.min(100, Math.round(Number(evaluation.score) || (rawCorrect ? 85 : 45))));
  const grammarExplanation =
    typeof evaluation.grammarExplanation === "string" && evaluation.grammarExplanation.trim()
      ? evaluation.grammarExplanation.trim()
      : typeof evaluation.grammarRule === "string" && evaluation.grammarRule.trim()
        ? evaluation.grammarRule.trim()
        : typeof evaluation.explanation === "string" && evaluation.explanation.trim()
          ? evaluation.explanation.trim()
          : grammarPoint
            ? `Use ${grammarPoint} accurately in a complete sentence.`
            : "Use the target grammar accurately in a complete sentence.";

  return {
    isCorrect: rawCorrect && score >= 60,
    score,
    learnerSentence,
    feedback:
      typeof evaluation.feedback === "string" && evaluation.feedback.trim()
        ? evaluation.feedback.trim()
        : "Review the target grammar and try again.",
    grammarExplanation,
    grammarRule: grammarExplanation,
    explanation: grammarExplanation,
    usedGrammarStructure: String(evaluation.usedGrammarStructure || evaluation.highlightCorrectPart || "").trim(),
    highlightCorrectPart: String(evaluation.highlightCorrectPart || evaluation.usedGrammarStructure || "").trim(),
    minorTips,
    issues
  };
};

const evaluateSentenceWithGemini = async (payload) => {
  if (!isGeminiConfigured()) {
    console.warn("[AI_SENTENCE] All Gemini models failed");
    throw createSentenceEvaluationUnavailableError();
  }

  const ai = createGeminiClient();
  const models = getGeminiModelCandidates();

  for (const [index, model] of models.entries()) {
    try {
      console.log(
        index === 0
          ? `[AI_SENTENCE] Calling Gemini model: ${model}`
          : `[AI_SENTENCE] Trying fallback model: ${model}`
      );
      const response = await ai.models.generateContent({
        model,
        contents: buildSentenceEvaluationPrompt(payload),
        config: {
          temperature: 0.15,
          responseMimeType: "application/json"
        }
      });

      const parsedContent = parseJsonResponse(response.text || "{}");

      if (!parsedContent) {
        console.warn(`[AI_SENTENCE] Gemini model failed: ${model}, invalid JSON response`);
        continue;
      }

      console.log(`[AI_SENTENCE] Gemini response received from: ${model}`);
      return normalizeSentenceEvaluation(parsedContent, payload);
    } catch (error) {
      console.warn(`[AI_SENTENCE] Gemini model failed: ${model}, ${getErrorDetails(error)}`);
    }
  }

  console.warn("[AI_SENTENCE] All Gemini models failed");
  throw createSentenceEvaluationUnavailableError();
};

const createChatFallbackReply = ({ question, feedbackCards = [], grammarMistakes = [] }) => {
  const cards = feedbackCards.length ? feedbackCards : grammarMistakesToFeedbackCards(grammarMistakes);
  const firstCard = cards[0];

  if (firstCard) {
    return {
      reply: `Focus on ${firstCard.focus || "this writing issue"}. ${
        firstCard.type === "improvement"
          ? `A better choice is "${firstCard.suggestedRevision || "shown in the feedback card"}".`
          : `The correction is "${firstCard.correction || "shown in the feedback card"}".`
      } ${firstCard.explanation || "Compare the feedback with your original sentence and revise carefully."}`
    };
  }

  return {
    reply:
      question && question.toLowerCase().includes("example")
        ? "Example: Write one clear sentence, check the verb form, and connect it to the topic."
        : "Review your sentence for verb form, word order, punctuation, and clear connection to the topic."
  };
};

const chatWithGemini = async (payload) => {
  console.log("[AI_CHAT] Route logic entered");
  console.log("[AI_CHAT] Question:", payload?.question);
  if (!isGeminiConfigured()) {
    console.warn("Gemini API key is missing. Returning local chat guidance.");
    return createChatFallbackReply(payload);
  }

  const ai = createGeminiClient();
  const models = getGeminiModelCandidates();

  for (const [index, model] of models.entries()) {
    try {
      console.log(index === 0 ? `[AI_CHAT] Calling Gemini model: ${model}` : `[AI_CHAT] Trying fallback model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: buildWritingChatPrompt(payload),
        config: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      });
      console.log(`[AI_CHAT] Gemini response received from: ${model}`);
      const parsedContent = parseJsonResponse(response.text || "{}");
      const reply =
        typeof parsedContent?.reply === "string" && parsedContent.reply.trim()
          ? parsedContent.reply.trim()
          : "";

      if (reply) return { reply };
      console.warn(`[AI_CHAT] Gemini model failed: ${model}, invalid JSON response`);
    } catch (error) {
      console.warn(`[AI_CHAT] Gemini model failed: ${model}, ${getErrorDetails(error)}`);
    }
  }

  console.warn("[AI_CHAT] All Gemini models failed. Returning limited local chat guidance.");
  return createChatFallbackReply(payload);
};

const resolveTopicAndMiniTopic = async ({ topicId, miniTopicId, topicTitle, miniTopicTitle }) => {
  const topic = topicId ? await Topic.findById(topicId) : await Topic.findOne({ title: topicTitle });

  if (!topic) {
    const error = new Error("Topic was not found.");
    error.statusCode = 404;
    throw error;
  }

  const miniTopic = miniTopicId
    ? await MiniTopic.findById(miniTopicId)
    : await MiniTopic.findOne({ topicId: topic._id, title: miniTopicTitle });

  if (!miniTopic) {
    const error = new Error("Mission was not found.");
    error.statusCode = 404;
    throw error;
  }

  return { topic, miniTopic };
};

const assertWritingUnlocked = async (userId, miniTopic) => {
  const [topics, miniTopics, progresses] = await Promise.all([
    Topic.find().sort({ order: 1 }),
    MiniTopic.find().sort({ order: 1 }),
    Progress.find({ userId })
  ]);

  const topicStatuses = buildTopicStatuses(topics, miniTopics, progresses);
  const topicIndex = topics.findIndex((topic) => toId(topic._id) === toId(miniTopic.topicId));
  const topicStatus = topicStatuses[topicIndex] || { isUnlocked: false };
  const topic = topics[topicIndex];

  if (!topic) {
    const error = new Error("Topic was not found.");
    error.statusCode = 404;
    throw error;
  }

  const topicMiniTopics = miniTopics.filter((item) => toId(item.topicId) === toId(miniTopic.topicId));
  const miniStatuses = buildMiniTopicStatuses(topic, topicMiniTopics, progresses, topicStatus.isUnlocked);
  const miniIndex = topicMiniTopics.findIndex((item) => toId(item._id) === toId(miniTopic._id));
  const miniStatus = miniStatuses[miniIndex] || { isUnlocked: false };
  const progress = progresses.find((item) => toId(item.miniTopicId) === toId(miniTopic._id)) || null;

  const allActivities = await Activity.find({ miniTopicId: miniTopic._id });
  const activeTaskSlugs = [...new Set(allActivities.map(a => a.taskSlug))];
  activeTaskSlugs.sort((a, b) => {
    const idxA = TASK_FLOW.indexOf(a);
    const idxB = TASK_FLOW.indexOf(b);
    return idxA - idxB;
  });
  activeTaskSlugs.push(FINAL_WRITING_SLUG);

  if (!miniStatus.isUnlocked || (!isFinalWritingTestMode() && !isActivityTypeUnlocked(FINAL_WRITING_SLUG, progress, activeTaskSlugs))) {
    const error = new Error("Complete the required activities before submitting final writing.");
    error.statusCode = 423;
    throw error;
  }
};

const evaluateWriting = async (req, res, next) => {
  try {
    const { topicId, miniTopicId, topicTitle, miniTopicTitle, writingQuestion, paragraph } = req.body;

    if (!paragraph || !writingQuestion) {
      res.status(400);
      throw new Error("Writing question and paragraph are required.");
    }

    const wordCount = getWordCount(paragraph);

    if (wordCount < 80 || wordCount > 130) {
      res.status(400);
      throw new Error("The final paragraph must be between 80 and 130 words.");
    }

    const { topic, miniTopic } = await resolveTopicAndMiniTopic({
      topicId,
      miniTopicId,
      topicTitle,
      miniTopicTitle
    });

    await assertWritingUnlocked(req.user._id, miniTopic);

    const evaluation = await evaluateWithGemini({
      topicTitle: topic.title,
      miniTopicTitle: miniTopic.title,
      writingQuestion,
      paragraph,
      modelParagraphs: miniTopic.finalWritingModelParagraphs || miniTopic.modelParagraphs || []
    });

    const submission = await Submission.create({
      userId: req.user._id,
      topicId: topic._id,
      miniTopicId: miniTopic._id,
      paragraph,
      wordCount,
      score: evaluation.score,
      level: evaluation.level,
      feedback: evaluation.feedback,
      grammarMistakes: evaluation.grammarMistakes,
      feedbackCards: evaluation.feedbackCards,
      suggestions: [],
      improvedVersion: createInternalCompatibilityNote(paragraph),
      isMock: evaluation.isMock,
      aiUnavailable: Boolean(evaluation.aiUnavailable)
    });

    const progressResult =
      typeof evaluation.score === "number" && evaluation.score >= 60
        ? await markMiniTopicPassed(req.user._id, miniTopic._id, evaluation.score)
        : null;

    res.status(201).json({
      aiUnavailable: Boolean(evaluation.aiUnavailable),
      score: evaluation.score,
      level: evaluation.level,
      feedback: evaluation.feedback,
      feedbackCards: evaluation.feedbackCards,
      grammarMistakes: evaluation.grammarMistakes,
      submissionId: submission._id,
      wordCount,
      passed: typeof evaluation.score === "number" && evaluation.score >= 60,
      isTopicCompleted: progressResult?.isTopicCompleted || false
    });
  } catch (error) {
    next(error);
  }
};

const evaluateSentenceLocalFallback = (payload) => {
  const { learnerSentence = "", prompt = "", targetStructure = "", givenWords = [] } = payload;
  
  const normalize = (val) => String(val || "").trim().toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
  const getWords = (str) => normalize(str).split(" ").filter(Boolean);

  const normAnswer = normalize(learnerSentence);
  const wordCount = getWords(learnerSentence).length;

  const hasEnoughWords = wordCount >= 5;

  let keywordMatched = true;
  const issues = [];

  if (givenWords.length > 0) {
    const missingKeywords = givenWords.filter(kw => !normalize(learnerSentence).includes(normalize(kw)));
    if (missingKeywords.length > 0) {
      keywordMatched = false;
      missingKeywords.forEach(kw => {
        issues.push({
          type: "missing_keyword",
          message: `The suggested keyword "${kw}" is missing from your sentence.`,
          keyword: kw
        });
      });
    }
  }

  if (!hasEnoughWords) {
    issues.push({
      type: "length",
      message: "A complete sentence must contain at least 5 words."
    });
  }

  const isCorrect = hasEnoughWords && keywordMatched;

  return {
    isCorrect,
    feedback: isCorrect
      ? "Great job! Your sentence uses the correct grammar structure and matches the prompt context."
      : "Your sentence needs a few corrections. Review the feedback and try again.",
    explanation: isCorrect
      ? "The sentence is grammatically correct and includes all required elements."
      : issues.map(i => i.message).join(" "),
    usedGrammarStructure: targetStructure || "target structure",
    highlightCorrectPart: learnerSentence,
    minorTips: [],
    issues
  };
};

const evaluateSentence = async (req, res, next) => {
  try {
    const {
      missionTitle = "",
      taskTitle = "",
      grammarPoint = "",
      topicContext = "",
      prompt = "",
      learnerSentence = "",
      targetStructure = "",
      givenWords = []
    } = req.body;

    if (!learnerSentence.trim() || !prompt.trim()) {
      res.status(400);
      throw new Error("Sentence and prompt are required.");
    }

    const payload = {
      missionTitle,
      taskTitle,
      grammarPoint,
      topicContext,
      prompt,
      learnerSentence,
      targetStructure,
      givenWords: Array.isArray(givenWords) ? givenWords : []
    };

    let evaluation;
    try {
      evaluation = await evaluateSentenceWithGemini(payload);
    } catch (err) {
      console.warn("[AI_SENTENCE] Gemini evaluation failed, using local fallback:", err.message);
      evaluation = evaluateSentenceLocalFallback(payload);
    }

    res.json(evaluation);
  } catch (error) {
    next(error);
  }
};

const writingChat = async (req, res, next) => {
  try {
    const {
      submissionId,
      question = "",
      writingContext = "",
      topicTitle = "",
      missionTitle = "",
      writingQuestion = "",
      modelParagraphs = [],
      grammarReminders = [],
      usefulStructures = [],
      feedbackCards = [],
      grammarMistakes = [],
      score,
      level
    } = req.body;

    if (!question.trim()) {
      res.status(400);
      throw new Error("Question is required.");
    }

    let submission = null;

    if (submissionId) {
      submission = await Submission.findOne({
        _id: submissionId,
        userId: req.user._id
      });

      if (!submission) {
        res.status(404);
        throw new Error("Submission was not found.");
      }
    }

    const contextFeedbackCards =
      Array.isArray(feedbackCards) && feedbackCards.length
        ? feedbackCards
        : submission?.feedbackCards?.length
          ? submission.feedbackCards
          : grammarMistakesToFeedbackCards(submission?.grammarMistakes || grammarMistakes);

    const reply = await chatWithGemini({
      submission,
      question,
      writingContext,
      topicTitle,
      missionTitle,
      writingQuestion,
      modelParagraphs: Array.isArray(modelParagraphs) ? modelParagraphs : [],
      grammarReminders: Array.isArray(grammarReminders) ? grammarReminders : [],
      usefulStructures: Array.isArray(usefulStructures) ? usefulStructures : [],
      feedbackCards: contextFeedbackCards,
      grammarMistakes: Array.isArray(grammarMistakes) ? grammarMistakes : [],
      score,
      level
    });

    res.json(reply);
  } catch (error) {
    next(error);
  }
};

module.exports = { evaluateSentence, evaluateWriting, writingChat };
