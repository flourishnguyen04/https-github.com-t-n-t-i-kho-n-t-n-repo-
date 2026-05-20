const mongoose = require("mongoose");

const grammarMistakeSchema = new mongoose.Schema(
  {
    originalText: String,
    errorText: String,
    correction: String,
    grammarPoint: String,
    explanation: String
  },
  { _id: false }
);

const feedbackCardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["error", "improvement"],
      default: "error"
    },
    originalText: String,
    correction: String,
    suggestedRevision: String,
    focus: String,
    explanation: String
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true
    },
    miniTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MiniTopic",
      required: true
    },
    paragraph: {
      type: String,
      required: true
    },
    wordCount: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    level: {
      type: String,
      enum: ["Excellent", "Good Progress", "Needs Improvement", "Needs Review"],
      required: true
    },
    feedback: {
      type: String,
      required: true
    },
    grammarMistakes: [grammarMistakeSchema],
    feedbackCards: [feedbackCardSchema],
    suggestions: [String],
    improvedVersion: {
      type: String,
      required: true
    },
    isMock: {
      type: Boolean,
      default: false
    },
    aiUnavailable: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

submissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
