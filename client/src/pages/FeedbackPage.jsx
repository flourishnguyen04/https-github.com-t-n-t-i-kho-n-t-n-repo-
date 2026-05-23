import { ArrowRight, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import FeedbackCard from "../components/FeedbackCard";
import GrammarHighlight from "../components/GrammarHighlight";
import LoadingState from "../components/LoadingState";
import { getSubmission, sendWritingChatMessage } from "../services/submissionService";

const levelClasses = {
  Excellent: "border-success/30 bg-success/10 text-success",
  "Good Progress": "border-secondary/30 bg-secondary/10 text-secondary",
  "Needs Improvement": "border-warning/30 bg-warning/10 text-warning",
  "Needs Review": "border-warning/30 bg-warning/10 text-warning"
};

const quickQuestions = [
  "Why is this wrong?",
  "Can you explain this grammar rule?",
  "How can I improve this sentence?",
  "Give me another example."
];

const grammarMistakesToFeedbackCards = (grammarMistakes = []) =>
  grammarMistakes
    .filter((mistake) => mistake?.originalText || mistake?.errorText)
    .map((mistake) => ({
      type: "error",
      originalText: mistake.originalText || mistake.errorText,
      correction: mistake.correction || "",
      focus: mistake.grammarPoint || "Grammar",
      explanation: mistake.explanation || "Review this sentence for grammar accuracy."
    }));

const getFeedbackCards = (submission) =>
  (submission?.feedbackCards?.length
    ? submission.feedbackCards.filter((card) => card?.originalText && (card?.correction || card?.suggestedRevision))
    : grammarMistakesToFeedbackCards(submission?.grammarMistakes || [])
  ).map((card, index) => ({
    ...card,
    id: card.id || `feedback-card-${card.type || "error"}-${index}`
  }));

const getFeedbackLines = (feedback = "") => {
  const text = String(feedback || "").trim();
  if (!text) return [];

  const explicitLines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  if (explicitLines.length > 1) return explicitLines;

  return text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
};

const getCardTone = (type) =>
  type === "improvement"
    ? {
        card: "border-warning/40 bg-white",
        active: "border-warning shadow-paper ring-4 ring-warning/20",
        badge: "border-warning/40 bg-warning/10 text-warning",
        label: "Improvement",
        valueLabel: "Better choice / Suggested revision",
        valueClass: "text-warning",
        emptyText: "No improvement notes for this paragraph.",
        sectionTitle: "Improvement Cards",
        sectionSubtitle: "Style, relevance, clarity, and coherence"
      }
    : {
        card: "border-danger/35 bg-white",
        active: "border-danger shadow-paper ring-4 ring-danger/15",
        badge: "border-danger/35 bg-danger/10 text-danger",
        label: "Correction",
        valueLabel: "Correction",
        valueClass: "text-success",
        emptyText: "No correction cards for this paragraph.",
        sectionTitle: "Correction Cards",
        sectionSubtitle: "Grammar, vocabulary, and form errors"
      };

const FeedbackCardItem = ({ card, active, registerCardRef }) => {
  const tone = getCardTone(card.type);
  const suggestedText = card.type === "improvement" ? card.suggestedRevision : card.correction;

  return (
    <div
      id={card.id}
      ref={(element) => registerCardRef(card.id, element)}
      className={`rounded-paper border p-4 transition duration-300 ${
        active ? `${tone.active} feedback-card-pulse scale-[1.02]` : tone.card
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full border px-3 py-1 font-display text-sm font-bold ${tone.badge}`}>
          {tone.label}
        </span>
        {active && (
          <span className="inline-flex rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 font-display text-sm font-bold text-secondary">
            Selected
          </span>
        )}
      </div>
      <dl className="mt-3 space-y-3 text-base">
        <div>
          <dt className="font-display text-sm font-bold uppercase text-muted">Original</dt>
          <dd className="mt-1 font-semibold text-text">{card.originalText}</dd>
        </div>
        {suggestedText && (
          <div>
            <dt className="font-display text-sm font-bold uppercase text-muted">{tone.valueLabel}</dt>
            <dd className={`mt-1 font-bold ${tone.valueClass}`}>{suggestedText}</dd>
          </div>
        )}
        <div>
          <dt className="font-display text-sm font-bold uppercase text-muted">Focus</dt>
          <dd className="mt-1 inline-flex rounded-full border border-border bg-surface px-3 py-1 font-display text-sm font-bold text-primary">
            {card.focus}
          </dd>
        </div>
        <div>
          <dt className="font-display text-sm font-bold uppercase text-muted">Explanation</dt>
          <dd className="mt-1 text-muted">{card.explanation}</dd>
        </div>
      </dl>
    </div>
  );
};

const FeedbackCardColumn = ({ type, cards, activeFeedbackCardId, registerCardRef }) => {
  const tone = getCardTone(type);

  return (
    <section className="rounded-paper border border-border bg-surface p-4">
      <div className="mb-4">
        <h4 className="font-display text-xl font-black text-primary">{tone.sectionTitle}</h4>
        <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${tone.badge}`}>
          {tone.sectionSubtitle}
        </p>
      </div>
      {cards.length ? (
        <div className="space-y-3">
          {cards.map((card) => (
            <FeedbackCardItem
              key={card.id}
              card={card}
              active={activeFeedbackCardId === card.id}
              registerCardRef={registerCardRef}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-paper border border-border bg-paperSoft p-4 text-base text-muted">{tone.emptyText}</p>
      )}
    </section>
  );
};

const WritingChatBox = ({ submission, feedbackCards }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about your grammar mistakes, corrections, or ways to improve your writing."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const sendQuestion = async (text) => {
    const trimmedQuestion = text.trim();
    if (!trimmedQuestion || sending) return;

    setChatError("");
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: trimmedQuestion }]);
    setSending(true);

    try {
      const response = await sendWritingChatMessage({
        submissionId: submission._id,
        question: trimmedQuestion,
        writingContext: submission.paragraph,
        topicTitle: submission.topicId?.title || "",
        missionTitle: submission.miniTopicId?.title || "",
        writingQuestion: submission.miniTopicId?.writingQuestion || "",
        modelParagraphs: submission.miniTopicId?.finalWritingModelParagraphs || [],
        grammarReminders: submission.miniTopicId?.grammarReminders || [],
        usefulStructures: submission.miniTopicId?.usefulStructures || submission.miniTopicId?.sentencePatterns || [],
        feedbackCards,
        score: submission.score,
        level: submission.level
      });
      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
    } catch {
      setChatError("I could not answer that question right now. Try asking about one grammar mistake.");
    } finally {
      setSending(false);
    }
  };

  return (
    <FeedbackCard title="AI Writing Chat" accent="feedback-writing-card">
      <div className="space-y-4">
        <div className="max-h-80 space-y-3 overflow-y-auto rounded-paper border border-border bg-paperSoft p-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-paper border p-4 text-base leading-7 shadow-tactile ${
                message.role === "user"
                  ? "ml-auto max-w-[88%] border-secondary/30 bg-secondary/10 text-primary"
                  : "ai-chat-response mr-auto max-w-[92%] border-success/30 bg-white text-text"
              }`}
            >
              <p className={`mb-1 font-display text-sm font-black uppercase ${message.role === "user" ? "text-secondary" : "text-success"}`}>
                {message.role === "user" ? "You" : "AI Writing Coach"}
              </p>
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          ))}
          {sending && <p className="text-base text-muted">Thinking about your writing...</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => sendQuestion(item)}
              disabled={sending}
              className="rounded-full border border-border bg-surface px-3 py-2 text-sm font-semibold text-primary transition hover:border-secondary focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/40 disabled:opacity-60"
            >
              {item}
            </button>
          ))}
        </div>

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            sendQuestion(question);
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Ask a writing question</span>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full rounded-paper border border-border bg-surface px-4 py-3 text-base text-primary focus-visible:outline focus-visible:outline-4 focus-visible:outline-secondary/40"
              placeholder="Ask about your grammar feedback"
            />
          </label>
          <Button type="submit" variant="secondary" disabled={sending || !question.trim()}>
            <Send aria-hidden="true" size={17} />
            Send
          </Button>
        </form>
        {chatError && <p className="rounded-paper border border-warning/30 bg-warning/10 p-3 text-warning">{chatError}</p>}
      </div>
    </FeedbackCard>
  );
};

