const Activity = require("../models/Activity");
const MiniTopic = require("../models/MiniTopic");
const Progress = require("../models/Progress");
const Topic = require("../models/Topic");
const { markActivityPassed } = require("./progressController");
const { isAcceptedAnswer, normalizeAnswer } = require("../utils/normalizeAnswer");
const { isFinalWritingTestMode } = require("../utils/devFlags");
const { getWordCount } = require("../utils/wordCount");
const {
  FINAL_WRITING_SLUG,
  GRAMMAR_TASKS,
  buildMiniTopicStatuses,
  buildTopicStatuses,
  getCompletedActivities,
  getScoreMapValue,
  isActivityTypeUnlocked,
  toId
} = require("../utils/unlockLogic");

const QUESTION_TYPE_LABELS = {
  MCQ: "Choose the correct answer.",
  GAP_FILL: "Fill in the blanks.",
  UNSCRAMBLE: "Put the words in the correct order.",
  SENTENCE_WRITING: "Write complete sentences.",
  SHORT_SENTENCE: "Write complete sentences.",
  GRAMMAR_TABLE: "Grammar Table Challenge."
};

const PASSING_CORRECT_COUNT = 15;

const levenshteinDistance = (left = "", right = "") => {
  const a = normalizeAnswer(left);
  const b = normalizeAnswer(right);
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
  const learner = normalizeAnswer(learnerAnswer);
  const correct = normalizeAnswer(correctAnswer);

  if (!learner || !correct || learner === correct || learner.includes(" ") || correct.includes(" ")) return false;
  if (Math.abs(learner.length - correct.length) > 2) return false;

  const distance = levenshteinDistance(learner, correct);
  return correct.length <= 5 ? distance === 1 : distance <= 2;
};

const toClientActivity = (activity) => ({
  _id: activity._id,
  miniTopicId: activity.miniTopicId,
  taskSlug: activity.taskSlug,
  taskNumber: activity.taskNumber,
  grammarTitle: activity.grammarTitle,
  questionType: activity.questionType || activity.type,
  type: activity.questionType || activity.type,
  question: activity.question,
  options: activity.options,
  scrambledWords: activity.scrambledWords,
  keyword: activity.keyword,
  grammarPoint: activity.grammarPoint,
  explanation: activity.explanation,
  correctAnswer: activity.correctAnswer,
  fullCorrectAnswer: activity.fullCorrectAnswer,
  correctSentence: activity.correctSentence,
  suggestedAnswer: activity.suggestedAnswer,
  highlightAnswerPart: activity.highlightAnswerPart,
  baseWord: activity.baseWord,
  targetStructure: activity.targetStructure,
  targetForm: activity.targetForm,
  grammarForm: activity.grammarForm,
  acceptedAnswers: activity.acceptedAnswers,
  givenWords: activity.givenWords,
  wordBank: activity.wordBank,
  keywords: activity.keywords,
  sampleAnswer: activity.sampleAnswer,
  grammarSummary: activity.grammarSummary,
  grammarTableChallenge: activity.grammarTableChallenge,
  order: activity.order
});

const getGroupGrammarSummary = (items) => {
  const summary = items.find((item) => item.grammarSummary?.grammarPoint)?.grammarSummary;

  if (!summary) return null;

  return {
    grammarPoint: summary.grammarPoint,
    form: summary.form,
    use: summary.use,
    example: summary.example
  };
};

const groupQuestionsByType = (items = []) =>
  ["MCQ", "GAP_FILL", "UNSCRAMBLE", "SENTENCE_WRITING", "GRAMMAR_TABLE"].map((questionType) => {
    const questions = items
      .filter((activity) => (activity.questionType || activity.type) === questionType)
      .map(toClientActivity);

    return {
      questionType,
      label: QUESTION_TYPE_LABELS[questionType],
      count: questions.length,
      questions
    };
  });

