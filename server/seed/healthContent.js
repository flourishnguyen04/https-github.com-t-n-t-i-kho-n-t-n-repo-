const grammarTasks = [
  {
    slug: "present-simple",
    taskNumber: 1,
    grammarTitle: "Present Simple",
    summary: {
      grammarPoint: "Present simple",
      form: "Subject + base verb / Subject + verb-s or verb-es",
      use: "To talk about facts, habits, routines, and general truths.",
      example: "Many teenagers like fast food because it is cheap and convenient."
    }
  },
  {
    slug: "modal-verbs",
    taskNumber: 2,
    grammarTitle: "Modal Verbs",
    summary: {
      grammarPoint: "Modal verbs",
      form: "Subject + should / must / can / may / might + base verb",
      use: "To give advice, show obligation, or describe possibility.",
      example: "People should verify online health information before sharing it."
    }
  },
  {
    slug: "conditional-sentences",
    taskNumber: 3,
    grammarTitle: "Conditional Sentences",
    summary: {
      grammarPoint: "Conditional sentences",
      form: "If + present simple, subject + will / may / can + base verb",
      use: "To connect a condition with a possible result.",
      example: "If students sleep enough, they may concentrate better."
    }
  },
  {
    slug: "relative-clauses",
    taskNumber: 4,
    grammarTitle: "Relative Clauses",
    summary: {
      grammarPoint: "Relative clauses",
      form: "Noun + who / which / where / whose / why + clause",
      use: "To add clear information about people, things, places, possession, or reasons.",
      example: "Students who exercise regularly often feel healthier."
    }
  },
  {
    slug: "complex-sentences",
    taskNumber: 5,
    grammarTitle: "Complex Sentences",
    summary: {
      grammarPoint: "Complex sentences",
      form: "Independent clause + because / although / if / while + dependent clause",
      use: "To explain reasons, contrast ideas, and show conditions.",
      example: "Although fast food is convenient, people should not eat it too often."
    }
  }
];

const optionSet = (correct, wrongA, wrongB, wrongC) => [correct, wrongA, wrongB, wrongC];

const answerToSentence = (question = "", answer = "") => {
  const text = String(question);
  const value = String(answer);

  if (!text || !value) return value;

  if (/_{2,}/.test(text)) {
    return text.replace(/_{2,}/, value).replace(/\s*\([^)]*\)/, "");
  }

  return value;
};

const inferBaseWord = (answer = "") => {
  const value = String(answer || "").trim();
  const irregular = {
    is: "be",
    are: "be",
    was: "be",
    were: "be",
    has: "have",
    does: "do"
  };

  if (irregular[value.toLowerCase()]) return irregular[value.toLowerCase()];
  if (value.includes(" ")) return value;
  if (value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.endsWith("xes") || value.endsWith("zes") || value.endsWith("ches") || value.endsWith("shes")) {
    return value.slice(0, -2);
  }
  if (value.endsWith("s") && value.length > 3) return value.slice(0, -1);
  return value;
};

const withBaseWordHint = (question = "", baseWord = "") => {
  const text = String(question || "");
  const base = String(baseWord || "").trim();

  if (!base || /\([^)]*\)/.test(text)) return text;
  return text.replace(/_{2,}/, (blank) => `${blank} (${base})`);
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const inferPresentSimpleVerb = (sentence = "") => {
  const targets = [
    "do not get",
    "does not get",
    "stay",
    "stays",
    "help",
    "helps",
    "like",
    "likes",
    "serve",
    "serves",
    "cause",
    "causes",
    "buy",
    "buys",
    "become",
    "becomes",
    "think",
    "thinks",
    "contain",
    "contains",
    "create",
    "creates",
    "make",
    "makes",
    "choose",
    "chooses",
    "offer",
    "offers",
    "increase",
    "increases",
    "eat",
    "eats",
    "influence",
    "influences",
    "prefer",
    "prefers",
    "play",
    "plays",
    "reduce",
    "reduces",
    "have",
    "has",
    "spend",
    "spends",
    "improve",
    "improves",
    "visit",
    "visits",
    "avoid",
    "avoids",
    "join",
    "joins",
    "feel",
    "feels",
    "include",
    "includes",
    "exercise",
    "exercises",
    "drink",
    "drinks",
    "affect",
    "affects",
    "perform",
    "performs",
    "remember",
    "remembers",
    "trust",
    "trusts",
    "spread",
    "spreads"
  ];
  const text = String(sentence || "");

  return targets
    .map((target) => text.match(new RegExp(`\\b${escapeRegExp(target)}\\b`, "i"))?.[0])
    .find(Boolean) || "";
};

const inferHighlightAnswerPart = (fullAnswer = "", correctAnswer = "", grammarPoint = "") => {
  const answer = String(fullAnswer || "");
  const correct = String(correctAnswer || "");
  const point = String(grammarPoint || "").toLowerCase();

  if (!answer) return correct;

  if (point.includes("modal")) {
    const match = answer.match(/\b(should not|ought to|should|must|can|may|might|could)\s+\w+/i);
    return match?.[0] || correct;
  }

  if (point.includes("conditional")) {
    const match = answer.match(/\bif\b[^,]+/i);
    return match?.[0] || correct;
  }

  if (point.includes("relative")) {
    const match = answer.match(/\b(who|which|where|whose|why)\b[^,.!?]+/i)?.[0] || "";
    const stopPhrases = [" may ", " often ", " usually ", " attract ", " become ", " help ", " rise ", " are unhealthy"];
    const stopIndex = stopPhrases
      .map((phrase) => match.toLowerCase().indexOf(phrase))
      .filter((index) => index > 0)
      .sort((a, b) => a - b)[0];

    return (stopIndex ? match.slice(0, stopIndex) : match) || correct;
  }

  if (point.includes("complex")) {
    const leadingClause = answer.match(/^(although|because|if|while)\b[^,]+/i);
    if (leadingClause) return leadingClause[0];
    const embeddedClause = answer.match(/\b(although|because|if|while)\b[^,.!?]+/i);
    return embeddedClause?.[0] || correct;
  }

  if (point.includes("present simple")) {
    return inferPresentSimpleVerb(answer) || correct;
  }

  return correct;
};

const mcq = (question, options, correctAnswer, explanation, grammarPoint) => ({
  question,
  options,
  correctAnswer,
  fullCorrectAnswer: answerToSentence(question, correctAnswer),
  highlightAnswerPart: inferHighlightAnswerPart(answerToSentence(question, correctAnswer), correctAnswer, grammarPoint),
  acceptedAnswers: [correctAnswer],
  explanation,
  grammarPoint
});

const gap = (question, correctAnswer, explanation, grammarPoint, acceptedAnswers, baseWord) => {
  const inferredBaseWord = baseWord || inferBaseWord(correctAnswer);
  const displayQuestion = withBaseWordHint(question, inferredBaseWord);
  const fullCorrectAnswer = answerToSentence(displayQuestion, correctAnswer);
  const highlightAnswerPart = inferHighlightAnswerPart(fullCorrectAnswer, correctAnswer, grammarPoint);

  return {
    question: displayQuestion,
    correctAnswer,
    fullCorrectAnswer,
    highlightAnswerPart,
    baseWord: inferredBaseWord,
    targetStructure: highlightAnswerPart,
    acceptedAnswers: acceptedAnswers || [correctAnswer],
    explanation,
    grammarPoint
  };
};

const unscramble = (scrambledWords, correctAnswer, explanation, grammarPoint) => ({
  question: "Type the correct sentence.",
  scrambledWords,
  correctAnswer,
  fullCorrectAnswer: correctAnswer,
  highlightAnswerPart: inferHighlightAnswerPart(correctAnswer, "", grammarPoint),
  targetStructure: inferHighlightAnswerPart(correctAnswer, "", grammarPoint),
  acceptedAnswers: [correctAnswer],
  explanation,
  grammarPoint
});

const writing = (question, keyword, sampleAnswer, explanation, grammarPoint) => {
  const keywordChips = deriveKeywordChips(keyword, sampleAnswer, grammarPoint, question);
  const grammarLabel = grammarPoint === "Present simple" ? "Present Simple" : grammarPoint;

  return {
    question: `Write one complete sentence using all keywords and the ${grammarLabel}.`,
    keyword,
    correctAnswer: sampleAnswer,
    suggestedAnswer: sampleAnswer,
    fullCorrectAnswer: sampleAnswer,
    highlightAnswerPart: inferHighlightAnswerPart(sampleAnswer, keyword, grammarPoint),
    targetStructure: grammarPoint,
    givenWords: keywordChips,
    wordBank: keywordChips,
    keywords: keywordChips,
    acceptedAnswers: [sampleAnswer],
    sampleAnswer,
    explanation,
    grammarPoint,
    originalPrompt: question
  };
};

const grammarTableChallenge = (task) => ({
  question: "Choose the grammar table with the most accurate rule.",
  correctAnswer: "A",
  fullCorrectAnswer: "Table A",
  highlightAnswerPart: "Table A",
  acceptedAnswers: ["A", "Table A"],
  grammarPoint: task.summary.grammarPoint,
  explanation: `Table A is correct because it matches this grammar form: ${task.summary.form}.`,
  grammarTableChallenge: {
    correctTable: "A",
    explanation: `Table A is correct because it gives the right form, use, and example for ${task.grammarTitle}. Table B contains common grammar mistakes.`,
    tables: [
      {
        key: "A",
        label: "Table A",
        form: task.summary.form,
        use: task.summary.use,
        example: task.summary.example
      },
      {
        key: "B",
        label: "Table B",
        form: "Subject + incorrect verb form",
        use: "This table mixes grammar forms and does not explain the rule accurately.",
        example: task.grammarTitle === "Modal Verbs" ? "Students should to exercise daily." : "Students are play sports every day."
      }
    ]
  }
});

const addQuestionSupport = (items, task, questionType) =>
  items.map((item) => ({
    taskSlug: task.slug,
    taskNumber: task.taskNumber,
    grammarTitle: task.grammarTitle,
    type: questionType,
    questionType,
    options: [],
    scrambledWords: [],
    keyword: "",
    grammarSummary: task.summary,
    wrongAnswerExplanation:
      item.wrongAnswerExplanation ||
      `Review ${task.grammarTitle}. The answer must match the grammar form and meaning of the sentence.`,
    correctAnswerExplanation:
      item.correctAnswerExplanation || item.explanation || `The correct answer follows this form: ${task.summary.form}.`,
    ...item
  }));

