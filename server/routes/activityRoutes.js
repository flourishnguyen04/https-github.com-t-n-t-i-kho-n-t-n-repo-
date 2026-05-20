const express = require("express");
const { getMiniTopicActivities, submitActivity } = require("../controllers/activityController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/mini-topics/:miniTopicId/activities", protect, getMiniTopicActivities);
router.post("/activities/:activityId/submit", protect, submitActivity);

module.exports = router;
