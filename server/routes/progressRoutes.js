const express = require("express");
const { completeActivity, completeMiniTopic, getMyProgress } = require("../controllers/progressController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMyProgress);
router.post("/complete-activity", protect, completeActivity);
router.post("/complete-mini-topic", protect, completeMiniTopic);

module.exports = router;