const loadMiniTopicAccess = async (userId, miniTopicId) => {
  const [miniTopic, topics, miniTopics, progresses] = await Promise.all([
    MiniTopic.findById(miniTopicId),
    Topic.find().sort({ order: 1 }),
    MiniTopic.find().sort({ order: 1 }),
    Progress.find({ userId })
  ]);

  if (!miniTopic) {
    const error = new Error("Mission was not found.");
    error.statusCode = 404;
    throw error;
  }

  const topic = topics.find((item) => toId(item._id) === toId(miniTopic.topicId));
  const topicStatuses = buildTopicStatuses(topics, miniTopics, progresses);
  const topicIndex = topics.findIndex((item) => toId(item._id) === toId(miniTopic.topicId));
  const topicStatus = topicStatuses[topicIndex] || { isUnlocked: false };
  const topicMiniTopics = miniTopics.filter((item) => toId(item.topicId) === toId(miniTopic.topicId));
  const miniStatuses = buildMiniTopicStatuses(topic, topicMiniTopics, progresses, topicStatus.isUnlocked);
  const miniIndex = topicMiniTopics.findIndex((item) => toId(item._id) === toId(miniTopic._id));
  const miniStatus = miniStatuses[miniIndex] || { isUnlocked: false };
  const progress = progresses.find((item) => toId(item.miniTopicId) === toId(miniTopic._id)) || null;

  return { miniTopic, topic, miniStatus, topicStatus, progress };
};

const getMiniTopicActivities = async (req, res, next) => {
  try {
    const access = await loadMiniTopicAccess(req.user._id, req.params.miniTopicId);
    const activities = await Activity.find({ miniTopicId: req.params.miniTopicId }).sort({ order: 1 });
    const completed = getCompletedActivities(access.progress);

    const tasks = GRAMMAR_TASKS.map((task) => {
      const rawItems = activities.filter((activity) => activity.taskSlug === task.slug);
      const firstQuestion = rawItems[0] || null;

      return {
        slug: task.slug,
        type: task.slug,
        taskSlug: task.slug,
        taskNumber: task.taskNumber,
        grammarTitle: firstQuestion?.grammarTitle || task.grammarTitle,
        title: `Task ${task.taskNumber}`,
        instruction: `Task ${task.taskNumber}: Practice ${firstQuestion?.grammarTitle || task.grammarTitle}.`,
        grammarSummary: getGroupGrammarSummary(rawItems),
        questionCount: rawItems.length,
        sections: groupQuestionsByType(rawItems),
        anchorActivityId: firstQuestion?._id || null,
        isUnlocked: Boolean(access.miniStatus.isUnlocked && isActivityTypeUnlocked(task.slug, access.progress)),
        isCompleted: completed.has(task.slug),
        score: getScoreMapValue(access.progress?.activityScores, task.slug)
      };
    });
    const finalWritingUnlocked = Boolean(
      access.miniStatus.isUnlocked &&
        (isFinalWritingTestMode() || isActivityTypeUnlocked(FINAL_WRITING_SLUG, access.progress))
    );

    res.json({
      topic: access.topic,
      miniTopic: {
        ...access.miniTopic.toObject(),
        ...access.miniStatus
      },
      tasks,
      finalWriting: {
        slug: FINAL_WRITING_SLUG,
        type: FINAL_WRITING_SLUG,
        taskSlug: FINAL_WRITING_SLUG,
        taskNumber: 6,
        grammarTitle: "Final Writing",
        title: "Final Writing",
        instruction: "Write a short paragraph.",
        questionCount: 1,
        finalWritingModelParagraphs: access.miniTopic.finalWritingModelParagraphs || [],
        isUnlocked: finalWritingUnlocked,
        isCompleted: completed.has(FINAL_WRITING_SLUG),
        score: getScoreMapValue(access.progress?.activityScores, FINAL_WRITING_SLUG)
      }
    });
  } catch (error) {
    next(error);
  }
};

