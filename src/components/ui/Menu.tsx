"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface MenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}

export function Menu({ trigger, children, align = "right" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={`absolute top-full z-20 mt-1.5 min-w-[168px] overflow-hidden rounded-lg border border-slate-100 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3.5 py-2 text-left text-sm transition-colors hover:bg-offwhite-300 ${
        danger ? "text-red-600" : "text-navy-500"
      }`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  onClick,
  tone = "light",
  label,
  children,
}: {
  onClick?: () => void;
  tone?: "light" | "dark";
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        tone === "dark"
          ? "text-slate-300 hover:bg-white/10 hover:text-offwhite-500"
          : "text-slate-500 hover:bg-offwhite-300 hover:text-navy-500"
      }`}
    >
      {children}
    </button>
  );
}