const buildTaskActivities = (task, sections, startOrder) => {
  let order = startOrder;
  const activityGroups = [
    ["MCQ", sections.mcq],
    ["GAP_FILL", sections.gapFill],
    ["UNSCRAMBLE", sections.unscramble],
    ["SENTENCE_WRITING", sections.sentenceWriting],
    ["GRAMMAR_TABLE", [grammarTableChallenge(task)]]
  ];

  return activityGroups.flatMap(([questionType, items]) =>
    addQuestionSupport(items, task, questionType).map((item) => ({
      ...item,
      order: order++
    }))
  );
};

const words = (sentence) =>
  sentence
    .replace(/[.,?]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.toLowerCase());

const keywordPhrases = [
  "too much",
  "fast food",
  "junk food",
  "fried food",
  "sugary drinks",
  "health problems",
  "healthy meals",
  "healthier meals",
  "home-cooked meals",
  "healthy habits",
  "obesity",
  "gain weight",
  "feel healthier",
  "cook at home",
  "students",
  "teenagers",
  "children",
  "parents",
  "families",
  "people",
  "restaurants",
  "exercise",
  "regular exercise",
  "sports",
  "stress",
  "concentration",
  "mental health",
  "sleep",
  "sleep habits",
  "screen time",
  "online health information",
  "health information",
  "websites",
  "social media",
  "doctor",
  "health advice",
  "after school",
  "eat less",
  "healthy food",
  "healthy choices",
  "more popular",
  "physical activity",
  "sports clubs",
  "active routine",
  "sleep schedule"
];

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "although",
  "among",
  "because",
  "before",
  "become",
  "can",
  "cause",
  "causes",
  "cook",
  "do",
  "develop",
  "eating",
  "every",
  "feel",
  "gain",
  "healthier",
  "home",
  "if",
  "is",
  "it",
  "less",
  "many",
  "may",
  "meals",
  "might",
  "more",
  "much",
  "must",
  "not",
  "often",
  "serve",
  "should",
  "still",
  "that",
  "the",
  "their",
  "they",
  "to",
  "too",
  "will",
  "with",
  "weight",
  "where",
  "which",
  "who"
]);

const grammarKeywordMarkers = new Set([
  "although",
  "because",
  "can",
  "if",
  "may",
  "might",
  "must",
  "should",
  "where",
  "which",
  "who",
  "will"
]);

const sentenceWritingVerbHints = new Set([
  "affect",
  "affects",
  "avoid",
  "avoids",
  "become",
  "becomes",
  "buy",
  "buys",
  "cause",
  "causes",
  "check",
  "choose",
  "chooses",
  "concentrate",
  "consult",
  "contain",
  "contains",
  "cook",
  "creates",
  "develop",
  "drink",
  "eat",
  "exercise",
  "feel",
  "follow",
  "gain",
  "harm",
  "harms",
  "have",
  "help",
  "helps",
  "identify",
  "improve",
  "improves",
  "increase",
  "increases",
  "join",
  "like",
  "likes",
  "offer",
  "offers",
  "perform",
  "play",
  "plays",
  "prefer",
  "provide",
  "provides",
  "reduce",
  "reduces",
  "relax",
  "remember",
  "serve",
  "serves",
  "share",
  "sharing",
  "sleep",
  "spend",
  "spread",
  "spreads",
  "stay",
  "teach",
  "teaches",
  "trust",
  "verify",
  "visit"
]);

const normalizeSeedText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const forbiddenSentenceWritingWords = (sampleAnswer = "", grammarPoint = "") => {
  const answer = String(sampleAnswer || "");
  const point = String(grammarPoint || "").toLowerCase();
  const forbidden = new Set();

  if (point.includes("present simple")) {
    const targetVerb = normalizeSeedText(inferPresentSimpleVerb(answer));
    if (targetVerb) forbidden.add(targetVerb);
  }

  if (point.includes("modal")) {
    const match = answer.match(/\b(should not|ought to|should|must|can|may|might|could)\s+(\w+)/i);
    const modalVerb = normalizeSeedText(match?.[2] || "");
    if (modalVerb) forbidden.add(modalVerb);
  }

  if (point.includes("relative")) {
    const clause = answer.match(/\b(who|which|where|whose|why)\b[^,.!?]+/i)?.[0] || "";
    words(clause).forEach((word) => {
      if (sentenceWritingVerbHints.has(word)) forbidden.add(word);
    });
  }

  return forbidden;
};

const addUniqueChip = (chips, chip) => {
  const value = String(chip || "").trim();
  const normalizedValue = normalizeSeedText(value);
  if (
    !value ||
    chips.some((item) => {
      const normalizedItem = normalizeSeedText(item);
      return normalizedItem === normalizedValue || normalizedItem.split(" ").includes(normalizedValue);
    })
  ) {
    return;
  }
  chips.push(value);
};

const isIdeaKeywordCandidate = (candidate = "", sampleAnswer = "", grammarPoint = "") => {
  const normalizedCandidate = normalizeSeedText(candidate);
  const normalizedSample = normalizeSeedText(sampleAnswer);
  const point = String(grammarPoint || "").toLowerCase();
  const forbiddenWords = forbiddenSentenceWritingWords(sampleAnswer, grammarPoint);
  const candidateWords = normalizedCandidate.split(" ").filter(Boolean);
  const knownIdeaPhrase = keywordPhrases.some((phrase) => normalizeSeedText(phrase) === normalizedCandidate);

  if (!normalizedCandidate) return false;
  if (grammarKeywordMarkers.has(normalizedCandidate)) return false;
  if (/\b(should|must|can|may|might|will|if|although|because|who|which|where|whose|why)\b/.test(normalizedCandidate)) {
    return false;
  }
  if (candidateWords.some((word) => forbiddenWords.has(word))) {
    return false;
  }
  if (!normalizedCandidate.includes(" ") && sentenceWritingVerbHints.has(normalizedCandidate) && !knownIdeaPhrase) {
    return false;
  }

  if (point.includes("present simple")) {
    const targetVerb = normalizeSeedText(inferPresentSimpleVerb(sampleAnswer));
    if (normalizedCandidate === targetVerb) return false;
  }

  if (normalizedCandidate === normalizedSample) return false;
  return true;
};

const addFallbackIdeaChips = (chips, grammarPoint = "", question = "") => {
  const point = String(grammarPoint || "").toLowerCase();
  const prompt = String(question || "").toLowerCase();
  const fallbackIdeas = [];

  if (point.includes("present simple")) {
    fallbackIdeas.push("often", "habit", "general fact");
  } else if (point.includes("modal")) {
    fallbackIdeas.push(prompt.includes("possibility") ? "possibility" : "advice", "healthy choice", "students");
  } else if (point.includes("conditional")) {
    fallbackIdeas.push("condition", "result", "health effect");
  } else if (point.includes("relative")) {
    fallbackIdeas.push("description", "people", "health habit");
  } else if (point.includes("complex")) {
    fallbackIdeas.push(prompt.includes("because") ? "reason" : prompt.includes("although") ? "contrast" : "two ideas", "health idea", "result");
  }

  fallbackIdeas.forEach((idea) => {
    if (chips.length < 3) addUniqueChip(chips, idea);
  });
};

const deriveKeywordChips = (keyword, sampleAnswer, grammarPoint, question) => {
  const chips = [];
  const normalizedAnswer = normalizeSeedText(sampleAnswer);

  keywordPhrases.forEach((phrase) => {
    if (normalizedAnswer.includes(normalizeSeedText(phrase)) && isIdeaKeywordCandidate(phrase, sampleAnswer, grammarPoint)) {
      addUniqueChip(chips, phrase);
    }
  });
  if (isIdeaKeywordCandidate(keyword, sampleAnswer, grammarPoint)) {
    addUniqueChip(chips, keyword);
  }

  words(sampleAnswer).forEach((word) => {
    if (chips.length >= 5) return;
    if (word.length < 4 || stopWords.has(word) || !isIdeaKeywordCandidate(word, sampleAnswer, grammarPoint)) return;
    addUniqueChip(chips, word);
  });

  words(sampleAnswer).forEach((word) => {
    if (chips.length >= 3) return;
    if (word.length < 3 || stopWords.has(word) || !isIdeaKeywordCandidate(word, sampleAnswer, grammarPoint)) return;
    addUniqueChip(chips, word);
  });

  addFallbackIdeaChips(chips, grammarPoint, question);

  return chips.slice(0, 5);
};

const presentSimpleSections = (mission) => ({
  mcq: mission.presentSimple.mcq.map((item) =>
    mcq(item.question, item.options, item.correctAnswer, item.explanation, "Present simple")
  ),
  gapFill: mission.presentSimple.gapFill.map((item) =>
    gap(item.question, item.correctAnswer, item.explanation, "Present simple", item.acceptedAnswers)
  ),
  unscramble: mission.presentSimple.unscramble.map((item) =>
    unscramble(words(item.answer), item.answer, item.explanation, "Present simple")
  ),
  sentenceWriting: mission.presentSimple.sentenceWriting.map((item) =>
    writing(item.question, item.keyword, item.sampleAnswer, item.explanation, "Present simple")
  )
});

