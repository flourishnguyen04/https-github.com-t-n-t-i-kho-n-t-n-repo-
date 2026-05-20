const CurvedPath = ({ allComplete = false }) => (
  <svg
    className="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="0 0 360 900"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      d="M 258 775 C 220 725 142 682 100 635 C 58 588 214 542 258 495 C 302 448 142 402 100 355 C 58 308 214 262 258 215 C 285 178 218 116 180 72"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="18"
      className="text-border"
      opacity="0.72"
    />
    <path
      d="M 258 775 C 220 725 142 682 100 635 C 58 588 214 542 258 495 C 302 448 142 402 100 355 C 58 308 214 262 258 215 C 285 178 218 116 180 72"
      fill="none"
      stroke="currentColor"
      strokeDasharray="12 14"
      strokeLinecap="round"
      strokeWidth="5"
      className={allComplete ? "text-success" : "text-secondary"}
      opacity={allComplete ? "0.95" : "0.62"}
    />
  </svg>
);

export default CurvedPath;
