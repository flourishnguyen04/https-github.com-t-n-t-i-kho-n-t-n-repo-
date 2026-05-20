const isFinalWritingTestMode = () => process.env.ALLOW_FINAL_WRITING_TEST === "true";

module.exports = { isFinalWritingTestMode };
