import { X } from "lucide-react";
import Button from "./Button";

const Modal = ({ isOpen, title, children, onClose, actionLabel = "Close" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 px-4 py-6">
      <div
        className="paper-panel w-full max-w-md rounded-paper border border-border p-6 shadow-paper"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="font-display text-2xl font-bold text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-paper border border-border bg-surface p-2 text-muted transition hover:text-primary"
            aria-label="Close modal"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="text-sm leading-6 text-muted">{children}</div>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose} variant="secondary">
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