const scoreWrittenSentence = (activity, answer) => {
  const normalizedAnswer = normalizeAnswer(answer);
  const normalizedKeyword = normalizeAnswer(activity.keyword);
  const hasEnoughWords = getWordCount(answer) >= 5;
  const includesKeyword = normalizedKeyword ? normalizedAnswer.includes(normalizedKeyword) : true;
  const acceptedAnswers = [
    activity.correctAnswer,
    activity.fullCorrectAnswer,
    activity.correctSentence,
    activity.suggestedAnswer,
    ...(activity.acceptedAnswers || []),
    activity.sampleAnswer
  ].filter(Boolean);
  const matchesSuggested = isAcceptedAnswer(answer, acceptedAnswers);
  const isCorrect = matchesSuggested || (hasEnoughWords && includesKeyword);

  return {
    isCorrect,
    feedback: isCorrect
      ? "Your sentence uses the target grammar clearly."
      : "Review the sentence and try the target grammar pattern again.",
    keywordMatched: includesKeyword,
    hasEnoughWords,
    matchesSuggested
  };
};

const scoreTask = (activities, answers, evaluatedResults = {}) => {
  const results = activities.map((activity) => {
    const questionType = activity.questionType || activity.type;
    const submittedAnswer = answers[toId(activity._id)] || "";

    if (questionType === "GRAMMAR_TABLE") {
      const correctAnswer =
        activity.grammarTableChallenge?.correctTable || activity.correctAnswer || "A";
      const isCorrect = isAcceptedAnswer(submittedAnswer, [correctAnswer]);

      return {
        activityId: activity._id,
        questionType: "GRAMMAR_TABLE",
        submittedAnswer,
        correctAnswer,
        suggestedAnswer: correctAnswer,
        isCorrect,
        grammarPoint: activity.grammarPoint,
        explanation: activity.grammarTableChallenge?.explanation || activity.explanation,
        wrongAnswerExplanation: activity.wrongAnswerExplanation,
        correctAnswerExplanation: activity.correctAnswerExplanation,
        grammarSummary: activity.grammarSummary
      };
    }

    if (questionType === "SENTENCE_WRITING" || questionType === "SHORT_SENTENCE") {
      const aiResult = evaluatedResults[toId(activity._id)];

      if (aiResult && typeof aiResult.isCorrect === "boolean") {
        return {
          activityId: activity._id,
          questionType: "SENTENCE_WRITING",
          submittedAnswer,
          correctAnswer: aiResult.correctAnswer || aiResult.correctedSentence || activity.sampleAnswer || activity.correctAnswer || activity.keyword,
          suggestedAnswer: aiResult.correctAnswer || aiResult.correctedSentence || activity.sampleAnswer || activity.correctAnswer || activity.keyword,
          isCorrect: Boolean(aiResult.isCorrect),
          feedback: aiResult.feedback || "Review the sentence feedback.",
          grammarPoint: activity.grammarPoint,
          explanation: aiResult.grammarExplanation || aiResult.explanation || activity.explanation,
          grammarExplanation: aiResult.grammarExplanation || aiResult.explanation || activity.explanation,
          correctedSentence: aiResult.correctedSentence || activity.sampleAnswer || activity.correctAnswer || "",
          usedGrammarStructure: aiResult.usedGrammarStructure || "",
          highlightCorrectPart: aiResult.highlightCorrectPart || activity.highlightAnswerPart || "",
          suggestedAnswer: aiResult.suggestedAnswer || activity.suggestedAnswer || activity.sampleAnswer || activity.correctAnswer || "",
          suggestedAnswerHighlight: aiResult.suggestedAnswerHighlight || activity.highlightAnswerPart || activity.targetStructure || "",
          issues: Array.isArray(aiResult.issues) ? aiResult.issues : [],
          wrongAnswerExplanation: activity.wrongAnswerExplanation,
          correctAnswerExplanation: aiResult.grammarExplanation || aiResult.grammarRule || activity.correctAnswerExplanation,
          grammarSummary: activity.grammarSummary
        };
      }

      const result = scoreWrittenSentence(activity, submittedAnswer);

      return {
        activityId: activity._id,
        questionType: "SENTENCE_WRITING",
        submittedAnswer,
        correctAnswer: activity.sampleAnswer || activity.correctAnswer || activity.keyword,
        suggestedAnswer: activity.sampleAnswer || activity.correctAnswer || activity.keyword,
        isCorrect: result.isCorrect,
        feedback: result.feedback,
        grammarPoint: activity.grammarPoint,
        explanation: activity.explanation,
        wrongAnswerExplanation: !result.hasEnoughWords
          ? "A complete sentence needs at least 5 words for this question."
          : activity.wrongAnswerExplanation,
        correctAnswerExplanation: result.keywordMatched
          ? activity.correctAnswerExplanation
          : `Use the target word or phrase "${activity.keyword}" to practice this grammar point.`,
        grammarSummary: activity.grammarSummary
      };
    }

    const acceptedAnswers = [
      activity.correctAnswer,
      activity.fullCorrectAnswer,
      activity.correctSentence,
      activity.suggestedAnswer,
      activity.sampleAnswer,
      ...(activity.acceptedAnswers || [])
    ].filter(Boolean);
    const isCorrect = isAcceptedAnswer(submittedAnswer, acceptedAnswers);
    const spellingNote =
      questionType === "GAP_FILL" && !isCorrect && isNearMiss(submittedAnswer, activity.correctAnswer)
        ? `"${String(submittedAnswer).trim()}" is a spelling mistake. Use "${activity.correctAnswer}".`
        : "";

    return {
      activityId: activity._id,
      questionType,
      submittedAnswer,
      correctAnswer: activity.correctAnswer,
      suggestedAnswer: activity.correctAnswer,
      isCorrect,
      spellingNote,
      grammarPoint: activity.grammarPoint,
      explanation: activity.explanation,
      wrongAnswerExplanation: activity.wrongAnswerExplanation,
      correctAnswerExplanation: activity.correctAnswerExplanation,
      grammarSummary: activity.grammarSummary
    };
  });
  const correctCount = results.filter((result) => result.isCorrect).length;

  return {
    score: activities.length === 0 ? 0 : Math.round((correctCount / activities.length) * 100),
    correctCount,
    totalQuestions: activities.length,
    grammarSummary: getGroupGrammarSummary(activities),
    results
  };
};

