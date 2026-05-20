const mongoose = require("mongoose");

const miniTopicSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    grammarFocus: [
      {
        type: String,
        trim: true
      }
    ],
    order: {
      type: Number,
      required: true
    },
    writingQuestion: {
      type: String,
      required: true
    },
    writingHints: [
      {
        type: String
      }
    ],
    grammarReminders: [
      {
        type: String
      }
    ],
    sentencePatterns: [
      {
        type: String
      }
    ],
    finalWritingModelParagraphs: [
      {
        label: {
          type: String,
          default: ""
        },
        text: {
          type: String,
          default: ""
        }
      }
    ],
    helpfulIdeas: [
      {
        type: String
      }
    ],
    usefulStructures: [
      {
        type: String
      }
    ],
    selfCheckQuestions: [
      {
        type: String
      }
    ],
    mapTheme: {
      type: String,
      default: "paper"
    }
  },
  { timestamps: true }
);

miniTopicSchema.index({ topicId: 1, order: 1 }, { unique: true });
miniTopicSchema.index({ topicId: 1, title: 1 }, { unique: true });
miniTopicSchema.index({ topicId: 1, slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("MiniTopic", miniTopicSchema);
