const fs = require('fs');
const { sequelize } = require('./server/config/db');
const { Topic, MiniTopic, Activity } = require('./server/models');

const filePath = 'C:/Users/flour/Documents/writewise-antigravity-ready/writewise-antigravity-ready/Questions for the Write Wise (3).txt';

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

const answerToSentence = (question = "", answer = "") => {
  const text = String(question);
  const value = String(answer);

  if (!text || !value) return value;

  if (/_{2,}/.test(text)) {
    return text.replace(/_{2,}/, value).replace(/\s*\([^)]*\)/, "");
  }

  return value;
};

const words = (sentence) =>
  sentence
    .replace(/[.,?]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.toLowerCase());

function parseTableLines(rawLines, startMarker, endMarker) {
  let startIdx = -1;
  let endIdx = -1;
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (line === startMarker) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) return [];

  for (let i = startIdx + 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (line === endMarker || line.startsWith(endMarker)) {
      endIdx = i;
      break;
    }
  }

  if (endIdx === -1) endIdx = rawLines.length;

  const contentLines = [];
  for (let i = startIdx + 1; i < endIdx; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('____')) continue;
    if (
      trimmed.toLowerCase() === 'structure' ||
      trimmed.toLowerCase() === 'usage' ||
      trimmed.toLowerCase() === 'example' ||
      trimmed.toLowerCase() === 'relative pronoun'
    ) {
      continue;
    }
    contentLines.push(trimmed);
  }

  const rows = [];
  for (let i = 0; i < contentLines.length; i += 3) {
    const form = contentLines[i] || '';
    const use = contentLines[i + 1] || '';
    const example = contentLines[i + 2] || '';
    if (form || use || example) {
      rows.push({ form, use, example });
    }
  }
  return rows;
}

