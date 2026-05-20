import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "./Button";
import Card from "./Card";
import LockBadge from "./LockBadge";

const MiniTopicCard = ({ miniTopic, onLockedClick }) => {
  const handleLockedKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onLockedClick();
    }
  };

  return (
    <Card
      role={!miniTopic.isUnlocked ? "button" : undefined}
      tabIndex={!miniTopic.isUnlocked ? 0 : undefined}
      onClick={!miniTopic.isUnlocked ? onLockedClick : undefined}
      onKeyDown={!miniTopic.isUnlocked ? handleLockedKeyDown : undefined}
      className={`magic-bento-card flex min-h-[220px] flex-col p-5 ${
        miniTopic.isUnlocked
          ? ""
          : "cursor-pointer opacity-65 grayscale-[0.25]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase text-muted">Mission {miniTopic.order}</p>
          <h3 className="mt-1 font-display text-2xl font-bold text-primary">
            {miniTopic.title || `Mission ${miniTopic.order}`}
          </h3>
        </div>
        {miniTopic.isCompleted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
            <CheckCircle2 aria-hidden="true" size={14} />
            Completed
          </span>
        ) : miniTopic.isCurrent ? (
          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            Current
          </span>
        ) : miniTopic.isUnlocked ? (
          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            Continue
          </span>
        ) : (
          <LockBadge />
        )}
      </div>
      <p className="text-base leading-7 text-muted">
        {miniTopic.isCompleted
          ? "Completed mission"
          : miniTopic.isUnlocked
            ? "Ready for your next task map"
            : "Complete the previous mission to unlock this one"}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-base font-semibold text-primary">
        <span>{miniTopic.isCompleted ? "Review" : "Mission map"}</span>
        {miniTopic.isUnlocked ? (
          <Button as={Link} to={`/mini-topics/${miniTopic._id}`} variant="secondary" size="sm">
            {miniTopic.isCompleted ? "Review Mission" : "Start Mission"}
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

export default MiniTopicCard;
