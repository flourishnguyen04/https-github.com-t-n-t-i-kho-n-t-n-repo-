const normalizeAnswer = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");

const isAcceptedAnswer = (answer, acceptedAnswers = []) => {
  const normalizedAnswer = normalizeAnswer(answer);
  return acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalizedAnswer);
};

module.exports = { normalizeAnswer, isAcceptedAnswer };
