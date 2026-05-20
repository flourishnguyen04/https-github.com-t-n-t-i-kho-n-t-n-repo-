const express = require("express");
const {
  createSubmission,
  getMySubmissions,
  getSubmissionById
} = require("../controllers/submissionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMySubmissions);
router.get("/:submissionId", protect, getSubmissionById);
router.post("/", protect, createSubmission);

module.exports = router;
