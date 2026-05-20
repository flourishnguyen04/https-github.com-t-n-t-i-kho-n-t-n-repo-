import { CheckCircle2, Circle, Lock, Trophy } from "lucide-react";

const stateLabel = {
  locked: "locked",
  current: "current",
  completed: "completed",
  available: "available"
};

const nodeClasses = {
  locked: "border-border bg-paperSoft text-muted opacity-55 grayscale",
  current: "border-secondary bg-surface text-secondary shadow-[0_0_0_8px_rgba(139,92,246,0.14),0_18px_32px_rgba(17,17,17,0.08)]",
  completed: "border-success bg-success/10 text-success",
  available: "border-primary bg-surface text-primary"
};

const iconClasses = {
  locked: "border-border bg-surface text-muted",
  current: "border-secondary bg-secondary text-white",
  completed: "border-success bg-success text-white",
  available: "border-border bg-surface text-secondary"
};

const TaskNode = ({ meta, step, status, position, onSelect }) => {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const StatusIcon = status === "completed" ? CheckCircle2 : status === "locked" ? Lock : Circle;
  const CenterIcon = meta.isFinalWriting ? Trophy : null;

  return (
    <button
      type="button"
      aria-disabled={isLocked}
      aria-label={`${meta.isFinalWriting ? "Final Writing" : `Task ${meta.taskNumber}`}, ${meta.grammarTitle}, ${stateLabel[status]}`}
      tabIndex={isLocked ? -1 : 0}
      onClick={() => onSelect(step)}
      className={`mission-task-node group absolute z-20 flex w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-secondary/45 ${
        isLocked ? "cursor-not-allowed" : ""
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`
      }}
    >
      <span
        className={`relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-[3px] shadow-tactile transition ${nodeClasses[status]}`}
      >
        {CenterIcon ? (
          <CenterIcon aria-hidden="true" size={36} strokeWidth={2.4} />
        ) : (
          <>
            <span className="font-mono text-[0.68rem] uppercase leading-none">Task</span>
            <span className="mt-1 font-display text-4xl font-black leading-none">{meta.taskNumber}</span>
          </>
        )}
        <span
          className={`absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-tactile ${iconClasses[status]}`}
        >
          <StatusIcon aria-hidden="true" size={18} />
        </span>
      </span>
      <span className="mt-2 rounded-paper border border-border bg-surface/95 px-3 py-1 shadow-tactile">
        <span className={`block font-display font-black text-primary ${isCompleted ? "text-base" : "text-sm"}`}>
          {meta.isFinalWriting ? "Final Writing" : `Task ${meta.taskNumber}`}
        </span>
        {(isCompleted || meta.isFinalWriting) && (
          <span className={`block font-semibold leading-5 text-muted ${isCompleted ? "text-base text-primary" : "text-xs"}`}>
            {meta.grammarTitle}
          </span>
        )}
      </span>
    </button>
  );
};

export default TaskNode;