const run = async () => {
  // 1. Fetch Health Topic
  const healthTopic = await Topic.findOne({ where: { title: 'Health' } });
  if (!healthTopic) {
    throw new Error('Health topic not found in database');
  }
  console.log(`Found Topic "Health" with ID ${healthTopic.id}`);

  // 2. Fetch the first 4 MiniTopics under Health, ordered by order
  const miniTopics = await MiniTopic.findAll({
    where: { topicId: healthTopic.id },
    order: [['order', 'ASC']]
  });

  if (miniTopics.length < 4) {
    throw new Error(`Expected at least 4 MiniTopics under Health topic, but found ${miniTopics.length}`);
  }

  console.log(`Found ${miniTopics.length} MiniTopics under Health.`);

  // 3. Rename first 4 MiniTopics and update slugs to match the text file
  const missionTitles = [
    "Fast food",
    "Exercise and Fitness",
    "Sleep Habits",
    "Junk Food at School"
  ];
  const missionSlugs = [
    "fast-food",
    "exercise-and-fitness",
    "sleep-habits",
    "junk-food-at-school"
  ];

  const topicMap = {}; // Maps missionOrder 1-4 to DB MiniTopic ID
  for (let idx = 0; idx < 4; idx++) {
    const miniTopic = miniTopics[idx];
    const newTitle = missionTitles[idx];
    const newSlug = missionSlugs[idx];
    
    if (miniTopic.title !== newTitle || miniTopic.slug !== newSlug) {
      await miniTopic.update({ title: newTitle, slug: newSlug });
      console.log(`Updated MiniTopic order ${miniTopic.order} to Title: "${newTitle}", Slug: "${newSlug}"`);
    } else {
      console.log(`MiniTopic order ${miniTopic.order} already has Title: "${newTitle}", Slug: "${newSlug}"`);
    }
    topicMap[idx + 1] = miniTopic.id;
  }

  // 4. Parse text file
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  let currentMission = null;
  let currentMissionOrder = 0;
  let currentTaskSlug = null;
  let currentQuestion = null;

  const parsedQuestions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('Mission ')) {
      const match = line.match(/Mission (\d+): (.+)/);
      if (match) {
        currentMissionOrder = parseInt(match[1]);
        currentMission = match[2].trim();
      }
      continue;
    }

    if (line.startsWith('Task ')) {
      const match = line.match(/Task (\d+): (.+)/);
      if (match) {
        const taskName = match[2];
        if (taskName.includes('Present Simple')) currentTaskSlug = 'present-simple';
        else if (taskName.includes('Modal Verbs')) currentTaskSlug = 'modal-verbs';
        else if (taskName.includes('Conditional Sentences')) currentTaskSlug = 'conditional-sentences';
        else if (taskName.includes('Relative Clauses')) currentTaskSlug = 'relative-clauses';
        else if (taskName.includes('Complex Sentences')) currentTaskSlug = 'complex-sentences';
        else currentTaskSlug = null;
      }
      continue;
    }

    if (line.startsWith('Question ')) {
      if (currentQuestion) {
        parsedQuestions.push(currentQuestion);
      }
      const qNum = parseInt(line.replace('Question ', ''));
      currentQuestion = {
        missionOrder: currentMissionOrder,
        missionTitle: currentMission,
        taskSlug: currentTaskSlug,
        order: qNum,
        rawLines: []
      };
      continue;
    }

    if (currentQuestion) {
      currentQuestion.rawLines.push(lines[i]);
    }
  }
  if (currentQuestion) {
    parsedQuestions.push(currentQuestion);
  }

  const filtered = parsedQuestions.filter(q => q.missionOrder <= 4 && q.taskSlug !== null);
  console.log(`Filtered ${filtered.length} questions from text file for Tasks 1-5 across Missions 1-4.`);

  const parsedActivities = [];

  for (const q of filtered) {
    const raw = q.rawLines;
    
    let answerIdx = -1;
    let expIdx = -1;
    for (let i = 0; i < raw.length; i++) {
      const trimmed = raw[i].trim();
      if (trimmed.startsWith('Answer:')) answerIdx = i;
      if (trimmed.startsWith('Explanation:')) expIdx = i;
    }

    if (answerIdx === -1) {
      console.warn(`Warning: Missing Answer for Mission ${q.missionOrder} Task ${q.taskSlug} Question ${q.order}`);
      continue;
    }

    let rawAnswerLine = raw[answerIdx].replace('Answer:', '').trim();
    if (!rawAnswerLine) {
      const endSearch = expIdx !== -1 ? expIdx : raw.length;
      const nextLines = [];
      for (let k = answerIdx + 1; k < endSearch; k++) {
        if (raw[k].trim() && !raw[k].trim().startsWith('_____')) {
          nextLines.push(raw[k].trim());
        }
      }
      rawAnswerLine = nextLines.join('\n').trim();
    }

    let explanationText = '';
    if (expIdx !== -1) {
      const expLines = [];
      for (let k = expIdx + 1; k < raw.length; k++) {
        if (raw[k].trim() && !raw[k].trim().startsWith('_____')) {
          expLines.push(raw[k].trim());
        }
      }
      explanationText = expLines.join('\n').trim();
    }

    let questionType = '';
    let questionText = '';
    let correctAnswer = '';
    let fullCorrectAnswer = '';
    let baseWord = '';
    let scrambledWords = [];
    let keywords = [];
    let grammarTableChallenge = {};
    let options = [];

    if (q.order <= 10) {
      questionType = 'MCQ';
      const nonBaseLines = [];
      for (let k = 0; k < answerIdx; k++) {
        const trimmed = raw[k].trim();
        if (trimmed && !trimmed.startsWith('_____')) {
          nonBaseLines.push(trimmed);
        }
      }
      questionText = nonBaseLines[0] || '';
      
      const optList = [];
      for (let k = 1; k < nonBaseLines.length; k++) {
        const opt = nonBaseLines[k];
        if (/^[A-D]\./i.test(opt)) {
          optList.push(opt.replace(/^[A-D]\.\s*/i, '').trim());
        }
      }
      options = optList;
      correctAnswer = rawAnswerLine.replace(/^[A-D]\.\s*/i, '').trim();
      fullCorrectAnswer = answerToSentence(questionText, correctAnswer);
    } else if (q.order >= 11 && q.order <= 15) {
      questionType = 'GAP_FILL';
      const nonBaseLines = [];
      for (let k = 0; k < answerIdx; k++) {
        const trimmed = raw[k].trim();
        if (trimmed && !trimmed.startsWith('_____')) {
          nonBaseLines.push(trimmed);
        }
      }
      questionText = nonBaseLines[0] || '';
      correctAnswer = rawAnswerLine.trim();
      fullCorrectAnswer = answerToSentence(questionText, correctAnswer);

      const baseWordMatch = questionText.match(/\(([^)]+)\)/);
      baseWord = baseWordMatch ? baseWordMatch[1].trim() : '';
    } else if (q.order >= 16 && q.order <= 18) {
      questionType = 'UNSCRAMBLE';
      questionText = "Type the correct sentence.";
      correctAnswer = rawAnswerLine.trim();
      fullCorrectAnswer = correctAnswer;
      scrambledWords = words(correctAnswer);
    } else if (q.order >= 19 && q.order <= 20) {
      questionType = 'SENTENCE_WRITING';
      const nonBaseLines = [];
      for (let k = 0; k < answerIdx; k++) {
        const trimmed = raw[k].trim();
        if (trimmed && !trimmed.startsWith('_____')) {
          nonBaseLines.push(trimmed);
        }
      }
      const instruction = nonBaseLines[0] || "Write one complete sentence using all keywords.";
      const rawKeywordsLine = nonBaseLines[1] || "";
      keywords = rawKeywordsLine.split('/').map(s => s.trim()).filter(Boolean);
      questionText = `${instruction}\n${rawKeywordsLine}`;

      correctAnswer = rawAnswerLine.trim();
      fullCorrectAnswer = correctAnswer;
    } else if (q.order === 21) {
      questionType = 'GRAMMAR_TABLE';
      questionText = "Choose the grammar table with the most accurate rule.";
      
      const isTableACorrect = rawAnswerLine.includes('Table A') || rawAnswerLine.startsWith('A');
      correctAnswer = isTableACorrect ? 'A' : 'B';
      fullCorrectAnswer = isTableACorrect ? 'Table A' : 'Table B';

      const tableARows = parseTableLines(raw, 'Table A', 'Table B');
      const tableBRows = parseTableLines(raw, 'Table B', 'Which table');

      const formA = tableARows.map(r => r.form).join('\n');
      const useA = tableARows.map(r => r.use).join('\n');
      const exampleA = tableARows.map(r => r.example).join('\n');

      const formB = tableBRows.map(r => r.form).join('\n');
      const useB = tableBRows.map(r => r.use).join('\n');
      const exampleB = tableBRows.map(r => r.example).join('\n');

      grammarTableChallenge = {
        correctTable: correctAnswer,
        explanation: explanationText,
        tables: [
          {
            key: "A",
            label: "Table A",
            form: formA,
            use: useA,
            example: exampleA
          },
          {
            key: "B",
            label: "Table B",
            form: formB,
            use: useB,
            example: exampleB
          }
        ]
      };
    }

    // Special Case: Mission 1 Task 3 Questions 11-15 custom replacement
    if (q.missionOrder === 1 && q.taskSlug === 'conditional-sentences' && q.order >= 11 && q.order <= 15) {
      questionType = 'GAP_FILL';
      
      let customQuestion = "";
      let customAnswer = "";
      let customExplanation = "";

      if (q.order === 11) {
        customQuestion = "If fast food ______ (become) cheaper than healthy meals, more teenagers will choose it regularly.";
        customAnswer = "becomes";
        customExplanation = "“Fast food” is singular and uncountable, so we use “becomes.”";
      } else if (q.order === 12) {
        customQuestion = "Children may develop unhealthy eating habits if junk food advertisements ______ (appear) too frequently online.";
        customAnswer = "appear";
        customExplanation = "“Advertisements” is plural, so we use the base verb “appear.”";
      } else if (q.order === 13) {
        customQuestion = "If healthy meals ______ (not serve) in school cafeterias regularly, students may rely more on fast food.";
        customAnswer = "are not served";
        customExplanation = "This sentence requires the passive voice: are not + past participle. “Meals” is plural, so we use “are not served.”";
      } else if (q.order === 14) {
        customQuestion = "Teenagers will face serious health problems if a fast-food company constantly ______ (promote) unhealthy eating trends through social media.";
        customAnswer = "promotes";
        customExplanation = "“A fast-food company” is singular, so we use “promotes.”";
      } else if (q.order === 15) {
        customQuestion = "If parents ______ (not encourage) balanced diets at home, children may consume excessive amounts of junk food.";
        customAnswer = "do not encourage";
        customExplanation = "Negative present simple with a plural subject: do not + base verb";
      }

      const taskInfo = grammarTasks.find(t => t.slug === q.taskSlug);
      const dbMiniTopicId = topicMap[q.missionOrder];
      const baseWordMatch = customQuestion.match(/\(([^)]+)\)/);
      const baseWord = baseWordMatch ? baseWordMatch[1].trim() : '';

      parsedActivities.push({
        miniTopicId: dbMiniTopicId,
        taskSlug: q.taskSlug,
        taskNumber: taskInfo ? taskInfo.taskNumber : 3,
        grammarTitle: taskInfo ? taskInfo.grammarTitle : '',
        type: 'GAP_FILL',
        questionType: 'GAP_FILL',
        question: customQuestion,
        options: [],
        correctAnswer: customAnswer,
        fullCorrectAnswer: answerToSentence(customQuestion, customAnswer),
        correctSentence: '',
        suggestedAnswer: '',
        highlightAnswerPart: customAnswer,
        baseWord: baseWord,
        targetStructure: customAnswer,
        acceptedAnswers: [customAnswer],
        givenWords: [],
        wordBank: [],
        keywords: [],
        scrambledWords: [],
        keyword: '',
        grammarPoint: taskInfo ? taskInfo.grammarTitle : '',
        explanation: customExplanation,
        wrongAnswerExplanation: `Review conditional sentences. The answer must match the grammar form and meaning of the sentence.`,
        correctAnswerExplanation: customExplanation,
        sampleAnswer: '',
        grammarSummary: taskInfo ? taskInfo.summary : {},
        grammarTableChallenge: {},
        matchingData: {},
        order: q.order
      });

      continue;
    }

    // Special Case: Mission 2 Task 3 Questions 11-15 custom replacement
    if (q.missionOrder === 2 && q.taskSlug === 'conditional-sentences' && q.order >= 11 && q.order <= 15) {
      questionType = 'GAP_FILL';
      
      let customQuestion = "";
      let customAnswer = "";
      let customExplanation = "";

      if (q.order === 11) {
        customQuestion = "If regular physical activity ______ (improve) students’ concentration levels, schools may encourage more fitness programs.";
        customAnswer = "improves";
        customExplanation = "“Regular physical activity” is singular, so we use “improves.”";
      } else if (q.order === 12) {
        customQuestion = "Teenagers may gain weight if they ______ (not exercise) regularly after school.";
        customAnswer = "do not exercise";
        customExplanation = "Negative present simple: do not + base verb. “Teenagers” is plural, so we use “do not exercise.”";
      } else if (q.order === 13) {
        customQuestion = "If outdoor activities ______ (replace) by excessive screen time, children may become less physically active.";
        customAnswer = "are replaced";
        customExplanation = "This sentence requires the passive voice: are + past participle. “Activities” is plural, so we use “are replaced.”";
      } else if (q.order === 14) {
        customQuestion = "Students will feel healthier if their daily routines ______ (include) regular exercise and balanced diets.";
        customAnswer = "include";
        customExplanation = "“Routines” is plural, so we use the base verb “include.”";
      } else if (q.order === 15) {
        customQuestion = "If a student rarely ______ (participation) in physical activities, they may struggle with stress and low energy levels.";
        customAnswer = "participates";
        customExplanation = "The sentence needs a verb form from “participation.” The correct verb is “participate,” and because “a student” is singular, we use “participates.”";
      }

      const taskInfo = grammarTasks.find(t => t.slug === q.taskSlug);
      const dbMiniTopicId = topicMap[q.missionOrder];
      const baseWordMatch = customQuestion.match(/\(([^)]+)\)/);
      const baseWord = baseWordMatch ? baseWordMatch[1].trim() : '';

      parsedActivities.push({
        miniTopicId: dbMiniTopicId,
        taskSlug: q.taskSlug,
        taskNumber: taskInfo ? taskInfo.taskNumber : 3,
        grammarTitle: taskInfo ? taskInfo.grammarTitle : '',
        type: 'GAP_FILL',
        questionType: 'GAP_FILL',
        question: customQuestion,
        options: [],
        correctAnswer: customAnswer,
        fullCorrectAnswer: answerToSentence(customQuestion, customAnswer),
        correctSentence: '',
        suggestedAnswer: '',
        highlightAnswerPart: customAnswer,
        baseWord: baseWord,
        targetStructure: customAnswer,
        acceptedAnswers: [customAnswer],
        givenWords: [],
        wordBank: [],
        keywords: [],
        scrambledWords: [],
        keyword: '',
        grammarPoint: taskInfo ? taskInfo.grammarTitle : '',
        explanation: customExplanation,
        wrongAnswerExplanation: `Review conditional sentences. The answer must match the grammar form and meaning of the sentence.`,
        correctAnswerExplanation: customExplanation,
        sampleAnswer: '',
        grammarSummary: taskInfo ? taskInfo.summary : {},
        grammarTableChallenge: {},
        matchingData: {},
        order: q.order
      });

      continue;
    }

    // Special Case: Mission 1 Task 2 Questions 11-15 should be merged into a single MATCHING question at order 11
    if (q.missionOrder === 1 && q.taskSlug === 'modal-verbs' && q.order >= 11 && q.order <= 15) {
      if (q.order > 11) {
        // Skip orders 12-15 since they are grouped into order 11
        continue;
      }

      // We are at Question 11. We build the single MATCHING activity.
      questionType = 'MATCHING';
      questionText = "Match the modal verbs with the correct sentences.";
      correctAnswer = "MATCHING";
      
      const pairs = [
        {
          question: "Fast-food companies ______ provide clear nutrition information because customers have the right to understand what they are eating.",
          answer: "ought to"
        },
        {
          question: "Teenagers ______ develop obesity if they consume fast food several times a week.",
          answer: "might"
        },
        {
          question: "Parents ______ allow young children to eat fast food too frequently because it may harm their long-term health.",
          answer: "should not"
        },
        {
          question: "Students ______ make healthier food choices when schools provide nutritious cafeteria meals.",
          answer: "can"
        },
        {
          question: "Fast food ______ become less popular in the future if more people learn about healthy eating habits.",
          answer: "may"
        }
      ];

      const explanation = `Question 11: “Ought to” is the best answer because the sentence talks about a moral responsibility or ethical duty. The phrase “customers have the right” creates a stronger sense of obligation, which fits “ought to” better than “should.”\n\nQuestion 12: “Might” expresses a possible negative consequence. The sentence discusses a health risk, not certainty. We do not use “can” (general ability) or “may” (formal prediction).\n\nQuestion 13: “Should not” is used to give negative advice or warning. The sentence clearly recommends avoiding a harmful action, so “should not” is the most logical choice.\n\nQuestion 14: “Can” expresses ability or possibility created by a situation. The sentence means students are able to make healthier choices because healthy meals are available.\n\nQuestion 15: “May” expresses a future possibility in a more neutral and formal way. It predicts a possible future trend in a formal argumentative style.`;

      const taskInfo = grammarTasks.find(t => t.slug === q.taskSlug);
      const dbMiniTopicId = topicMap[q.missionOrder];

      parsedActivities.push({
        miniTopicId: dbMiniTopicId,
        taskSlug: q.taskSlug,
        taskNumber: taskInfo ? taskInfo.taskNumber : 2,
        grammarTitle: taskInfo ? taskInfo.grammarTitle : '',
        type: 'MATCHING',
        questionType: 'MATCHING',
        question: questionText,
        options: [],
        correctAnswer: "MATCHING",
        fullCorrectAnswer: "MATCHING",
        correctSentence: '',
        suggestedAnswer: '',
        highlightAnswerPart: '',
        baseWord: '',
        targetStructure: '',
        acceptedAnswers: ["MATCHING"],
        givenWords: [],
        wordBank: [],
        keywords: [],
        scrambledWords: [],
        keyword: '',
        grammarPoint: taskInfo ? taskInfo.grammarTitle : '',
        explanation: explanation,
        wrongAnswerExplanation: `Review modal verbs. Connect all modal verbs to their correct contextual sentences.`,
        correctAnswerExplanation: explanation,
        sampleAnswer: '',
        grammarSummary: taskInfo ? taskInfo.summary : {},
        grammarTableChallenge: {},
        matchingData: {
          question: "Match the modal verbs with the correct sentences.",
          pairs: pairs
        },
        order: 11
      });

      continue;
    }

    const taskInfo = grammarTasks.find(t => t.slug === q.taskSlug);
    const taskNumber = taskInfo ? taskInfo.taskNumber : 1;
    const grammarTitle = taskInfo ? taskInfo.grammarTitle : '';
    const grammarSummary = taskInfo ? taskInfo.summary : {};

    const dbMiniTopicId = topicMap[q.missionOrder];

    parsedActivities.push({
      miniTopicId: dbMiniTopicId,
      taskSlug: q.taskSlug,
      taskNumber,
      grammarTitle,
      type: questionType,
      questionType,
      question: questionText,
      options,
      correctAnswer,
      fullCorrectAnswer,
      correctSentence: (questionType === 'UNSCRAMBLE' || questionType === 'SENTENCE_WRITING') ? correctAnswer : '',
      suggestedAnswer: (questionType === 'SENTENCE_WRITING') ? correctAnswer : '',
      highlightAnswerPart: (questionType === 'MCQ' || questionType === 'GAP_FILL') ? correctAnswer : '',
      baseWord,
      targetStructure: (questionType === 'GAP_FILL') ? correctAnswer : (questionType === 'SENTENCE_WRITING' ? grammarTitle : ''),
      acceptedAnswers: questionType === 'GRAMMAR_TABLE' ? [correctAnswer, fullCorrectAnswer] : [correctAnswer],
      givenWords: keywords,
      wordBank: keywords,
      keywords,
      scrambledWords,
      keyword: keywords[0] || '',
      grammarPoint: grammarTitle,
      explanation: explanationText,
      wrongAnswerExplanation: `Review ${grammarTitle}. The answer must match the grammar form and meaning of the sentence.`,
      correctAnswerExplanation: explanationText || `The correct answer follows this form: ${grammarSummary.form || ''}`,
      sampleAnswer: (questionType === 'SENTENCE_WRITING') ? correctAnswer : '',
      grammarSummary,
      grammarTableChallenge,
      matchingData: {},
      order: q.order
    });
  }

  console.log(`Parsed all ${parsedActivities.length} activities for the DB.`);

  // 5. Delete existing activities for Tasks 1-5 across Missions 1-4
  const targetTaskSlugs = ['present-simple', 'modal-verbs', 'conditional-sentences', 'relative-clauses', 'complex-sentences'];
  const deletedCount = await Activity.destroy({
    where: {
      miniTopicId: Object.values(topicMap),
      taskSlug: targetTaskSlugs
    }
  });
  console.log(`Deleted ${deletedCount} existing activities.`);

  // 6. Bulk create the new activities
  const createdActivities = await Activity.bulkCreate(parsedActivities);
  console.log(`Successfully bulk created ${createdActivities.length} activities in SQLite database!`);
};

run().then(() => {
  console.log('Seeding completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
