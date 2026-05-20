const LoadingState = ({ label = "Loading" }) => (
  <div className="flex min-h-[220px] items-center justify-center">
    <div className="paper-panel rounded-paper border border-border px-6 py-5 text-center shadow-tactile">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-secondary" />
      <p className="font-display text-sm font-semibold text-primary">{label}</p>
    </div>
  </div>
);

export default LoadingState;
