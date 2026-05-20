const express = require("express");
const { getMiniTopicsByTopic, getTopicById, getTopics } = require("../controllers/topicController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getTopics);
router.get("/:topicId", protect, getTopicById);
router.get("/:topicId/mini-topics", protect, getMiniTopicsByTopic);

module.exports = router;
