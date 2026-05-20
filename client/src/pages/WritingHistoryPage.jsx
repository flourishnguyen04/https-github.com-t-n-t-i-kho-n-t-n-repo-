import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingState from "../components/LoadingState";
import { getMySubmissions } from "../services/submissionService";

const formatSubmissionDate = (value) => {
  if (!value) {
    return "Recent";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
};

const WritingHistoryPage = () => {
  const [submissions, setSubmissions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMySubmissions()
      .then(setSubmissions)
      .catch((err) => setError(err.message));
  }, []);

  if (!submissions && !error) {
    return <LoadingState label="Loading writing history" />;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">Writing History</p>
          <h1 className="mt-2 font-display text-4xl font-black text-primary">AI-checked writing</h1>
          <p className="mt-3 max-w-2xl text-muted">Review every paragraph you submitted for AI correction and scoring.</p>
        </div>
        <Button as={Link} to="/dashboard" variant="outline">
          <ArrowLeft aria-hidden="true" size={18} />
          Back to Dashboard
        </Button>
      </div>

      {error && <p className="mb-6 rounded-paper border border-danger/30 bg-danger/10 p-4 text-danger">{error}</p>}

      {submissions?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {submissions.map((submission) => (
            <Card key={submission._id} as={Link} to={`/feedback/${submission._id}`} className="block p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-paper border border-warning/50 bg-warning/10 text-warning">
                    <FileText aria-hidden="true" size={22} />
                  </span>
                  <div>
                    <p className="font-display text-xl font-black text-primary">
                      {submission.miniTopicId?.title || "AI Writing Feedback"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-muted">{formatSubmissionDate(submission.createdAt)}</p>
                  </div>
                </div>
                <span className="rounded-paper border border-warning/50 bg-warning/10 px-4 py-2 font-mono text-lg font-black text-warning">
                  {submission.aiUnavailable || submission.score === null ? "--" : submission.score}
                </span>
              </div>
              <p className="line-clamp-4 text-base leading-7 text-muted">{submission.paragraph}</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-paper border border-warning/50 bg-warning/10 px-4 py-2 font-display font-black text-warning">
                Open feedback
                <ArrowRight aria-hidden="true" size={17} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="font-display text-2xl font-black text-primary">No writing history yet.</p>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Submit a final writing mission and your AI feedback will appear here.
          </p>
          <Button as={Link} to="/topics" variant="secondary" className="mt-6">
            Go to Topics
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
        </Card>
      )}
    </section>
  );
};

export default WritingHistoryPage;
