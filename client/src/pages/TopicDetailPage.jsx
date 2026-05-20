import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import MiniTopicCard from "../components/MiniTopicCard";
import Modal from "../components/Modal";
import ProgressBar from "../components/ProgressBar";
import { getMiniTopics, getTopic } from "../services/topicService";

const TopicDetailPage = () => {
  const { topicId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockedModalOpen, setLockedModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([getTopic(topicId), getMiniTopics(topicId)])
      .then(([topicPayload, miniTopics]) => {
        setData({
          topic: topicPayload.topic,
          miniTopics
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [topicId]);

  if (loading) {
    return <LoadingState label="Loading topic" />;
  }

  const topic = data?.topic;
  const miniTopics = data?.miniTopics || [];
  const currentMiniTopicId = miniTopics.find((miniTopic) => miniTopic.isUnlocked && !miniTopic.isCompleted)?._id;
  const miniTopicsWithCurrentState = miniTopics.map((miniTopic) => ({
    ...miniTopic,
    isCurrent: miniTopic._id === currentMiniTopicId
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">Mission Path</p>
          <h1 className="mt-2 font-display text-4xl font-black text-primary">{topic?.title || "Topic"}</h1>
          <p className="mt-3 max-w-3xl text-lg text-muted">
            Complete each mission in order. Open a mission map, then choose an unlocked task node.
          </p>
        </div>
        <Button as={Link} to="/topics" variant="outline">
          All Topics
        </Button>
      </div>

      {error && <p className="mb-6 rounded-paper border border-danger/30 bg-danger/10 p-4 text-danger">{error}</p>}

      {topic && (
        <div className="mb-6 rounded-paper border border-border bg-surface p-5 shadow-tactile">
          <ProgressBar value={topic.progressPercent} label={`${topic.title} progress`} />
        </div>
      )}

      {miniTopics.length ? (
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {miniTopicsWithCurrentState.map((miniTopic) => (
            <MiniTopicCard
              key={miniTopic._id}
              miniTopic={miniTopic}
              onLockedClick={() => setLockedModalOpen(true)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No missions found" text="This topic is ready for new grammar missions." />
      )}

      <Modal
        isOpen={lockedModalOpen}
        title="Mission Locked"
        actionLabel="Back to My Progress"
        onClose={() => setLockedModalOpen(false)}
      >
        Complete the previous mission with a score of 60 or higher to unlock this mission.
      </Modal>
    </section>
  );
};

export default TopicDetailPage;
