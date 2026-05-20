import Card from "./Card";

const FeedbackCard = ({ title, children, accent = "border-border" }) => (
  <Card className={`p-5 ${accent}`}>
    <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
    <div className="mt-3 text-sm leading-6 text-muted">{children}</div>
  </Card>
);

export default FeedbackCard;
