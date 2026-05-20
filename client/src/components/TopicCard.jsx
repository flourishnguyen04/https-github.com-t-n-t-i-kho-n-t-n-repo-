import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "./Button";
import Card from "./Card";
import LockBadge from "./LockBadge";
import ProgressBar from "./ProgressBar";

const TopicCard = ({ topic, onLockedClick }) => {
  const handleLockedKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onLockedClick();
    }
  };

  return (
    <Card
      role={!topic.isUnlocked ? "button" : undefined}
      tabIndex={!topic.isUnlocked ? 0 : undefined}
      onClick={!topic.isUnlocked ? onLockedClick : undefined}
      onKeyDown={!topic.isUnlocked ? handleLockedKeyDown : undefined}
      className={`magic-bento-card flex min-h-[260px] flex-col p-5 ${
        topic.isUnlocked
          ? ""
          : "cursor-pointer opacity-65 grayscale-[0.25]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase text-muted">Topic {topic.order}</p>
          <h3 className="mt-1 font-display text-2xl font-bold text-primary">{topic.title}</h3>
        </div>
        {topic.isCompleted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
            <CheckCircle2 aria-hidden="true" size={14} />
            Completed
          </span>
        ) : topic.isCurrent ? (
          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            Current
          </span>
        ) : topic.isUnlocked ? (
          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            Unlocked
          </span>
        ) : (
          <LockBadge />
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-base">
        <div className="rounded-paper border border-border bg-paperSoft p-3">
          <p className="font-mono text-sm text-muted">{topic.totalMiniTopics || 0} Missions</p>
          <p className="font-semibold text-primary">mission count</p>
        </div>
        <div className="rounded-paper border border-border bg-paperSoft p-3">
          <p className="font-mono text-sm text-muted">
            {topic.completedMiniTopics || 0} / {topic.totalMiniTopics || 0}
          </p>
          <p className="font-semibold text-primary">completed</p>
        </div>
      </div>
      <div className="mt-5">
        <ProgressBar value={topic.progressPercent} label="Topic progress" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-base font-semibold text-primary">
        <span>{topic.isUnlocked ? "Mission path" : "Locked path"}</span>
        {topic.isUnlocked ? (
          <Button as={Link} to={`/topics/${topic._id}`} variant="secondary" size="sm">
            {topic.completedMiniTopics ? "Continue Missions" : "Start Missions"}
            <ArrowRight aria-hidden="true" size={16} />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onLockedClick();
            }}
          >
            Locked
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TopicCard;
