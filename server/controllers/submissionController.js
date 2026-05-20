const Submission = require("../models/Submission");

const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("topicId", "title description")
      .populate("miniTopicId", "title writingQuestion grammarFocus finalWritingModelParagraphs grammarReminders usefulStructures sentencePatterns");

    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.submissionId,
      userId: req.user._id
    })
      .populate("topicId", "title description")
      .populate("miniTopicId", "title writingQuestion grammarFocus finalWritingModelParagraphs grammarReminders usefulStructures sentencePatterns");

    if (!submission) {
      res.status(404);
      throw new Error("Submission was not found.");
    }

    res.json(submission);
  } catch (error) {
    next(error);
  }
};

const createSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.create({
      ...req.body,
      userId: req.user._id
    });

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

module.exports = { createSubmission, getMySubmissions, getSubmissionById };
