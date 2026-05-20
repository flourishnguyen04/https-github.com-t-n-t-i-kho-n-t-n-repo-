# WriteWise

WriteWise is a full-stack English Language Teaching web application for grammar-focused writing practice.

Slogan: "Write it right, unlock your insight."

Learners complete topic-based grammar missions in a progressive unlock flow. Each mission contains five grammar tasks, and each grammar task contains MCQ, gap-fill, unscramble, and sentence-writing practice. After passing the five grammar tasks, learners write a paragraph of about 100 words and receive AI-powered writing feedback with a score, level, highlighted issues, targeted feedback cards, and an AI writing chat.

## Features

- Register and log in with JWT authentication.
- Passwords are hashed with bcrypt.
- Protected dashboard, topics, activities, writing, feedback, and profile routes.
- Progressive topic unlock path: Health, Sport, Education, Environment, Technology.
- Progressive mission unlock flow: five grammar tasks, then Final Writing.
- Automatic scoring for MCQ, gap-fill, unscramble, and grammar table activities.
- Gemini sentence-writing evaluation for short sentence practice.
- Gemini final writing evaluation with targeted grammar correction cards.
- AI writing chatbox for questions about feedback and grammar mistakes.
- Backup Gemini model retry for sentence writing, final writing, and AI writing chat.
- MongoDB Atlas data models for users, topics, missions, activities, progress, and submissions.
- Paper-inspired responsive UI built with React, Vite, Tailwind CSS, React Router, Axios, and Lucide React.

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React

Backend:

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- dotenv
- cors
- Gemini API integration

## Folder Structure

```text
writewise/
  client/
    src/
      components/
      context/
      data/
      pages/
      services/
      styles/
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    seed/
    utils/
```

## Environment Variables

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_BACKUP_MODELS=gemini-2.0-flash,gemini-2.0-flash-lite
ALLOW_FINAL_WRITING_TEST=false
```

Create `client/.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Run Locally

Install backend dependencies:

```bash
cd writewise/server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

Start the backend:

```bash
cd ../server
npm run dev
```

Start the frontend:

```bash
cd ../client
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Seed the Database

Make sure `server/.env` contains a valid MongoDB Atlas `MONGO_URI`, then run:

```bash
cd writewise/server
npm run seed
```

The seed script creates:

- 5 topics: Health, Sport, Education, Environment, Technology
- 4 complete Health missions
- 5 placeholder missions for each other topic
- Health grammar tasks: Present Simple, Modal Verbs, Conditional Sentences, Relative Clauses, and Complex Sentences
- Each grammar task has 20 questions: 10 MCQ, 5 gap-fill, 3 unscramble, and 2 sentence-writing questions
- Grammar summaries, answer explanations, writing hints, and sentence patterns

The script upserts topics and missions. It replaces Health mission activity questions so edited learning content is refreshed. When Health mission names change, it removes obsolete Health mission and activity records only. It does not delete users, submissions, or progress records.

## MongoDB Atlas

WriteWise uses MongoDB Atlas as the hosted database. Create a cluster, add a database user, allow your local IP address during development, and copy the connection string into `MONGO_URI`.

For Render deployment, add Render's outbound access requirements to Atlas Network Access. For simple student demos, `0.0.0.0/0` works, but a narrower allowlist is safer when available.

## Gemini Evaluation

The backend route `POST /api/ai/evaluate-writing` accepts:

```json
{
  "topicTitle": "Health",
  "miniTopicTitle": "Fast food",
  "writingQuestion": "Should people eat less fast food? Write a paragraph of about 100 words.",
  "paragraph": "..."
}
```

The route builds a reusable prompt in `server/utils/aiPrompt.js`, asks Gemini for JSON only, saves the submission, and marks the mission complete when the score is at least 60.

Gemini model reliability is controlled with:

```env
GEMINI_MODEL=gemini-2.5-flash
GEMINI_BACKUP_MODELS=gemini-2.0-flash,gemini-2.0-flash-lite
```

The backend tries `GEMINI_MODEL` first, then every comma-separated model in `GEMINI_BACKUP_MODELS`, then the built-in defaults `gemini-2.5-flash`, `gemini-2.0-flash`, and `gemini-2.0-flash-lite` without duplicate calls. If the primary model is unavailable or under high demand, the backend automatically tries the next model.