const submitActivity = async (req, res, next) => {
  try {
    const anchorActivity = await Activity.findById(req.params.activityId);

    if (!anchorActivity) {
      res.status(404);
      throw new Error("Activity was not found.");
    }

    const taskSlug = anchorActivity.taskSlug;
    const access = await loadMiniTopicAccess(req.user._id, anchorActivity.miniTopicId);
    if (!access.miniStatus.isUnlocked || !isActivityTypeUnlocked(taskSlug, access.progress)) {
      res.status(423);
      throw new Error("Complete the previous task to unlock this step.");
    }

    const activities = await Activity.find({
      miniTopicId: anchorActivity.miniTopicId,
      taskSlug
    }).sort({ order: 1 });
    const answers = req.body.answers || {};
    const evaluatedResults = req.body.evaluatedResults || {};
    const { correctCount, grammarSummary, score, totalQuestions, results } = scoreTask(activities, answers, evaluatedResults);
    const requiredCorrectCount = totalQuestions >= 21 ? PASSING_CORRECT_COUNT : Math.ceil(totalQuestions * 0.6);
    const passed = totalQuestions > 0 && correctCount >= requiredCorrectCount;

    if (passed) {
      await markActivityPassed(req.user._id, anchorActivity.miniTopicId, taskSlug, score);
    }

    res.json({
      taskSlug,
      grammarTitle: anchorActivity.grammarTitle,
      score,
      correctCount,
      totalQuestions,
      passed,
      results,
      grammarSummary,
      message: passed
        ? "Great work. The next task is unlocked."
        : "Keep going. Review your answers and try again."
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMiniTopicActivities, submitActivity };