const modalSections = (mission) => {
  const m = mission.modal;

  return {
    mcq: [
      mcq(m.shouldQuestion, optionSet("should", "should to", "can to", "does"), "should", "Use 'should' to give advice.", "Modal verbs"),
      mcq(m.canQuestion, optionSet("can", "can to", "should to", "may to"), "can", "Use 'can' to show ability or possibility.", "Modal verbs"),
      mcq(m.negativeAdviceQuestion, optionSet("should not", "not should", "should not to", "do not should"), "should not", "Use 'should not' before a base verb for negative advice.", "Modal verbs"),
      mcq(m.mightQuestion, optionSet("might", "might to", "mights", "musts"), "might", "Use 'might' to show possibility.", "Modal verbs"),
      mcq(m.responsibilityQuestion, optionSet("should", "can to", "ought", "may to"), "should", "Use 'should' for a recommendation.", "Modal verbs"),
      mcq(m.possibleRiskQuestion, optionSet("might", "should to", "can to", "ought"), "might", "Use 'might' to describe a possible result.", "Modal verbs"),
      mcq(m.mustQuestion, optionSet(m.mustAnswer, "musts", "must to", "musting"), m.mustAnswer, `Use '${m.mustAnswer}' before the base verb.`, "Modal verbs"),
      mcq(m.canBenefitQuestion, optionSet("can", "can to", "could to", "ought"), "can", "Use 'can + base verb' for a possible benefit.", "Modal verbs"),
      mcq(m.shouldBaseQuestion, optionSet("should", "should to", "does", "is"), "should", "Use 'should' before the base verb.", "Modal verbs"),
      mcq(m.canBaseQuestion, optionSet("can", "cans", "can to", "could to"), "can", "Use 'can' before the base verb.", "Modal verbs")
    ],
    gapFill: [
      gap(m.gaps[0], "should", "Use 'should' for advice.", "Modal verbs"),
      gap(m.gaps[1], "can", "Use 'can' for ability or possibility.", "Modal verbs"),
      gap(m.gaps[2], "should", "Use 'should' for a recommendation.", "Modal verbs"),
      gap(m.gaps[3], "might", "Use 'might' to show possibility.", "Modal verbs"),
      gap(m.gaps[4], "can", "Use 'can + base verb'.", "Modal verbs")
    ],
    unscramble: m.unscramble.map((item) =>
      unscramble(words(item.answer), item.answer, item.explanation || "Modal verbs are followed by the base verb.", "Modal verbs")
    ),
    sentenceWriting: m.sentenceWriting.map((item) =>
      writing(item.question, item.keyword, item.sampleAnswer, item.explanation, "Modal verbs")
    )
  };
};

const conditionalSections = (mission) => {
  const m = mission.conditional;
  const defaultOptions = {
    "will become": optionSet("will become", "become", "became", "becoming"),
    "do not get": optionSet("do not get", "does not get", "did not get", "not getting"),
    "will have": optionSet("will have", "have", "had", "having"),
    get: optionSet("get", "gets", "got", "getting"),
    "will improve": optionSet("will improve", "improve", "improved", "improving"),
    "will reduce": optionSet("will reduce", "reduce", "reduced", "reducing"),
    check: optionSet("check", "checks", "checked", "checking"),
    "will make": optionSet("will make", "make", "made", "making"),
    "may avoid": optionSet("may avoid", "avoid", "avoided", "avoiding"),
    follow: optionSet("follow", "follows", "followed", "following"),
    eat: optionSet("eat", "eats", "ate", "eating"),
    cook: optionSet("cook", "cooks", "cooked", "cooking"),
    play: optionSet("play", "plays", "played", "playing"),
    join: optionSet("join", "joins", "joined", "joining"),
    sleep: optionSet("sleep", "sleeps", "slept", "sleeping"),
    avoid: optionSet("avoid", "avoids", "avoided", "avoiding"),
    trust: optionSet("trust", "trusts", "trusted", "trusting"),
    "will receive": optionSet("will receive", "receive", "received", "receiving"),
    "will identify": optionSet("will identify", "identify", "identified", "identifying"),
    "will follow": optionSet("will follow", "follow", "followed", "following"),
    "do not trust": optionSet("do not trust", "does not trust", "did not trust", "not trusting"),
    "will increase": optionSet("will increase", "increase", "increased", "increasing"),
    develop: optionSet("develop", "develops", "developed", "developing"),
    spread: optionSet("spread", "spreads", "spreaded", "spreading")
  };

  return {
    mcq: m.mcq.map((item) =>
      mcq(
        item.question,
        item.options || defaultOptions[item.correctAnswer] || optionSet(item.correctAnswer, "will", "does", "doing"),
        item.correctAnswer,
        item.explanation || "Use present simple in the if clause and will, may, or can in the result clause.",
        "Conditional sentences"
      )
    ),
    gapFill: [
      gap(m.gaps[0], m.gapAnswers[0], "The if clause uses present simple.", "Conditional sentences"),
      gap(m.gaps[1], m.gapAnswers[1], "Use the base verb with a plural subject.", "Conditional sentences"),
      gap(m.gaps[2], m.gapAnswers[2], "Use present simple after 'if'.", "Conditional sentences"),
      gap(m.gaps[3], m.gapAnswers[3], "Use present simple in the condition clause.", "Conditional sentences"),
      gap(m.gaps[4], m.gapAnswers[4], "Use the base verb after the subject in the if clause.", "Conditional sentences")
    ],
    unscramble: m.unscramble.map((item) =>
      unscramble(words(item.answer), item.answer, item.explanation || "Use if plus present simple, then a result clause.", "Conditional sentences")
    ),
    sentenceWriting: m.sentenceWriting.map((item) =>
      writing(item.question, item.keyword, item.sampleAnswer, item.explanation, "Conditional sentences")
    )
  };
};

const relativeSections = (mission) => {
  const m = mission.relative;

  return {
    mcq: [
      mcq(m.whoQuestion, optionSet("who", "which", "where", "whose"), "who", "Use 'who' for people.", "Relative clauses"),
      mcq(m.whichQuestion, optionSet("which", "who", "where", "whose"), "which", "Use 'which' for things, ideas, or activities.", "Relative clauses"),
      mcq(m.whereQuestion, optionSet("where", "who", "which", "whose"), "where", "Use 'where' for places or environments.", "Relative clauses"),
      mcq(m.whoQuestion2, optionSet("who", "which", "where", "whose"), "who", "Use 'who' to describe people.", "Relative clauses"),
      mcq(m.whyQuestion, optionSet("why", "who", "which", "where"), "why", "Use 'why' after the noun 'reason'.", "Relative clauses"),
      mcq(m.whoseQuestion, optionSet("whose", "who", "which", "where"), "whose", "Use 'whose' to show possession.", "Relative clauses"),
      mcq(m.whichQuestion2, optionSet("which", "who", "whose", "where"), "which", "Use 'which' for things or organizations.", "Relative clauses"),
      mcq(m.whoQuestion3, optionSet("who", "which", "where", "whose"), "who", "Use 'who' for people.", "Relative clauses"),
      mcq(m.whereQuestion2, optionSet("where", "who", "which", "whose"), "where", "Use 'where' for places or online spaces.", "Relative clauses"),
      mcq(m.whichQuestion3, optionSet("which", "who", "where", "whose"), "which", "Use 'which' for things or ideas.", "Relative clauses")
    ],
    gapFill: [
      gap(m.gaps[0], "who", "Use 'who' for people.", "Relative clauses"),
      gap(m.gaps[1], "which", "Use 'which' for things or ideas.", "Relative clauses"),
      gap(m.gaps[2], "where", "Use 'where' for places or environments.", "Relative clauses"),
      gap(m.gaps[3], "whose", "Use 'whose' to show possession.", "Relative clauses"),
      gap(m.gaps[4], "why", "Use 'why' after the noun 'reason'.", "Relative clauses")
    ],
    unscramble: m.unscramble.map((item) =>
      unscramble(words(item.answer), item.answer, item.explanation || "The relative clause describes the noun before it.", "Relative clauses")
    ),
    sentenceWriting: m.sentenceWriting.map((item) =>
      writing(item.question, item.keyword, item.sampleAnswer, item.explanation, "Relative clauses")
    )
  };
};

const complexSections = (mission) => {
  const m = mission.complex;

  return {
    mcq: [
      mcq(m.becauseQuestion, optionSet("because", "although", "unless", "while"), "because", "Use 'because' to introduce a reason.", "Complex sentences"),
      mcq(m.althoughQuestion, optionSet("Although", "Because", "If", "Since"), "Although", "Use 'although' to show contrast.", "Complex sentences"),
      mcq(m.ifQuestion, optionSet("if", "although", "because", "while"), "if", "Use 'if' to introduce a condition.", "Complex sentences"),
      mcq(m.becauseQuestion2, optionSet("because", "although", "unless", "while"), "because", "Use 'because' to explain the reason.", "Complex sentences"),
      mcq(m.althoughQuestion2, optionSet("Although", "Because", "If", "Since"), "Although", "Use 'although' for an unexpected contrast.", "Complex sentences"),
      mcq(m.ifQuestion2, optionSet("if", "because", "although", "while"), "if", "Use 'if' for a possible condition.", "Complex sentences"),
      mcq(m.becauseQuestion3, optionSet("because", "although", "unless", "while"), "because", "Use 'because' before a reason clause.", "Complex sentences"),
      mcq(m.althoughQuestion3, optionSet("Although", "Because", "If", "Since"), "Although", "Use 'although' to contrast two ideas.", "Complex sentences"),
      mcq(m.ifQuestion3, optionSet("if", "because", "although", "while"), "if", "Use 'if' for a condition.", "Complex sentences"),
      mcq(m.becauseQuestion4, optionSet("because", "although", "unless", "while"), "because", "Use 'because' to connect an effect with its reason.", "Complex sentences")
    ],
    gapFill: [
      gap(m.gaps[0], "because", "Use 'because' to explain a reason.", "Complex sentences"),
      gap(m.gaps[1], "Although", "Use 'Although' to show contrast at the start of a sentence.", "Complex sentences"),
      gap(m.gaps[2], "if", "Use 'if' to introduce a condition.", "Complex sentences"),
      gap(m.gaps[3], "because", "Use 'because' before a reason clause.", "Complex sentences"),
      gap(m.gaps[4], "Although", "Use 'Although' to show contrast.", "Complex sentences")
    ],
    unscramble: m.unscramble.map((item) =>
      unscramble(words(item.answer), item.answer, item.explanation || "A complex sentence has one main clause and one dependent clause.", "Complex sentences")
    ),
    sentenceWriting: m.sentenceWriting.map((item) =>
      writing(item.question, item.keyword, item.sampleAnswer, item.explanation, "Complex sentences")
    )
  };
};

const buildActivities = (mission) => {
  let order = 1;
  const sectionBuilders = [
    presentSimpleSections,
    modalSections,
    conditionalSections,
    relativeSections,
    complexSections
  ];

  return grammarTasks.flatMap((task, index) => {
    const activities = buildTaskActivities(task, sectionBuilders[index](mission), order);
    order += activities.length;
    return activities;
  });
};

