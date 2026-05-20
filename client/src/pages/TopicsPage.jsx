import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import TopicCard from "../components/TopicCard";
import { getTopics } from "../services/topicService";

const TopicsPage = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockedModalOpen, setLockedModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getTopics()
      .then(setTopics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState label="Loading topics" />;
  }

  const currentTopicId = topics.find((topic) => topic.isUnlocked && !topic.isCompleted)?._id;
  const topicsWithCurrentState = topics
    .filter((topic) => topic.title !== "Technology")
    .map((topic) => ({
      ...topic,
      isCurrent: topic._id === currentTopicId
    }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">Topics</p>
          <h1 className="mt-2 font-display text-4xl font-black text-primary">Choose your learning path</h1>
          <p className="mt-3 max-w-2xl text-muted">Complete each topic to unlock the next grammar-focused path.</p>
        </div>
        <Button as={Link} to="/dashboard" variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {error && <p className="mb-6 rounded-paper border border-danger/30 bg-danger/10 p-4 text-danger">{error}</p>}

      {topicsWithCurrentState.length ? (
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {topicsWithCurrentState.map((topic) => (
            <TopicCard key={topic._id} topic={topic} onLockedClick={() => setLockedModalOpen(true)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No topics found" text="Run the seed script to create the WriteWise topic path." />
      )}

      <Modal
        isOpen={lockedModalOpen}
        title="Topic Locked"
        actionLabel="Back to My Progress"
        onClose={() => setLockedModalOpen(false)}
      >
        Complete the previous topic to unlock this path.
      </Modal>
    </section>
  );
};

export default TopicsPage;
