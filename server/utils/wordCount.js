const getWordCount = (text = "") => {
  const matches = String(text)
    .trim()
    .match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);

  return matches ? matches.length : 0;
};

module.exports = { getWordCount };
