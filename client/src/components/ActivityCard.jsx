import Card from "./Card";

const ActivityCard = ({ title, children, footer }) => (
  <Card className="p-5">
    {title && <h2 className="font-display text-2xl font-bold text-primary">{title}</h2>}
    <div className={title ? "mt-4" : ""}>{children}</div>
    {footer && <div className="mt-5 border-t border-border pt-4">{footer}</div>}
  </Card>
);

export default ActivityCard;
