import { forwardRef } from "react";

const variants = {
  primary: "bg-primary text-white border-primary hover:bg-black",
  secondary: "bg-secondary text-primary border-secondary hover:bg-violet-300",
  outline: "bg-surface text-primary border-border hover:border-primary",
  ghost: "bg-transparent text-primary border-transparent hover:bg-paperSoft",
  danger: "bg-danger text-white border-danger hover:bg-red-700",
  success: "bg-success text-white border-success hover:bg-green-700"
};

const sizes = {
  sm: "px-3.5 py-2.5 text-base",
  md: "px-4 py-3 text-base",
  lg: "px-5 py-3.5 text-lg"
};

const Button = forwardRef(
  ({ as: Component = "button", children, className = "", variant = "primary", size = "md", ...props }, ref) => (
    <Component
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-paper border font-display font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
);

Button.displayName = "Button";

export default Button;
