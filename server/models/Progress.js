const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
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
    completedActivities: [
      {
        type: String
      }
    ],
    activityScores: {
      type: Map,
      of: Number,
      default: {}
    },
    isMiniTopicCompleted: {
      type: Boolean,
      default: false
    },
    isTopicCompleted: {
      type: Boolean,
      default: false
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, miniTopicId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
