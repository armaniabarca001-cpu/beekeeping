"use client";

import { useEffect, useRef, useState } from "react";
import type { GeocodeSuggestion } from "@/app/api/geocode/route";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: GeocodeSuggestion) => void;
}

export function AddressAutocomplete({ value, onChange, onSelect }: AddressAutocompleteProps) {
  const [result, setResult] = useState<{ query: string; suggestions: GeocodeSuggestion[] } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressNextSearchRef = useRef(false);

  const suggestions = value.trim().length < 3 || result?.query !== value ? [] : result.suggestions;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      return;
    }
    if (value.trim().length < 3) return;
    debounceRef.current = setTimeout(() => {
      fetch(`/api/geocode?q=${encodeURIComponent(value)}`)
        .then((res) => res.json())
        .then((data) => {
          setResult({ query: value, suggestions: data.suggestions ?? [] });
          setOpen(true);
        });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="123 Main St, Springfield"
        className="w-full rounded-lg border border-slate-100 bg-white px-4 py-2 outline-none focus:border-honey-500"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-slate-100 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  suppressNextSearchRef.current = true;
                  onChange(s.label);
                  onSelect(s);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-offwhite-300"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
