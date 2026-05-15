import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "rounded-full px-5 py-2.5 text-sm font-semibold tracking-[-0.01em] transition focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50";
  const style =
    variant === "primary"
      ? "bg-brand text-white shadow-[0_18px_40px_rgba(21,18,13,0.18)] hover:bg-stone-800"
      : "border border-brand/15 bg-white/75 text-brand hover:bg-white";
  return <button className={`${base} ${style} ${className}`.trim()} {...props} />;
}