const healthMissionSources = [
  {
    title: "Fast food",
    seedAliases: ["Fast Food"],
    slug: "fast-food",
    order: 1,
    mapTheme: "fast-food",
    description: "Practice grammar for explaining fast food habits, risks, advice, and healthier choices.",
    writingQuestion: "Should people eat less fast food? Write a paragraph of about 100 words.",
    writingHints: [
      "Explain why fast food is popular with students and busy people.",
      "Mention health risks such as too much fat, sugar, or salt.",
      "Give advice and use at least one conditional or complex sentence."
    ],
    grammarReminders: [
      "Use present simple for facts and habits.",
      "Use modal verbs such as should, must, can, may, and might before base verbs.",
      "Use conditional, relative, and complex sentences to connect ideas."
    ],
    sentencePatterns: [
      "Although fast food is convenient, people should not eat it too often.",
      "Teenagers who eat junk food regularly may develop unhealthy habits.",
      "If people cook at home more often, they will eat less fast food."
    ],
    finalWritingModelParagraphs: [
      {
        label: "Stronger model",
        text:
          "Many people eat fast food because it is cheap and convenient. However, people should reduce it because it often contains too much fat, sugar, and salt. Teenagers who eat junk food regularly may develop unhealthy habits. If families cook at home more often, they can choose fresher ingredients and protect their health."
      },
      {
        label: "Needs revision",
        text:
          "Fast food is good and many students like it. It is cheap and easy. People eat it every day. It has fat and sugar. I think fast food is bad but some people like it. Students should eat good food and not eat too much fast food."
      }
    ],
    helpfulIdeas: ["obesity", "unhealthy habits", "convenience", "home-cooked meals", "sugar and fat"],
    usefulStructures: [
      "I strongly believe that ...",
      "Although fast food is convenient, ...",
      "If people eat too much fast food, ...",
      "Teenagers who eat junk food regularly ..."
    ],
    selfCheckQuestions: [
      "Did I clearly express my opinion?",
      "Did I give at least two supporting reasons?",
      "Did I use correct grammar from the five tasks?"
    ],
    presentSimple: {
      mcq: [
        mcq("Many teenagers ___ fast food because it is cheap and convenient.", optionSet("like", "likes", "liking", "liked"), "like", "Use 'like' because 'Many teenagers' is plural."),
        mcq("Fast food restaurants usually ___ food very quickly.", optionSet("serve", "serves", "serving", "served"), "serve", "Use 'serve' because 'restaurants' is plural."),
        mcq("Too much fast food ___ health problems for children.", optionSet("causes", "cause", "causing", "caused"), "causes", "Use 'causes' because 'Too much fast food' is singular."),
        mcq("Many students ___ burgers after school.", optionSet("buy", "buys", "buying", "bought"), "buy", "Use 'buy' because 'Many students' is plural."),
        mcq("Fast food ___ more popular in big cities.", optionSet("becomes", "become", "becoming", "became"), "becomes", "Use 'becomes' because 'Fast food' is singular."),
        mcq("Some parents ___ that fast food is unhealthy.", optionSet("think", "thinks", "thinking", "thought"), "think", "Use 'think' because 'Some parents' is plural."),
        mcq("A fast food meal usually ___ a lot of salt and sugar.", optionSet("contains", "contain", "containing", "contained"), "contains", "Use 'contains' because 'A fast food meal' is singular."),
        mcq("Many fast food companies ___ advertisements for children.", optionSet("create", "creates", "creating", "created"), "create", "Use 'create' because 'companies' is plural."),
        mcq("Eating fast food every day ___ people gain weight.", optionSet("makes", "make", "making", "made"), "makes", "Use 'makes' because the gerund phrase is singular."),
        mcq("Some people ___ fast food because they are too busy to cook.", optionSet("choose", "chooses", "choosing", "chose"), "choose", "Use 'choose' because 'Some people' is plural.")
      ],
      gapFill: [
        gap("Fast food restaurants ___ cheap meals for students.", "offer", "Use the base verb because 'restaurants' is plural."),
        gap("Too much junk food ___ the risk of obesity.", "increases", "Use 'increases' because 'Too much junk food' is singular."),
        gap("Many teenagers ___ fried chicken several times a week.", "eat", "Use 'eat' because 'teenagers' is plural."),
        gap("Fast food advertising ___ young consumers strongly.", "influences", "Use 'influences' because 'advertising' is singular."),
        gap("Some families ___ fast food because it saves time.", "prefer", "Use 'prefer' because 'families' is plural.")
      ],
      unscramble: [
        { answer: "Many people eat fast food every week.", explanation: "Begin with the subject, then the present simple verb." },
        { answer: "Fast food often contains too much fat.", explanation: "Place 'often' before the main verb." },
        { answer: "Students usually buy unhealthy snacks after class.", explanation: "Use subject, adverb, verb, object, and time phrase." }
      ],
      sentenceWriting: [
        { question: "Write one present simple sentence about fast food habits.", keyword: "fast food", sampleAnswer: "Many students buy fast food after school.", explanation: "Use present simple to describe a habit." },
        { question: "Write one present simple sentence about a health risk.", keyword: "health", sampleAnswer: "Too much fast food causes health problems.", explanation: "Use present simple for a general truth." }
      ]
    },
    modal: {
      shouldQuestion: "People ___ eat less fast food because it is unhealthy.",
      canQuestion: "Students ___ save time by eating fast food after school.",
      negativeAdviceQuestion: "People ___ eat too much fried food every day.",
      mightQuestion: "Fast food restaurants ___ become more popular in the future.",
      responsibilityQuestion: "Parents ___ encourage children to eat more home-cooked meals.",
      possibleRiskQuestion: "Eating too much fast food ___ lead to obesity.",
      mustQuestion: "Fast food companies ___ provide clearer nutrition information.",
      mustAnswer: "must",
      canBenefitQuestion: "Families ___ choose healthier meals at home.",
      shouldBaseQuestion: "Children ___ choose vegetables with their meals.",
      canBaseQuestion: "Fast food ___ save time for busy workers.",
      gaps: [
        "People ___ limit the amount of fast food they eat.",
        "Teenagers ___ order fast food online nowadays.",
        "Parents ___ teach children about healthy eating habits.",
        "Eating too much fried food ___ cause serious health problems.",
        "Students ___ choose water instead of sugary drinks."
      ],
      unscramble: [
        { answer: "People should avoid eating too much fast food." },
        { answer: "Fast food can save time for busy workers." },
        { answer: "Children should choose healthier meals." }
      ],
      sentenceWriting: [
        { question: "Write one advice sentence with should.", keyword: "should", sampleAnswer: "People should eat less fast food.", explanation: "Use 'should + base verb' for advice." },
        { question: "Write one possibility sentence with may or might.", keyword: "might", sampleAnswer: "Eating too much fast food might cause health problems.", explanation: "Use 'might + base verb' for possibility." }
      ]
    },
    conditional: {
      mcq: [
        { question: "If people eat too much fast food, they ___ unhealthy.", correctAnswer: "will become" },
        { question: "People may gain weight if they ___ enough healthy food.", correctAnswer: "do not get" },
        { question: "If children drink too much soda, they ___ health problems.", correctAnswer: "will have" },
        { question: "Students will feel better if they ___ more home-cooked meals.", correctAnswer: "get" },
        { question: "If restaurants offer healthier meals, public health ___.", correctAnswer: "will improve" },
        { question: "If families cook at home, they ___ junk food consumption.", correctAnswer: "will reduce" },
        { question: "People may feel healthier if they ___ nutrition labels.", correctAnswer: "check" },
        { question: "If fast food companies reduce sugar, they ___ meals safer.", correctAnswer: "will make" },
        { question: "Teenagers ___ unhealthy habits if they eat junk food every day.", correctAnswer: "will have" },
        { question: "If parents teach healthy habits, children ___ better choices.", correctAnswer: "will make" }
      ],
      gaps: [
        "If students ___ too much fast food, they will gain weight.",
        "People will feel healthier if they ___ junk food consumption.",
        "If restaurants ___ healthier menus, more families will visit them.",
        "If children ___ less soda, they may have better health.",
        "People will save time if they ___ food online."
      ],
      gapAnswers: ["eat", "reduce", "provide", "drink", "order"],
      unscramble: [
        { answer: "If people eat too much fast food, they will gain weight." },
        { answer: "Customers will choose healthier meals if restaurants offer them." },
        { answer: "If teenagers exercise more, they may avoid health problems." }
      ],
      sentenceWriting: [
        { question: "Write one if sentence about eating fast food.", keyword: "if", sampleAnswer: "If people eat too much fast food, they may gain weight.", explanation: "Use if plus present simple, then a result clause." },
        { question: "Write one conditional sentence about healthy meals.", keyword: "will", sampleAnswer: "People will feel healthier if they cook at home.", explanation: "Use 'will + base verb' for the result." }
      ]
    },
    relative: {
      whoQuestion: "Teenagers ___ eat fast food regularly may have health problems.",
      whichQuestion: "Fast food is food ___ people can prepare very quickly.",
      whereQuestion: "Fast food restaurants are places ___ people can buy cheap meals.",
      whoQuestion2: "Parents ___ care about children's health often limit fast food.",
      whyQuestion: "Fast food is one reason ___ many people gain weight.",
      whoseQuestion: "Children ___ parents cook healthy meals usually eat less fast food.",
      whichQuestion2: "Restaurants ___ provide healthy options attract more customers.",
      whoQuestion3: "People ___ eat too much junk food may become overweight.",
      whereQuestion2: "School cafeterias are places ___ students should find healthy food.",
      whichQuestion3: "Burgers ___ contain too much fat are unhealthy.",
      gaps: [
        "Teenagers ___ eat fast food every day may face health issues.",
        "Restaurants ___ offer healthier food choices attract more customers.",
        "Fast food restaurants are places ___ students buy quick meals.",
        "Children ___ parents cook at home often eat less junk food.",
        "Fast food is one reason ___ obesity rates rise."
      ],
      unscramble: [
        { answer: "People who eat too much fast food may become unhealthy." },
        { answer: "Restaurants which offer healthy meals attract more families." },
        { answer: "Children whose parents cook at home often eat less junk food." }
      ],
      sentenceWriting: [
        { question: "Write one relative clause sentence with who.", keyword: "who", sampleAnswer: "Teenagers who eat junk food regularly may develop unhealthy habits.", explanation: "Use 'who' to describe people." },
        { question: "Write one relative clause sentence with which.", keyword: "which", sampleAnswer: "Restaurants which serve healthier meals become more popular.", explanation: "Use 'which' to describe things or businesses." }
      ]
    },
    complex: {
      becauseQuestion: "Many people eat fast food ___ it is convenient.",
      althoughQuestion: "___ fast food is cheap, it is not always healthy.",
      ifQuestion: "People may gain weight ___ they eat too much junk food.",
      becauseQuestion2: "Students often buy fast food ___ they do not have enough time to cook.",
      althoughQuestion2: "___ many restaurants offer healthy meals, some people still prefer burgers.",
      ifQuestion2: "Children may develop unhealthy habits ___ their parents allow too much fast food.",
      becauseQuestion3: "Many families cook at home ___ they want healthier meals.",
      althoughQuestion3: "___ fast food saves time, it can cause health problems.",
      ifQuestion3: "People can improve their health ___ they reduce junk food consumption.",
      becauseQuestion4: "Some people choose fast food ___ they are too busy to cook.",
      gaps: [
        "Many teenagers eat fast food ___ it is affordable and convenient.",
        "___ fast food is popular, it is not always nutritious.",
        "People can improve their health ___ they reduce junk food consumption.",
        "Students often order fast food online ___ they are busy with schoolwork.",
        "___ fast food is convenient, people should not eat it too often."
      ],
      unscramble: [
        { answer: "Many people eat fast food because it saves time." },
        { answer: "Although fast food is unhealthy, many teenagers enjoy it." },
        { answer: "If people eat too much junk food, they may gain weight." }
      ],
      sentenceWriting: [
        { question: "Write one complex sentence with although.", keyword: "although", sampleAnswer: "Although fast food is convenient, people should not eat it too often.", explanation: "Use 'although' to contrast two ideas." },
        { question: "Write one complex sentence with because.", keyword: "because", sampleAnswer: "Students buy fast food because they are busy.", explanation: "Use 'because' to give a reason." }
      ]
    }
  },
  {
    title: "Exercise and Fitness",
    seedAliases: ["Exercise"],
    slug: "exercise-and-fitness",
    order: 2,
    mapTheme: "exercise",
    description: "Practice grammar for explaining exercise habits, health benefits, and active routines.",
    writingQuestion: "Should students exercise regularly? Write a paragraph of about 100 words.",
    writingHints: [
      "Explain how exercise supports physical and mental health.",
      "Mention stress, concentration, energy, or screen time.",
      "Use should, if, who, because, or although to connect your ideas."
    ],
    grammarReminders: [
      "Use present simple for general facts about exercise.",
      "Use modal verbs before base verbs.",
      "Use conditional, relative, and complex sentences to explain benefits."
    ],
    sentencePatterns: [
      "Students should exercise regularly to stay healthy.",
      "Teenagers who play sports often have more energy.",
      "If students exercise regularly, they will feel healthier."
    ],
    finalWritingModelParagraphs: [
      {
        label: "Stronger model",
        text:
          "Regular exercise plays an important role in student health. Students should exercise regularly because it helps them become stronger, happier, and less stressed. Teenagers who play sports often concentrate better in class. If young people build active routines early, they will likely keep healthier habits in the future."
      },
      {
        label: "Needs revision",
        text:
          "Exercise is good for students. It help them healthy and happy. Students should exercises every day because exercise make people stronger. Although exercise is good but many students do not do it."
      }
    ],
    helpfulIdeas: ["physical health", "reduce stress", "better concentration", "less screen time", "more energy"],
    usefulStructures: [
      "I strongly believe that ...",
      "Although exercise takes time, ...",
      "If students exercise regularly, ...",
      "Teenagers who play sports ..."
    ],
    selfCheckQuestions: [
      "Did I clearly express my opinion?",
      "Did I support my ideas with reasons or examples?",
      "Did I include grammar from the five tasks?"
    ],
    presentSimple: {
      mcq: [
        mcq("Regular exercise ___ people stay healthy.", optionSet("helps", "help", "helping", "helped"), "helps", "Use 'helps' because 'Regular exercise' is singular."),
        mcq("Many students ___ sports after school.", optionSet("play", "plays", "playing", "played"), "play", "Use 'play' because 'students' is plural."),
        mcq("Exercise ___ stress and improves mental health.", optionSet("reduces", "reduce", "reducing", "reduced"), "reduces", "Use 'reduces' because 'Exercise' is singular."),
        mcq("People who exercise regularly ___ more energy.", optionSet("have", "has", "having", "had"), "have", "Use 'have' because 'People' is plural."),
        mcq("Too little physical activity ___ health problems.", optionSet("causes", "cause", "causing", "caused"), "causes", "Use 'causes' because the subject is singular."),
        mcq("Many teenagers ___ too much time sitting indoors.", optionSet("spend", "spends", "spending", "spent"), "spend", "Use 'spend' because 'teenagers' is plural."),
        mcq("Daily exercise ___ concentration in class.", optionSet("improves", "improve", "improving", "improved"), "improves", "Use 'improves' because 'Daily exercise' is singular."),
        mcq("Some students ___ the gym because they want to stay fit.", optionSet("visit", "visits", "visiting", "visited"), "visit", "Use 'visit' because 'students' is plural."),
        mcq("Exercise ___ an important role in a healthy lifestyle.", optionSet("plays", "play", "playing", "played"), "plays", "Use 'plays' because 'Exercise' is singular."),
        mcq("Many workers ___ exercise because they are too busy.", optionSet("avoid", "avoids", "avoiding", "avoided"), "avoid", "Use 'avoid' because 'workers' is plural.")
      ],
      gapFill: [
        gap("Exercise ___ both physical and mental health.", "improves", "Use 'improves' because 'Exercise' is singular."),
        gap("Many students ___ sports clubs after school.", "join", "Use 'join' because 'students' is plural."),
        gap("Too much screen time ___ physical activity.", "reduces", "Use 'reduces' because the subject is singular."),
        gap("People who exercise regularly ___ happier.", "feel", "Use 'feel' because 'People' is plural."),
        gap("A healthy lifestyle ___ regular exercise and good sleep.", "includes", "Use 'includes' because 'A healthy lifestyle' is singular.")
      ],
      unscramble: [
        { answer: "Many students exercise every morning before school.", explanation: "Start with the subject, then the present simple verb." },
        { answer: "Regular exercise reduces stress and anxiety.", explanation: "Use 'reduces' because 'Regular exercise' is singular." },
        { answer: "People often feel healthier after exercise.", explanation: "Place 'often' before the main verb." }
      ],
      sentenceWriting: [
        { question: "Write one present simple sentence about exercise.", keyword: "exercise", sampleAnswer: "Regular exercise improves students' health.", explanation: "Use present simple for a general fact." },
        { question: "Write one present simple sentence about active students.", keyword: "students", sampleAnswer: "Many students play sports after school.", explanation: "Use present simple for a habit." }
      ]
    },
    modal: {
      shouldQuestion: "Students ___ exercise regularly to stay healthy.",
      canQuestion: "People ___ improve their health by walking every day.",
      negativeAdviceQuestion: "Teenagers ___ spend all day sitting indoors.",
      mightQuestion: "People who rarely exercise ___ develop health problems.",
      responsibilityQuestion: "Schools ___ provide more sports activities for students.",
      possibleRiskQuestion: "Too little physical activity ___ cause serious health issues.",
      mustQuestion: "Students ___ warm up before hard exercise.",
      mustAnswer: "should",
      canBenefitQuestion: "Regular exercise ___ help students concentrate better in class.",
      shouldBaseQuestion: "Parents ___ encourage children to play outdoor sports.",
      canBaseQuestion: "Exercise ___ reduce stress and improve mental health.",
      gaps: [
        "Students ___ exercise regularly to maintain good health.",
        "People ___ improve their fitness by walking every day.",
        "Schools ___ create more opportunities for physical activities.",
        "Teenagers who avoid exercise ___ become unhealthy.",
        "Exercise ___ help people sleep better at night."
      ],
      unscramble: [
        { answer: "Students should exercise every day." },
        { answer: "Exercise can improve mental health." },
        { answer: "People might develop health problems without exercise." }
      ],
      sentenceWriting: [
        { question: "Write one advice sentence with should.", keyword: "should", sampleAnswer: "Students should exercise regularly.", explanation: "Use 'should + base verb' for advice." },
        { question: "Write one possibility sentence with can.", keyword: "can", sampleAnswer: "Exercise can reduce stress.", explanation: "Use 'can + base verb' to show a possible benefit." }
      ]
    },
    conditional: {
      mcq: [
        { question: "If students exercise regularly, they ___ healthier.", correctAnswer: "will become" },
        { question: "People may gain weight if they ___ enough exercise.", correctAnswer: "do not get" },
        { question: "If people use their phones too much, they ___ fewer active hours.", correctAnswer: "will have" },
        { question: "Students will feel less stressed if they ___ enough exercise.", correctAnswer: "get" },
        { question: "If people walk more often, their fitness ___.", correctAnswer: "will improve" },
        { question: "If schools provide sports activities, they ___ student stress.", correctAnswer: "will reduce" },
        { question: "People may sleep better if they ___ regularly.", correctAnswer: "exercise", options: optionSet("exercise", "exercises", "exercised", "exercising") },
        { question: "If teenagers exercise every day, it ___ them stronger.", correctAnswer: "will make" },
        { question: "Students ___ illness if they stay physically active.", correctAnswer: "may avoid" },
        { question: "If students follow an active routine, they ___ it more easily.", correctAnswer: "will follow" }
      ],
      gaps: [
        "If students ___ regularly, they will stay healthier.",
        "People will feel happier if they ___ physical activities every day.",
        "If teenagers ___ exercise, they may become unhealthy.",
        "Students will improve their fitness if they ___ sports clubs.",
        "If people walk more often, they ___ more calories."
      ],
      gapAnswers: ["exercise", "do", "avoid", "join", "burn"],
      unscramble: [
        { answer: "If students exercise regularly, they will feel healthier." },
        { answer: "People will improve their health if they walk every day." },
        { answer: "If teenagers spend too much time indoors, they may become unhealthy." }
      ],
      sentenceWriting: [
        { question: "Write one if sentence about exercise.", keyword: "if", sampleAnswer: "If students exercise regularly, they will reduce stress.", explanation: "Use if plus present simple, then a result clause." },
        { question: "Write one conditional sentence about sports.", keyword: "will", sampleAnswer: "Students will improve concentration if they join sports activities.", explanation: "Use 'will + base verb' for the result." }
      ]
    },
    relative: {
      whoQuestion: "People ___ exercise regularly usually have better health.",
      whichQuestion: "Exercise is an activity ___ improves physical and mental health.",
      whereQuestion: "Gyms are places ___ people can improve their fitness.",
      whoQuestion2: "Students ___ participate in sports activities often feel energetic.",
      whyQuestion: "Exercise is one reason ___ many people sleep better.",
      whoseQuestion: "Teenagers ___ parents encourage activity often develop healthier habits.",
      whichQuestion2: "Sports clubs ___ provide good facilities attract many students.",
      whoQuestion3: "People ___ spend too much time indoors may become less healthy.",
      whereQuestion2: "Parks are places ___ families can exercise together.",
      whichQuestion3: "Exercise is an important habit ___ helps students reduce stress.",
      gaps: [
        "Students ___ exercise every day usually feel healthier.",
        "Exercise is an activity ___ improves concentration.",
        "Gyms are places ___ people can stay active.",
        "Teenagers ___ parents support sports activities often become more confident.",
        "Exercise is one reason ___ students feel less stressed."
      ],
      unscramble: [
        { answer: "People who exercise regularly often feel happier." },
        { answer: "Sports clubs which provide good facilities attract many students." },
        { answer: "Students whose parents encourage exercise usually stay healthier." }
      ],
      sentenceWriting: [
        { question: "Write one relative clause sentence with who.", keyword: "who", sampleAnswer: "Teenagers who exercise regularly often have better mental health.", explanation: "Use 'who' to describe people." },
        { question: "Write one relative clause sentence with where.", keyword: "where", sampleAnswer: "Parks where people exercise together help communities become healthier.", explanation: "Use 'where' to describe places." }
      ]
    },
    complex: {
      becauseQuestion: "Many people exercise regularly ___ they want to stay healthy.",
      althoughQuestion: "___ exercise improves physical health, many teenagers avoid it.",
      ifQuestion: "Students may become unhealthy ___ they do not exercise regularly.",
      becauseQuestion2: "People often feel happier ___ they exercise every day.",
      althoughQuestion2: "___ many students are busy, they still make time for exercise.",
      ifQuestion2: "Teenagers can improve fitness ___ they join sports clubs.",
      becauseQuestion3: "Many people exercise in the morning ___ it helps them feel energetic.",
      althoughQuestion3: "___ exercise takes time, it provides many health benefits.",
      ifQuestion3: "People may gain weight ___ they spend too much time sitting indoors.",
      becauseQuestion4: "Students exercise after school ___ they want to reduce stress.",
      gaps: [
        "Many people go to the gym ___ they want to improve their health.",
        "___ exercise is important, some teenagers still avoid physical activities.",
        "People can become healthier ___ they exercise regularly.",
        "Students feel more energetic ___ they participate in sports activities.",
        "___ many workers are busy, they still try to stay physically active."
      ],
      unscramble: [
        { answer: "Many people exercise regularly because they want to stay healthy." },
        { answer: "Although exercise takes time, it improves mental health." },
        { answer: "If students exercise every day, they may feel healthier." }
      ],
      sentenceWriting: [
        { question: "Write one complex sentence with although.", keyword: "although", sampleAnswer: "Although many teenagers feel busy, they should exercise regularly.", explanation: "Use 'although' to contrast two ideas." },
        { question: "Write one complex sentence with if.", keyword: "if", sampleAnswer: "People can improve their health if they stay physically active.", explanation: "Use 'if' to show a condition." }
      ]
    }
  },
  {
    title: "Sleep Habits",
    slug: "sleep-habits",
    order: 3,
    mapTheme: "sleep",
    description: "Practice grammar for explaining sleep routines, concentration, stress, and study performance.",
    writingQuestion: "Should teenagers develop healthier sleep habits? Write a paragraph of about 100 words.",
    writingHints: [
      "Explain how sleep affects concentration, memory, and stress.",
      "Mention screen time, regular bedtimes, or enough rest.",
      "Use a conditional sentence and one complex sentence."
    ],
    grammarReminders: [
      "Use present simple to describe general sleep habits.",
      "Use should and can to give advice and describe benefits.",
      "Use relative and complex sentences to connect causes and results."
    ],
    sentencePatterns: [
      "Good sleep helps students concentrate better in class.",
      "Students who sleep early often perform better at school.",
      "If teenagers get enough sleep, they may feel more energetic."
    ],
    finalWritingModelParagraphs: [
      {
        label: "Stronger model",
        text:
          "Getting enough sleep is important for students' physical and mental health. Teenagers should develop healthy sleep habits because sleep affects concentration and emotional balance. Students who sleep early often perform better at school. If teenagers keep a regular sleep schedule, they will likely feel healthier and more productive."
      },
      {
        label: "Needs revision",
        text:
          "Sleep is important for students. Teenagers should sleeps earlier because good sleep help them. If students do not sleeping enough, they may becomes tired. Although sleep is important but many students ignore it."
      }
    ],
    helpfulIdeas: ["concentration", "stress", "academic performance", "less screen time", "more energy"],
    usefulStructures: [
      "Although students are busy, ...",
      "If teenagers sleep enough, ...",
      "Students who sleep early ...",
      "Teenagers should ..."
    ],
    selfCheckQuestions: [
      "Did I clearly express my opinion?",
      "Did I explain how sleep affects studying?",
      "Did I use grammar from Task 1 to Task 5?"
    ],
    presentSimple: {
      mcq: [
        mcq("Good sleep ___ students concentrate better in class.", optionSet("helps", "help", "helping", "helped"), "helps", "Use 'helps' because 'Good sleep' is singular."),
        mcq("Many teenagers ___ to bed too late at night.", optionSet("go", "goes", "going", "went"), "go", "Use 'go' because 'teenagers' is plural."),
        mcq("Lack of sleep ___ students feel tired during the day.", optionSet("makes", "make", "making", "made"), "makes", "Use 'makes' because 'Lack of sleep' is singular."),
        mcq("Students who sleep early ___ more energy in the morning.", optionSet("have", "has", "having", "had"), "have", "Use 'have' because 'Students' is plural."),
        mcq("Too much screen time ___ sleep quality.", optionSet("affects", "affect", "affecting", "affected"), "affects", "Use 'affects' because the subject is singular."),
        mcq("Many students ___ tired because they stay up late.", optionSet("feel", "feels", "feeling", "felt"), "feel", "Use 'feel' because 'students' is plural."),
        mcq("A healthy sleep schedule ___ both physical and mental health.", optionSet("improves", "improve", "improving", "improved"), "improves", "Use 'improves' because the subject is singular."),
        mcq("Some teenagers ___ coffee at night to stay awake.", optionSet("drink", "drinks", "drinking", "drank"), "drink", "Use 'drink' because 'teenagers' is plural."),
        mcq("Sleep ___ an important role in students' health.", optionSet("plays", "play", "playing", "played"), "plays", "Use 'plays' because 'Sleep' is singular."),
        mcq("Many teenagers ___ enough sleep during the school week.", optionSet("do not get", "not get", "does not get", "not getting"), "do not get", "Use 'do not get' because 'teenagers' is plural.")
      ],
      gapFill: [
        gap("Good sleep ___ students' concentration.", "improves", "Use 'improves' because 'Good sleep' is singular."),
        gap("Many teenagers ___ their phones before bed.", "use", "Use 'use' because 'teenagers' is plural."),
        gap("Too little sleep ___ stress and tiredness.", "causes", "Use 'causes' because the subject is singular."),
        gap("Students who sleep early ___ more energetic.", "feel", "Use 'feel' because 'Students' is plural."),
        gap("A healthy lifestyle ___ enough sleep every night.", "includes", "Use 'includes' because 'A healthy lifestyle' is singular.")
      ],
      unscramble: [
        { answer: "Many students sleep late because of homework.", explanation: "Begin with the subject and present simple verb." },
        { answer: "Good sleep improves students' mental health.", explanation: "Use 'improves' because 'Good sleep' is singular." },
        { answer: "Teenagers often feel tired after staying up late.", explanation: "Place 'often' before the main verb." }
      ],
      sentenceWriting: [
        { question: "Write one present simple sentence about sleep.", keyword: "sleep", sampleAnswer: "Good sleep helps students concentrate better.", explanation: "Use present simple for a general fact." },
        { question: "Write one present simple sentence about screen time.", keyword: "screen", sampleAnswer: "Too much screen time affects sleep quality.", explanation: "Use present simple to explain a general truth." }
      ]
    },
    modal: {
      shouldQuestion: "Teenagers ___ sleep at least eight hours every night.",
      canQuestion: "Students ___ improve concentration by sleeping earlier.",
      negativeAdviceQuestion: "People ___ use phones for hours before bedtime.",
      mightQuestion: "Teenagers who sleep too little ___ feel stressed during the day.",
      responsibilityQuestion: "Parents ___ encourage children to sleep earlier.",
      possibleRiskQuestion: "Lack of sleep ___ cause serious health problems.",
      mustQuestion: "Students ___ avoid drinking coffee late at night.",
      mustAnswer: "should",
      canBenefitQuestion: "Good sleep ___ improve students' concentration at school.",
      shouldBaseQuestion: "Teenagers ___ follow a regular sleep schedule.",
      canBaseQuestion: "Students who sleep well ___ perform better at school.",
      gaps: [
        "Teenagers ___ sleep earlier to improve their health.",
        "Students ___ feel more energetic if they get enough sleep.",
        "Parents ___ limit their children's screen time before bed.",
        "Teenagers who stay up late ___ become unhealthy.",
        "Good sleep ___ improve students' concentration at school."
      ],
      unscramble: [
        { answer: "Students should sleep earlier every night." },
        { answer: "Good sleep can improve mental health." },
        { answer: "Teenagers might feel tired during class." }
      ],
      sentenceWriting: [
        { question: "Write one advice sentence with should.", keyword: "should", sampleAnswer: "Teenagers should sleep earlier every night.", explanation: "Use 'should + base verb' for advice." },
        { question: "Write one benefit sentence with can.", keyword: "can", sampleAnswer: "Good sleep can improve concentration.", explanation: "Use 'can + base verb' for a possible benefit." }
      ]
    },
    conditional: {
      mcq: [
        { question: "If teenagers sleep early, they ___ healthier.", correctAnswer: "will become" },
        { question: "Students may feel tired if they ___ enough sleep.", correctAnswer: "do not get" },
        { question: "If people use phones before bed, they ___ difficulty sleeping.", correctAnswer: "will have" },
        { question: "Students will concentrate better if they ___ enough sleep.", correctAnswer: "get" },
        { question: "If teenagers follow a sleep schedule, their health ___.", correctAnswer: "will improve" },
        { question: "If students sleep earlier, they ___ daytime tiredness.", correctAnswer: "will reduce" },
        { question: "People may feel healthier if they ___ enough rest.", correctAnswer: "get" },
        { question: "If teenagers avoid caffeine at night, it ___ better sleep possible.", correctAnswer: "will make" },
        { question: "Students ___ stress if they sleep enough.", correctAnswer: "may avoid" },
        { question: "If students follow healthy sleep habits, they ___ better routines.", correctAnswer: "will have" }
      ],
      gaps: [
        "If teenagers ___ earlier, they will feel healthier.",
        "Students will concentrate better if they ___ enough sleep.",
        "If people ___ using phones before bed, they may sleep better.",
        "Teenagers will feel less tired if they ___ healthy sleep habits.",
        "If students sleep early, they ___ better at school."
      ],
      gapAnswers: ["sleep", "get", "avoid", "follow", "perform"],
      unscramble: [
        { answer: "If students sleep early, they will feel more energetic." },
        { answer: "People will improve their health if they get enough sleep." },
        { answer: "If teenagers stay up too late, they may feel tired." }
      ],
      sentenceWriting: [
        { question: "Write one if sentence about sleep.", keyword: "if", sampleAnswer: "If students sleep enough, they may concentrate better.", explanation: "Use if plus present simple, then a result clause." },
        { question: "Write one conditional sentence about screen time.", keyword: "will", sampleAnswer: "Teenagers will sleep better if they avoid phones before bed.", explanation: "Use 'will + base verb' for a likely result." }
      ]
    },
    relative: {
      whoQuestion: "Students ___ sleep enough usually perform better at school.",
      whichQuestion: "Sleep is an important habit ___ improves mental health.",
      whereQuestion: "Bedrooms are places ___ people should relax and rest.",
      whoQuestion2: "Teenagers ___ stay up late often feel tired during class.",
      whyQuestion: "Lack of sleep is one reason ___ students cannot concentrate well.",
      whoseQuestion: "Teenagers ___ parents set sleep schedules often sleep earlier.",
      whichQuestion2: "Healthy habits ___ improve sleep quality are important.",
      whoQuestion3: "People ___ use phones before bed may have trouble sleeping.",
      whereQuestion2: "Homes are places ___ children should develop sleep habits.",
      whichQuestion3: "Sleep is an important factor ___ affects students' concentration.",
      gaps: [
        "Students ___ sleep early usually feel more energetic.",
        "Sleep is a habit ___ helps people stay healthy.",
        "Bedrooms are places ___ people should relax quietly.",
        "Teenagers ___ parents limit screen time often sleep better.",
        "Lack of sleep is one reason ___ students feel stressed."
      ],
      unscramble: [
        { answer: "Students who sleep enough often feel healthier." },
        { answer: "Healthy habits which improve sleep quality are important." },
        { answer: "Teenagers whose parents set sleep schedules usually sleep earlier." }
      ],
      sentenceWriting: [
        { question: "Write one relative clause sentence with who.", keyword: "who", sampleAnswer: "Students who sleep early often perform better at school.", explanation: "Use 'who' to describe people." },
        { question: "Write one relative clause sentence with where.", keyword: "where", sampleAnswer: "Bedrooms where people relax quietly help improve sleep quality.", explanation: "Use 'where' to describe places." }
      ]
    },
    complex: {
      becauseQuestion: "Many students feel tired ___ they do not sleep enough.",
      althoughQuestion: "___ sleep is important, many teenagers still stay up late.",
      ifQuestion: "Students may have difficulty concentrating ___ they do not get enough sleep.",
      becauseQuestion2: "Teenagers often feel healthier ___ they sleep early every night.",
      althoughQuestion2: "___ many students are busy with homework, they still need enough sleep.",
      ifQuestion2: "Students can improve their health ___ they maintain a regular sleep schedule.",
      becauseQuestion3: "Many teenagers use phones before bed ___ they want to relax.",
      althoughQuestion3: "___ sleeping early can be difficult, it helps students feel energetic.",
      ifQuestion3: "Students may feel stressed ___ they sleep too little.",
      becauseQuestion4: "Many students sleep late ___ they spend too much time online.",
      gaps: [
        "Many teenagers feel tired ___ they stay up too late.",
        "___ sleep is essential for health, some students ignore it.",
        "Students can improve concentration ___ they sleep enough every night.",
        "Teenagers often feel more energetic ___ they follow healthy sleep habits.",
        "___ many students are busy, they should still sleep early."
      ],
      unscramble: [
        { answer: "Many teenagers feel tired during class because they stay up late." },
        { answer: "Although sleeping early is difficult, it improves health." },
        { answer: "If students get enough sleep, they may concentrate better." }
      ],
      sentenceWriting: [
        { question: "Write one complex sentence with because.", keyword: "because", sampleAnswer: "Many students feel tired because they do not sleep enough.", explanation: "Use 'because' to explain a reason." },
        { question: "Write one complex sentence with although.", keyword: "although", sampleAnswer: "Although students are busy, they still need enough sleep.", explanation: "Use 'although' to show contrast." }
      ]
    }
  },
  {
    title: "Online Health Information",
    seedAliases: ["Online Health Information (Can social media spread dangerous health advice?)"],
    slug: "online-health-information",
    order: 4,
    mapTheme: "online-health",
    description: "Practice grammar for evaluating online health advice, misinformation, influencers, and reliable sources.",
    writingQuestion: "Can social media spread dangerous health advice? Write a paragraph of about 100 words.",
    writingHints: [
      "Explain why some users trust health information on social media.",
      "Mention misinformation, influencers, reliable sources, or digital literacy.",
      "Give advice using should, can, if, who, because, or although."
    ],
    grammarReminders: [
      "Use present simple for general facts about social media.",
      "Use should to give advice about checking sources.",
      "Use relative and complex sentences to explain risks and solutions."
    ],
    sentencePatterns: [
      "Social media often spreads health information very quickly.",
      "People should verify online health information before following medical advice.",
      "Users who follow professional medical experts often avoid dangerous health advice."
    ],
    finalWritingModelParagraphs: [
      {
        label: "Stronger model",
        text:
          "Social media can spread dangerous health advice because online content travels quickly. Many teenagers trust influencers who do not have medical knowledge. As a result, some users follow unsafe diet trends without checking evidence. People should verify health information with reliable medical websites. If schools teach digital literacy, students may avoid misinformation more easily."
      },
      {
        label: "Needs revision",
        text:
          "Social media give health advice and many teenagers believes it. This situation create problems because influencers are not always doctors. People should checking reliable websites before they follow online trends."
      }
    ],
    helpfulIdeas: ["fake medical advice", "dangerous diet trends", "digital literacy", "fact-checking", "reliable sources"],
    usefulStructures: [
      "Many users who follow influencers ...",
      "Although social media provides useful information, ...",
      "If people verify online sources carefully, ...",
      "Users can avoid misinformation by ..."
    ],
    selfCheckQuestions: [
      "Did I clearly express my opinion?",
      "Did I explain at least two risks or solutions?",
      "Did I use grammar from all five tasks?"
    ],
    presentSimple: {
      mcq: [
        mcq("Social media often ___ health information very quickly.", optionSet("spreads", "spread", "spreading", "spreaded"), "spreads", "Use 'spreads' because 'Social media' is treated as singular."),
        mcq("Many teenagers ___ medical advice from online influencers.", optionSet("follow", "follows", "following", "followed"), "follow", "Use 'follow' because 'teenagers' is plural."),
        mcq("False health information ___ serious risks to young users.", optionSet("creates", "create", "creating", "created"), "creates", "Use 'creates' because 'False health information' is singular."),
        mcq("Some people ___ online health advice more than professional opinions.", optionSet("trust", "trusts", "trusting", "trusted"), "trust", "Use 'trust' because 'people' is plural."),
        mcq("Misinformation about diets often ___ confusion.", optionSet("causes", "cause", "causing", "caused"), "causes", "Use 'causes' because 'Misinformation' is singular."),
        mcq("Many social media platforms ___ users to share information freely.", optionSet("allow", "allows", "allowing", "allowed"), "allow", "Use 'allow' because 'platforms' is plural."),
        mcq("Incorrect medical advice sometimes ___ health conditions worse.", optionSet("makes", "make", "making", "made"), "makes", "Use 'makes' because 'advice' is singular."),
        mcq("Some users ___ every piece of health information they see online.", optionSet("do not question", "does not question", "not question", "not questioning"), "do not question", "Use 'do not question' because 'users' is plural."),
        mcq("Not every influencer ___ accurate medical knowledge.", optionSet("has", "have", "having", "had"), "has", "Use 'has' because 'Not every influencer' is singular in meaning."),
        mcq("Dangerous online advice ___ vulnerable users negatively.", optionSet("affects", "affect", "affecting", "affected"), "affects", "Use 'affects' because 'advice' is singular.")
      ],
      gapFill: [
        gap("Online misinformation ___ many teenagers' health decisions.", "influences", "Use 'influences' because 'misinformation' is singular."),
        gap("Many young people ___ health tips from social media influencers.", "believe", "Use 'believe' because 'young people' is plural."),
        gap("False medical claims often ___ rapidly online.", "spread", "Use 'spread' because 'claims' is plural."),
        gap("Social media platforms that lack rules ___ misinformation to grow.", "allow", "Use 'allow' because 'platforms' is plural."),
        gap("Each misleading health video ___ confusion among viewers.", "causes", "Use 'causes' because 'Each' takes a singular verb.")
      ],
      unscramble: [
        { answer: "Many teenagers trust online health advice without checking reliable sources.", explanation: "Start with the plural subject and base verb." },
        { answer: "False medical information spreads rapidly through social media platforms.", explanation: "Use 'spreads' because 'information' is singular and uncountable." },
        { answer: "Many users do not verify information before sharing health advice online.", explanation: "Use 'do not + base verb' with plural subjects." }
      ],
      sentenceWriting: [
        { question: "Write one present simple sentence about online health information.", keyword: "online", sampleAnswer: "Social media often spreads health information quickly.", explanation: "Use present simple for a general fact." },
        { question: "Write one present simple sentence about misinformation.", keyword: "misinformation", sampleAnswer: "Misinformation creates confusion among young users.", explanation: "Use present simple for a general truth." }
      ]
    },
    modal: {
      shouldQuestion: "People ___ verify online health information before following advice.",
      canQuestion: "Teenagers ___ improve digital literacy by checking reliable sources.",
      negativeAdviceQuestion: "Social media users ___ trust every health trend they see online.",
      mightQuestion: "False medical advice ___ seriously harm people's health.",
      responsibilityQuestion: "Health experts ___ educate young people about misinformation.",
      possibleRiskQuestion: "Users who follow dangerous diet trends ___ develop health problems.",
      mustQuestion: "Social media companies ___ take responsibility for false health information.",
      mustAnswer: "should",
      canBenefitQuestion: "People ___ avoid dangerous trends by checking medical websites.",
      shouldBaseQuestion: "Users ___ question unreliable medical advice.",
      canBaseQuestion: "Doctors ___ help people identify trustworthy health information.",
      gaps: [
        "People ___ verify medical information before sharing it online.",
        "Teenagers ___ improve digital literacy by checking professional sources.",
        "Social media companies ___ create stricter rules against misinformation.",
        "Users who follow dangerous online advice ___ experience negative health effects.",
        "Doctors ___ help people identify trustworthy health information online."
      ],
      unscramble: [
        { answer: "People should verify health information before sharing it online." },
        { answer: "Social media companies can reduce misinformation through stricter regulations." },
        { answer: "Teenagers might follow dangerous diet trends because of influencer culture." }
      ],
      sentenceWriting: [
        { question: "Write one advice sentence with should.", keyword: "should", sampleAnswer: "People should verify health information before sharing it online.", explanation: "Use 'should + base verb' for advice." },
        { question: "Write one possibility sentence with might.", keyword: "might", sampleAnswer: "False medical advice might harm young users.", explanation: "Use 'might + base verb' for possibility." }
      ]
    },
    conditional: {
      mcq: [
        { question: "If people believe false medical advice online, they ___ unhealthy.", correctAnswer: "will become" },
        { question: "Users may avoid dangerous trends if they ___ unreliable influencers.", correctAnswer: "do not trust" },
        { question: "If platforms remove false medical content, users ___ safer information.", correctAnswer: "will receive" },
        { question: "People will make safer health decisions if they ___ reliable sources.", correctAnswer: "check" },
        { question: "If teenagers rely on online health trends, confusion ___.", correctAnswer: "will increase", options: optionSet("will increase", "increase", "increased", "increasing") },
        { question: "If companies fail to control misinformation, they ___ public trust.", correctAnswer: "will reduce" },
        { question: "People may protect themselves if they ___ critical thinking skills.", correctAnswer: "develop", options: optionSet("develop", "develops", "developed", "developing") },
        { question: "If schools teach digital literacy, they ___ students safer.", correctAnswer: "will make" },
        { question: "Users ___ misinformation if they verify online sources.", correctAnswer: "may avoid" },
        { question: "If platforms lack strict regulations, false claims ___ quickly.", correctAnswer: "spread", options: optionSet("spread", "spreads", "spreaded", "spreading") }
      ],
      gaps: [
        "If people ___ false medical advice, they will face health risks.",
        "Users will make safer decisions if they ___ reliable medical websites.",
        "If teenagers ___ every influencer, they may accept misinformation.",
        "People may avoid dangerous trends if they ___ professional sources.",
        "If schools teach digital literacy, students ___ misinformation better."
      ],
      gapAnswers: ["believe", "check", "trust", "consult", "identify"],
      unscramble: [
        { answer: "If people verify online sources, they may avoid misinformation." },
        { answer: "Users will make safer decisions if they check reliable websites." },
        { answer: "If teenagers follow dangerous trends, they may harm their health." }
      ],
      sentenceWriting: [
        { question: "Write one if sentence about online misinformation.", keyword: "if", sampleAnswer: "If users verify medical sources carefully, they may avoid misinformation.", explanation: "Use if plus present simple, then a result clause." },
        { question: "Write one conditional sentence about digital literacy.", keyword: "will", sampleAnswer: "Students will identify misinformation better if schools teach digital literacy.", explanation: "Use 'will + base verb' for a likely result." }
      ]
    },
    relative: {
      whoQuestion: "People ___ trust unreliable influencers may follow dangerous trends.",
      whichQuestion: "Medical websites ___ provide accurate information help users.",
      whereQuestion: "Social media platforms are places ___ false health information spreads quickly.",
      whoQuestion2: "Users ___ verify health information often make safer choices.",
      whyQuestion: "One reason ___ fake medical advice becomes popular is influencer culture.",
      whoseQuestion: "Teenagers ___ online habits depend on influencers may trust misinformation.",
      whichQuestion2: "Platforms ___ lack regulations allow misinformation to grow.",
      whoQuestion3: "Influencers ___ share medical advice should check facts carefully.",
      whereQuestion2: "Online spaces are places ___ users need critical thinking.",
      whichQuestion3: "False medical advice is a problem ___ affects many teenagers.",
      gaps: [
        "People ___ trust unreliable influencers may follow dangerous health trends.",
        "Medical websites ___ provide accurate information help users avoid misinformation.",
        "Social media platforms are places ___ false information spreads quickly.",
        "Teenagers ___ parents discuss digital literacy may check sources better.",
        "One reason ___ fake medical advice becomes popular is influencer culture."
      ],
      unscramble: [
        { answer: "People who verify health information carefully usually make safer decisions." },
        { answer: "Medical websites which provide reliable information help users avoid misinformation." },
        { answer: "Platforms where misinformation spreads rapidly should improve content moderation." }
      ],
      sentenceWriting: [
        { question: "Write one relative clause sentence with who.", keyword: "who", sampleAnswer: "Users who follow professional medical experts often avoid dangerous advice.", explanation: "Use 'who' to describe people." },
        { question: "Write one relative clause sentence with which.", keyword: "which", sampleAnswer: "Websites which provide scientific evidence are more trustworthy.", explanation: "Use 'which' to describe things." }
      ]
    },
    complex: {
      becauseQuestion: "Many teenagers believe misleading health advice ___ they trust influencers.",
      althoughQuestion: "___ many influencers share health tips, not all have medical knowledge.",
      ifQuestion: "People may avoid dangerous medical trends ___ they verify information.",
      becauseQuestion2: "Many users follow unreliable advice ___ they do not recognize misinformation.",
      althoughQuestion2: "___ platforms try to control misinformation, false claims still spread.",
      ifQuestion2: "People can make safer health decisions ___ they consult professional sources.",
      becauseQuestion3: "Influencers spread questionable advice ___ they want attention.",
      althoughQuestion3: "___ reducing misinformation is difficult, platforms should take action.",
      ifQuestion3: "Users may develop unhealthy habits ___ they follow dangerous trends.",
      becauseQuestion4: "Many people become confused ___ they receive conflicting medical advice.",
      gaps: [
        "Many teenagers trust misleading health advice ___ they spend too much time on social media.",
        "___ many websites provide accurate information, users still believe fake medical claims.",
        "People can avoid dangerous misinformation ___ they verify online sources carefully.",
        "Users often become anxious ___ they read conflicting health advice online.",
        "___ social media provides useful information, users should still verify sources."
      ],
      unscramble: [
        { answer: "Many people follow misleading health advice online because they trust influencers." },
        { answer: "Although professional doctors provide accurate advice, some users trust online influencers more." },
        { answer: "If people improve digital literacy, they may identify misinformation more easily." }
      ],
      sentenceWriting: [
        { question: "Write one complex sentence with although.", keyword: "although", sampleAnswer: "Although social media provides useful information, users should still verify online sources.", explanation: "Use 'although' to show contrast." },
        { question: "Write one complex sentence with if.", keyword: "if", sampleAnswer: "People can avoid dangerous advice if they consult professional medical experts.", explanation: "Use 'if' to show a condition." }
      ]
    }
  }
];