WriteWise uses Gemini only for:

- Sentence-writing questions inside grammar tasks: `POST /api/ai/evaluate-sentence`
- Final paragraph evaluation: `POST /api/ai/evaluate-writing`
- AI writing chat after feedback: `POST /api/ai/writing-chat`

WriteWise does not call Gemini for MCQ, gap-fill, unscramble, or grammar table challenge questions.

Final writing feedback does not show a full learner-facing "Improved Version" or a separate Suggestions section. It shows the original paragraph with red and yellow highlighted issues, feedback cards, and the AI chatbox.

If every Gemini model fails during final writing evaluation, WriteWise saves the paragraph and shows a retry message instead of pretending to give detailed AI feedback. Learners see: "We could not check your writing carefully right now. Please try again in a moment." They do not see API, quota, key, mock, fallback, or model-unavailable messages.

Sentence-writing practice also uses Gemini through the backend. If Gemini is unavailable, learners are asked to try again instead of being marked wrong by local guessing. The AI writing chat tries the same model list, then returns limited local guidance only if all Gemini models fail.

To avoid free quota issues:

- Test MCQ, gap-fill, unscramble, and grammar table flows freely because they do not use Gemini.
- Use sentence-writing checks sparingly during demos because each sentence-writing item calls Gemini.
- Use one final writing submission per test flow when possible.
- Use the chatbox with short questions.
- Test non-AI flows without `GEMINI_API_KEY`; sentence writing, final writing, and chat need Gemini for full behavior.

To test Gemini sentence writing and chat:

1. Start the backend with a valid `GEMINI_API_KEY`.
2. Open a grammar task and reach a sentence-writing question.
3. Submit a correct sentence and check that it can pass.
4. Submit an incorrect sentence and check that it appears in the missed-question retry flow.
5. Submit Final Writing, open the feedback page, and ask a question in the AI Writing Chat.

## How to edit learning content

Learning content is stored in the seed files:

- `server/seed/seed.js` creates topics and placeholder missions.
- `server/seed/healthContent.js` stores the full Health mission content.

To edit questions, update the seed data. Health content is organized by mission, then grammar task. Each grammar task uses stable task slugs:

- `present-simple`
- `modal-verbs`
- `conditional-sentences`
- `relative-clauses`
- `complex-sentences`
- `final-writing`

Each seeded question can include:

- `question`
- `taskSlug`
- `taskNumber`
- `grammarTitle`
- `questionType`
- `options`
- `correctAnswer`
- `acceptedAnswers`
- `scrambledWords`
- `keyword`
- `grammarPoint`
- `wrongAnswerExplanation`
- `correctAnswerExplanation`
- `grammarSummary`

To add a new topic, add:

1. A topic object
2. Mission objects
3. Five grammar task groups
4. Activity questions grouped by question type
5. Grammar summaries
6. Writing hints
7. Useful sentence patterns
8. A final writing prompt

Then run:

```bash
cd writewise/server
npm run seed
```

Running the seed script updates learning content. It does not delete users by default. The current script replaces Health activity questions to keep edited classroom content in sync. If missions are removed from the Health path, the seed removes only the obsolete mission and activity records while preserving user accounts, progress records, and submissions. If you change the task structure, old progress records may no longer match the new task slugs; delete only `progresses` if you need a clean student demo.

## Deploy Backend to Render

1. Push the `writewise` project to a Git provider.
2. Create a new Render Web Service.
3. Set the root directory to `writewise/server`.
4. Use `npm install` as the build command.
5. Use `npm start` as the start command.
6. Add the backend environment variables from `server/.env.example`.
7. Set `CLIENT_URL` to the deployed Vercel frontend URL.

After deployment, the API base URL should look like:

```text
https://your-render-service.onrender.com/api
```

## Deploy Frontend to Vercel

1. Import the project into Vercel.
2. Set the root directory to `writewise/client`.
3. Add this environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

4. Deploy with the default Vite build settings.

## Demo Account

No demo account is seeded by default. Register a new account through the app after the database is seeded.
