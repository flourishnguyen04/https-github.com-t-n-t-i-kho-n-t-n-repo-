import { CheckCircle2, Circle, Lock } from "lucide-react";
import { getTaskMeta } from "../data/taskMeta";

const ActivityStepper = ({ steps, activeType, onSelect }) => (
  <div className="overflow-x-auto rounded-paper border border-border bg-surface p-3 shadow-tactile">
    <ol className="flex min-w-max items-center gap-3">
      {steps.map((step, index) => {
        const meta = getTaskMeta(step.type);
        const isActive = step.type === activeType;
        const isDisabled = !step.isUnlocked;

        return (
          <li key={step.type} className="flex items-center gap-3">
            <button
              type="button"
              aria-label={`${meta.shortTitle}, ${step.isCompleted ? "completed" : isDisabled ? "locked" : isActive ? "current" : "available"}`}
              onClick={() => !isDisabled && onSelect(step.type)}
              disabled={isDisabled}
              className={`flex min-w-[138px] items-center gap-2 rounded-paper border px-3 py-2 text-left text-sm transition ${
                isActive
                  ? "border-secondary bg-secondary text-white"
                  : step.isCompleted
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border bg-paperSoft text-text"
              } disabled:cursor-not-allowed disabled:opacity-55`}
            >
              {step.isCompleted ? (
                <CheckCircle2 aria-hidden="true" size={17} />
              ) : isDisabled ? (
                <Lock aria-hidden="true" size={17} />
              ) : (
                <Circle aria-hidden="true" size={17} />
              )}
              <span className="font-display font-semibold">{meta.shortTitle}</span>
            </button>
            {index < steps.length - 1 && <span className="step-line h-px w-8" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  </div>
);

export default ActivityStepper;
