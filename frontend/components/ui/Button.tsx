import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-body font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded",
          {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2.5 text-sm",
            lg: "px-6 py-3 text-base",
          }[size],
          {
            primary: "bg-ledger text-paper hover:bg-ledger-dark",
            secondary: "bg-transparent text-ink border border-ink/20 hover:border-ink/40 hover:bg-ink/[0.03]",
            ghost: "bg-transparent text-ink-soft hover:bg-ink/[0.04]",
            danger: "bg-transparent text-rust border border-rust/30 hover:bg-rust-light",
          }[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
