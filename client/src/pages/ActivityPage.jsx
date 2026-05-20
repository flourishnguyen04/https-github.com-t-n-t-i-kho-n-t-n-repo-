import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import LoadingState from "../components/LoadingState";
import LockedTaskModal from "../components/LockedTaskModal";
import MissionMap from "../components/MissionMap";
import { getOrderedSteps } from "../data/taskMeta";
import { getMiniTopicActivities } from "../services/activityService";

const ActivityPage = () => {
  const { miniTopicId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockedModalOpen, setLockedModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getMiniTopicActivities(miniTopicId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [miniTopicId]);

  const steps = useMemo(() => getOrderedSteps(data?.tasks, data?.finalWriting), [data]);

  const handleTaskSelect = (step) => {
    if (!step?.isUnlocked) {
      setLockedModalOpen(true);
      return;
    }

    navigate(`/mini-topics/${miniTopicId}/tasks/${step.slug || step.taskSlug || step.type}`);
  };

  if (loading) {
    return <LoadingState label="Loading mission map" />;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">{data?.topic?.title}</p>
          <h1 className="mt-2 font-display text-3xl font-black text-primary sm:text-4xl">
            Mission {data?.miniTopic?.order}: {data?.miniTopic?.title} Challenge
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-muted">
            Follow the winding path from Task 1 at the bottom to Final Writing at the top.
          </p>
          <p className="mt-2 max-w-3xl font-display text-lg font-bold text-primary">
            The higher the task, the harder the level.
          </p>
        </div>
        <Button as={Link} to={`/topics/${data?.topic?._id}`} variant="outline">
          Back to Missions
        </Button>
      </div>

      {error && <p className="mb-6 rounded-paper border border-danger/30 bg-danger/10 p-4 text-danger">{error}</p>}

      <MissionMap miniTopic={data?.miniTopic} steps={steps} onTaskSelect={handleTaskSelect} />

      <LockedTaskModal isOpen={lockedModalOpen} onClose={() => setLockedModalOpen(false)} />
    </section>
  );
};

export default ActivityPage;
