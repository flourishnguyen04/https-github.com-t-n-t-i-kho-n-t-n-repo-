import { Lock } from "lucide-react";

const LockBadge = ({ label = "Locked" }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-paperSoft px-3 py-1 text-xs font-semibold text-muted">
    <Lock aria-hidden="true" size={14} />
    {label}
  </span>
);

export default LockBadge;
