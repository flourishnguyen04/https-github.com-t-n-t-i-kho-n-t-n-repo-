import { ArrowRight, BookOpen, History } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingState from "../components/LoadingState";
import ProgressBar from "../components/ProgressBar";
import { useAuth } from "../context/AuthContext";
import { getMyProgress } from "../services/progressService";

const DashboardPage = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProgress()
      .then(setProgress)
      .catch((err) => setError(err.message));
  }, []);

  if (!progress && !error) {
    return <LoadingState label="Loading your progress" />;
  }

  const hasActiveTopic = Boolean(progress?.currentUnlockedTopic?._id);
  const continuePath = hasActiveTopic ? `/topics/${progress.currentUnlockedTopic._id}` : "/topics";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-black text-primary">Welcome, {user?.name}</h1>
          <p className="mt-3 max-w-2xl text-muted">Continue your grammar missions when you are ready.</p>
        </div>
        <Button as={Link} to={continuePath} variant={hasActiveTopic ? "secondary" : "outline"}>
          {hasActiveTopic ? "Continue Learning" : "Go to Topics"}
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </div>

      {error && <p className="mb-6 rounded-paper border border-danger/30 bg-danger/10 p-4 text-danger">{error}</p>}

      {progress && (
        <div className="grid gap-5 lg:grid-cols-[0.82fr_1.38fr]">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <BookOpen aria-hidden="true" className="text-secondary" size={24} />
              <h2 className="font-display text-xl font-bold text-primary">Overall Progress</h2>
            </div>
            <ProgressBar value={progress.overallProgressPercent} label="Total learning progress" />
            <div className="mt-7 border-t border-border/70 pt-5">
              <div className="mb-4 flex items-center gap-3">
                <History aria-hidden="true" className="text-secondary" size={22} />
                <h3 className="font-display text-lg font-black text-primary">Writing History</h3>
              </div>
              <Button
                as={Link}
                to="/writing-history"
                variant="outline"
                className="w-full border-warning/50 bg-warning/10 text-warning hover:border-warning hover:bg-warning/15"
              >
                View Writing History
                <ArrowRight aria-hidden="true" size={17} />
              </Button>
            </div>
          </Card>
          <Card className="min-h-[300px] p-8 lg:-ml-3">
            <p className="font-mono text-sm uppercase text-muted">Continue Learning</p>
            <h2 className="mt-2 font-display text-3xl font-black text-primary">
              {progress.currentUnlockedTopic?.title || "Topics"}
            </h2>
            <p className="mt-3 text-base leading-7 text-muted">
              {progress.currentUnlockedTopic?.description ||
                "Open the topic list to start your first WriteWise learning path."}
            </p>
            <Button as={Link} to={continuePath} variant="secondary" className="mt-5">
              {hasActiveTopic ? "Open Topic" : "Go to Topics"}
              <ArrowRight aria-hidden="true" size={17} />
            </Button>
          </Card>
        </div>
      )}
    </section>
  );
};

export default DashboardPage;
