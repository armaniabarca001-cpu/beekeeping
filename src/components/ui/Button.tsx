"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";
type Tone = "light" | "dark";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
};

const VARIANTS: Record<Tone, Record<Variant, string>> = {
  light: {
    primary: "bg-honey-500 text-navy-500 hover:bg-honey-300",
    secondary:
      "border border-slate-200 bg-white text-navy-500 hover:border-slate-300 hover:bg-offwhite-300",
    ghost: "text-slate-500 hover:text-navy-500 hover:bg-offwhite-300",
    danger: "text-red-600 hover:bg-red-50",
  },
  dark: {
    primary: "bg-honey-500 text-navy-500 hover:bg-honey-300",
    secondary:
      "border border-white/15 text-offwhite-500 hover:border-white/30 hover:bg-white/5",
    ghost: "text-slate-300 hover:text-offwhite-500 hover:bg-white/5",
    danger: "text-red-400 hover:bg-red-500/10",
  },
};

interface CommonProps {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  className?: string;
  children: ReactNode;
}

interface ButtonAsButton
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: undefined;
}

interface ButtonAsLink extends CommonProps {
  href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "secondary",
  tone = "light",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const cls = `${BASE} ${SIZES[size]} ${VARIANTS[tone][variant]} ${className}`;

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={cls}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;
  return (
    <button type="button" className={cls} {...buttonRest}>
      {children}
    </button>
  );
}
