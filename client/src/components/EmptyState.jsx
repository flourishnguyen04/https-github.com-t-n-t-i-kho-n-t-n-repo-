import { FileText } from "lucide-react";
import Card from "./Card";

const EmptyState = ({ title = "Nothing here yet", text = "Check back after more content is added." }) => (
  <Card className="p-6 text-center">
    <FileText aria-hidden="true" className="mx-auto mb-3 text-muted" size={28} />
    <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
  </Card>
);

export default EmptyState;
