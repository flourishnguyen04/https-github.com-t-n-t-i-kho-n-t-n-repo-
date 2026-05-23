const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    miniTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MiniTopic",
      required: true
    },
    taskSlug: {
      type: String,
      required: true,
      trim: true
    },
    taskNumber: {
      type: Number,
      required: true
    },
    grammarTitle: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["MCQ", "GAP_FILL", "UNSCRAMBLE", "SENTENCE_WRITING", "SHORT_SENTENCE", "GRAMMAR_TABLE", "MATCHING"],
      required: true
    },
    questionType: {
      type: String,
      enum: ["MCQ", "GAP_FILL", "UNSCRAMBLE", "SENTENCE_WRITING", "SHORT_SENTENCE", "GRAMMAR_TABLE", "MATCHING"],
      required: true
    },
    question: {
      type: String,
      default: ""
    },
    options: [
      {
        type: String
      }
    ],
    correctAnswer: {
      type: String,
      default: ""
    },
    fullCorrectAnswer: {
      type: String,
      default: ""
    },
    correctSentence: {
      type: String,
      default: ""
    },
    suggestedAnswer: {
      type: String,
      default: ""
    },
    highlightAnswerPart: {
      type: String,
      default: ""
    },
    baseWord: {
      type: String,
      default: ""
    },
    targetStructure: {
      type: String,
      default: ""
    },
    targetForm: {
      type: String,
      default: ""
    },
    grammarForm: {
      type: String,
      default: ""
    },
    acceptedAnswers: [
      {
        type: String
      }
    ],
    givenWords: [
      {
        type: String
      }
    ],
    wordBank: [
      {
        type: String
      }
    ],
    keywords: [
      {
        type: String
      }
    ],
    scrambledWords: [
      {
        type: String
      }
    ],
    keyword: {
      type: String,
      default: ""
    },
    grammarPoint: {
      type: String,
      default: ""
    },
    explanation: {
      type: String,
      default: ""
    },
    wrongAnswerExplanation: {
      type: String,
      default: ""
    },
    correctAnswerExplanation: {
      type: String,
      default: ""
    },
    sampleAnswer: {
      type: String,
      default: ""
    },
    grammarSummary: {
      grammarPoint: {
        type: String,
        default: ""
      },
      form: {
        type: String,
        default: ""
      },
      use: {
        type: String,
        default: ""
      },
      example: {
        type: String,
        default: ""
      }
    },
    grammarTableChallenge: {
      tables: [
        {
          key: {
            type: String,
            default: ""
          },
          label: {
            type: String,
            default: ""
          },
          form: {
            type: String,
            default: ""
          },
          use: {
            type: String,
            default: ""
          },
          example: {
            type: String,
            default: ""
          }
        }
      ],
      correctTable: {
        type: String,
        default: ""
      },
      explanation: {
        type: String,
        default: ""
      }
    },
    matchingData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    order: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

activitySchema.index({ miniTopicId: 1, type: 1, order: 1 });
activitySchema.index({ miniTopicId: 1, taskSlug: 1, questionType: 1, order: 1 });

module.exports = mongoose.model("Activity", activitySchema);