const FeedbackPage = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFeedbackCardId, setActiveFeedbackCardId] = useState(null);
  const cardRefs = useRef({});
  const activeTimerRef = useRef(null);

  useEffect(() => {
    getSubmission(submissionId)
      .then(setSubmission)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [submissionId]);

  useEffect(
    () => () => {
      if (activeTimerRef.current) {
        window.clearTimeout(activeTimerRef.current);
      }
    },
    []
  );

  if (loading) {
    return <LoadingState label="Loading feedback" />;
  }

  const miniTopicId = submission?.miniTopicId?._id || submission?.miniTopicId?.id || submission?.miniTopicId;
  const feedbackCards = getFeedbackCards(submission);
  const aiUnavailable = Boolean(submission?.aiUnavailable);
  const improvementCards = feedbackCards.filter((card) => card.type === "improvement");
  const correctionCards = feedbackCards.filter((card) => card.type !== "improvement");
  const feedbackLines = getFeedbackLines(submission?.feedback);
  const registerCardRef = (id, element) => {
    if (element) {
      cardRefs.current[id] = element;
    } else {
      delete cardRefs.current[id];
    }
  };
  const handleMistakeClick = (cardId) => {
    const target = cardRefs.current[cardId];
    if (!target) return;

    if (activeTimerRef.current) {
      window.clearTimeout(activeTimerRef.current);
    }

    setActiveFeedbackCardId(cardId);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    activeTimerRef.current = window.setTimeout(() => setActiveFeedbackCardId(null), 2200);
  };

  return (
    <section className="mx-auto max-w-[92rem] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">AI Feedback</p>
          <h1 className="mt-2 font-display text-4xl font-black text-primary">
            {submission?.miniTopicId?.title || "Writing Feedback"}
          </h1>
          <p className="mt-3 text-muted">{submission?.topicId?.title}</p>
        </div>
        <Button as={Link} to="/topics" variant="outline">
          Back to Topics
        </Button>
      </div>

      {error && <p className="mb-6 rounded-paper border border-danger/30 bg-danger/10 p-4 text-danger">{error}</p>}

      {submission && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[0.45fr_1fr]">
            <Card className="p-5">
              <p className="font-mono text-sm uppercase text-muted">Score</p>
              <div className="mt-2 flex flex-wrap items-end gap-4">
                <p className="font-mono text-6xl text-primary">{aiUnavailable || submission.score === null ? "--" : submission.score}</p>
                <div className="pb-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${levelClasses[submission.level]}`}>
                    {submission.level}
                  </span>
                  <p className="mt-2 text-sm text-muted">{submission.wordCount} words</p>
                </div>
              </div>
            </Card>
            <FeedbackCard title="Overall Feedback" accent="feedback-writing-card">
              {feedbackLines.length ? (
                <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-text">
                  {feedbackLines.map((line, index) => (
                    <li key={`${line}-${index}`}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-base leading-7 text-muted">{submission.feedback}</p>
              )}
            </FeedbackCard>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {(aiUnavailable || submission.score < 60) && (
              <Button
                as={Link}
                to={`/mini-topics/${miniTopicId}/tasks/final-writing`}
                state={{ paragraph: submission.paragraph }}
                variant="secondary"
              >
                <RotateCcw aria-hidden="true" size={17} />
                {aiUnavailable ? "Try Again" : "Retry Writing"}
              </Button>
            )}
            <Button as={Link} to={`/mini-topics/${miniTopicId}`} variant="outline">
              Review Mission Map
              <ArrowRight aria-hidden="true" size={17} />
            </Button>
          </div>

          {aiUnavailable ? (
            <FeedbackCard title="Saved Paragraph">
              <p className="whitespace-pre-wrap text-base leading-8 text-muted">{submission.paragraph}</p>
            </FeedbackCard>
          ) : (
            <>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(26rem,1.05fr)]">
                <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
                  <FeedbackCard title="Original Paragraph" accent="feedback-writing-card">
                    <div className="text-lg leading-9">
                      <GrammarHighlight paragraph={submission.paragraph} mistakes={feedbackCards} onMistakeClick={handleMistakeClick} />
                    </div>
                    {!feedbackCards.length && (
                      <p className="mt-4 rounded-paper border border-success/30 bg-success/10 p-4 text-base font-semibold text-success">
                        No feedback cards for this paragraph.
                      </p>
                    )}
                  </FeedbackCard>
                </div>
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <FeedbackCardColumn
                    type="improvement"
                    cards={improvementCards}
                    activeFeedbackCardId={activeFeedbackCardId}
                    registerCardRef={registerCardRef}
                  />
                  <FeedbackCardColumn
                    type="error"
                    cards={correctionCards}
                    activeFeedbackCardId={activeFeedbackCardId}
                    registerCardRef={registerCardRef}
                  />
                </div>
              </div>
              <WritingChatBox submission={submission} feedbackCards={feedbackCards} />
            </>
          )}
                </div>
      )}
    </section>
  );
};

export default FeedbackPage;
