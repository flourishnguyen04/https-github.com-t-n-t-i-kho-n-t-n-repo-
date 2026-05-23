const CurvedPath = ({ allComplete = false, totalSteps = 6 }) => {
  const d = totalSteps === 8
    ? "M 258 772 C 220 732 142 712 100 672 C 58 632 214 612 258 572 C 220 532 142 512 100 472 C 58 432 214 412 258 372 C 220 332 142 312 100 272 C 58 232 214 212 258 172 C 302 132 218 102 180 72"
    : totalSteps === 7
    ? "M 258 774 C 220 725 142 695 100 657 C 58 619 214 578 258 540 C 302 502 142 461 100 423 C 58 385 214 344 258 306 C 302 268 142 227 100 189 C 58 151 142 110 180 72"
    : "M 258 775 C 220 725 142 682 100 635 C 58 588 214 542 258 495 C 302 448 142 402 100 355 C 58 308 214 262 258 215 C 285 178 218 116 180 72";

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 360 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="18"
        className="text-border"
        opacity="0.72"
      />
      <path
        d={d}
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
};

export default CurvedPath;