const defaultModelParagraphs = (missionTitle) => [
  {
    label: "Model Paragraph A",
    text: `${missionTitle} is an important health topic for students. A strong paragraph gives a clear opinion, explains useful reasons, and uses accurate grammar to connect ideas. It should include examples and end with practical advice.`
  },
  {
    label: "Model Paragraph B",
    text: `${missionTitle} is important for students. It is good and bad. Some people like it. Students should be careful. This paragraph has simple ideas, but it needs clearer reasons and stronger grammar.`
  }
];

const normalizeModelParagraphs = (mission) => {
  const models = Array.isArray(mission.finalWritingModelParagraphs)
    ? mission.finalWritingModelParagraphs
    : [];
  const fallbacks = defaultModelParagraphs(mission.title);
  const normalized = [0, 1].map((index) => {
    const source = models[index] || {};
    const text = String(source.text || source.content || source.paragraph || "").trim();

    return {
      label: index === 0 ? "Model Paragraph A" : "Model Paragraph B",
      text: text || fallbacks[index].text
    };
  });

  return normalized;
};

const healthMiniTopics = healthMissionSources.map((mission) => ({
  title: mission.title,
  seedAliases: mission.seedAliases || [],
  slug: mission.slug,
  description: mission.description,
  grammarFocus: grammarTasks.map((task) => task.grammarTitle),
  order: mission.order,
  mapTheme: mission.mapTheme,
  writingQuestion: mission.writingQuestion,
  writingHints: mission.writingHints,
  grammarReminders: mission.grammarReminders,
  sentencePatterns: mission.sentencePatterns,
  finalWritingModelParagraphs: normalizeModelParagraphs(mission),
  helpfulIdeas: mission.helpfulIdeas,
  usefulStructures: mission.usefulStructures,
  selfCheckQuestions: mission.selfCheckQuestions,
  activities: buildActivities(mission)
}));

module.exports = { healthMiniTopics };
