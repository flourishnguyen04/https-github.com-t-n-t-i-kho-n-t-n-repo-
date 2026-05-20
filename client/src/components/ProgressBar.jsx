const ProgressBar = ({ value = 0, label = "Progress", showLabel = true }) => {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-text">{label}</span>
          <span className="font-mono text-muted">{safeValue}%</span>
        </div>
      )}
      <div
        className="h-2.5 overflow-hidden rounded-full border border-border bg-paperSoft"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={safeValue}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
