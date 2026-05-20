import { Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingState from "../components/LoadingState";
import { getMiniTopicActivities } from "../services/activityService";
import { evaluateWriting } from "../services/submissionService";

const getWordCount = (text) => {
  const matches = text.trim().match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);
  return matches ? matches.length : 0;
};

const WritingPage = () => {
  const { miniTopicId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [paragraph, setParagraph] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMiniTopicActivities(miniTopicId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [miniTopicId]);

  const wordCount = useMemo(() => getWordCount(paragraph), [paragraph]);
  const isValidLength = wordCount >= 80 && wordCount <= 130;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isValidLength) {
      setError("Write between 80 and 130 words before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await evaluateWriting({
        topicId: data.topic._id,
        miniTopicId: data.miniTopic._id,
        topicTitle: data.topic.title,
        miniTopicTitle: data.miniTopic.title,
        writingQuestion: data.miniTopic.writingQuestion,
        paragraph
      });
      navigate(`/feedback/${response.submissionId}`, { state: { evaluation: response } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading writing task" />;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">{data?.topic?.title}</p>
          <h1 className="mt-2 font-display text-3xl font-black text-primary sm:text-4xl">Final Writing</h1>
          <p className="mt-3 rounded-paper border border-border bg-paperSoft p-4 text-lg font-semibold text-text">
            Write a short paragraph.
          </p>
          <p className="mt-3 max-w-3xl text-lg text-muted">{data?.miniTopic?.title} Challenge</p>
        </div>
        <Button as={Link} to={`/mini-topics/${miniTopicId}`} variant="outline">
          Back to Map
        </Button>
      </div>

      {error && <p className="mb-6 rounded-paper border border-danger/30 bg-danger/10 p-4 text-danger">{error}</p>}

      <Card className="mt-6 p-7">
        {data?.finalWriting?.isUnlocked ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-5 rounded-paper border border-border bg-paperSoft p-5">
              <p className="font-display text-xl font-bold text-primary">Writing Question</p>
              <p className="mt-2 text-lg leading-8 text-muted">{data.miniTopic.writingQuestion}</p>
            </div>

            <div className="mb-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-paper border border-border bg-surface p-4">
                <h2 className="font-display text-lg font-bold text-primary">Writing Hints</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-muted">
                  {(data.miniTopic.writingHints || []).map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-paper border border-border bg-surface p-4">
                <h2 className="font-display text-lg font-bold text-primary">Grammar Reminders</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-muted">
                  {(data.miniTopic.grammarReminders || []).map((reminder) => (
                    <li key={reminder}>{reminder}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-paper border border-border bg-surface p-4">
                <h2 className="font-display text-lg font-bold text-primary">Sentence Patterns</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-muted">
                  {(data.miniTopic.sentencePatterns || []).map((pattern) => (
                    <li key={pattern}>{pattern}</li>
                  ))}
                </ul>
              </div>
            </div>

            <label className="block">
              <span className="font-display text-xl font-bold text-primary">Your paragraph</span>
              <textarea
                value={paragraph}
                onChange={(event) => setParagraph(event.target.value)}
                className="mt-3 min-h-[280px] w-full rounded-paper border border-border bg-surface px-4 py-3.5 text-lg leading-8"
                placeholder="Write your paragraph here"
              />
            </label>
            <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className={`font-mono text-base ${isValidLength ? "text-success" : "text-muted"}`}>
                {wordCount} words / required 80-130
              </p>
              <Button type="submit" variant="secondary" disabled={submitting}>
                <Send aria-hidden="true" size={17} />
                {submitting ? "Submitting Task" : "Submit Task"}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <h2 className="font-display text-2xl font-bold text-primary">Writing Locked</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Complete Task 1, Task 2, Task 3, Task 4, and Task 5 with at least 60% before opening Final Writing.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
};

export default WritingPage;
