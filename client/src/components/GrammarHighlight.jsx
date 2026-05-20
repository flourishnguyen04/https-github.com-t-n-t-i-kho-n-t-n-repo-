const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSegments = (paragraph, mistakes = []) => {
  const ranges = [];

  mistakes.forEach((mistake) => {
    const targetText = mistake.originalText || mistake.errorText;
    if (!targetText) return;
    const regex = new RegExp(escapeRegExp(targetText), "i");
    const match = regex.exec(paragraph);

    if (!match) return;

    const start = match.index;
    const end = start + match[0].length;
    const overlaps = ranges.some((range) => start < range.end && end > range.start);

    if (!overlaps) {
      ranges.push({ start, end, mistake, cardId: mistake.id, text: match[0] });
    }
  });

  ranges.sort((a, b) => a.start - b.start);

  if (ranges.length === 0) {
    return [{ text: paragraph, highlight: false }];
  }

  const segments = [];
  let cursor = 0;

  ranges.forEach((range) => {
    if (cursor < range.start) {
      segments.push({ text: paragraph.slice(cursor, range.start), highlight: false });
    }

    segments.push({
      text: paragraph.slice(range.start, range.end),
      highlight: true,
      mistake: range.mistake,
      cardId: range.cardId
    });
    cursor = range.end;
  });

  if (cursor < paragraph.length) {
    segments.push({ text: paragraph.slice(cursor), highlight: false });
  }

  return segments;
};

const GrammarHighlight = ({ paragraph = "", mistakes = [], onMistakeClick }) => {
  const segments = buildSegments(paragraph, mistakes);

  return (
    <p className="grammar-highlight-block whitespace-pre-wrap rounded-paper border border-border bg-paperSoft p-6 text-base leading-9 text-text">
      {segments.map((segment, index) =>
        segment.highlight ? (
          <button
            key={`${segment.text}-${index}`}
            type="button"
            onClick={() => onMistakeClick?.(segment.cardId)}
            className={`grammar-highlight-token ${
              segment.mistake?.type === "improvement" ? "is-improvement" : "is-correction"
            } cursor-pointer transition focus-visible:outline focus-visible:outline-4 ${
              segment.mistake?.type === "improvement"
                ? "focus-visible:outline-warning/30"
                : "focus-visible:outline-danger/30"
            }`}
            aria-label={`View feedback for: ${segment.text}`}
          >
            {segment.text}
            <span className="grammar-correction-popover" role="tooltip">
              <span
                className={`block font-display text-xs font-black uppercase ${
                  segment.mistake?.type === "improvement" ? "text-warning" : "text-danger"
                }`}
              >
                {segment.mistake?.type === "improvement" ? "Improvement" : "Correction"}
              </span>
              <span className="mt-2 block">
                <span className="font-display text-xs font-bold uppercase text-muted">Original</span>
                <span className="mt-1 block font-semibold text-text">{segment.mistake?.originalText || segment.text}</span>
              </span>
              {(segment.mistake?.correction || segment.mistake?.suggestedRevision) && (
                <span className="mt-2 block">
                  <span className="font-display text-xs font-bold uppercase text-muted">
                    {segment.mistake?.type === "improvement" ? "Better choice" : "Correction"}
                  </span>
                  <span className="mt-1 block font-black text-success">
                    {segment.mistake.correction || segment.mistake.suggestedRevision}
                  </span>
                </span>
              )}
              {segment.mistake?.explanation && (
                <span className="mt-2 block text-sm leading-6 text-muted">{segment.mistake.explanation}</span>
              )}
            </span>
          </button>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        )
      )}
    </p>
  );
};

export default GrammarHighlight;
