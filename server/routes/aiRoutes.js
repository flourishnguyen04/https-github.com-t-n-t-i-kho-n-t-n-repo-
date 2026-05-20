const express = require("express");
const { evaluateSentence, evaluateWriting, writingChat } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/evaluate-writing", protect, evaluateWriting);
router.post("/evaluate-sentence", protect, evaluateSentence);
router.post("/writing-chat", protect, writingChat);

module.exports = router;
