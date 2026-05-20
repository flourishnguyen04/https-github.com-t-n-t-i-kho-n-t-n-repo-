const Card = ({ children, className = "", as: Component = "div", ...props }) => (
  <Component className={`paper-panel liquid-box rounded-paper border border-border shadow-tactile ${className}`} {...props}>
    {children}
  </Component>
);

export default Card;
