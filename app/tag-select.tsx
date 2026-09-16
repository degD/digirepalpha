"use client";

import { useEffect, useRef, useState } from "react";

interface TagSelectProps {
  id: string;
  label: string;
  options: string[];
  onSelect: (value: string) => void;
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function TagSelect({ id, label, options, onSelect }: TagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(value: string) {
    onSelect(value);
    setIsOpen(false);
  }

  return (
    <div className="relative mt-2" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:focus:ring-indigo-900"
        id={id}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {label}
        <ChevronIcon />
      </button>
      {isOpen && (
        <div
          aria-label={`${label} options`}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500">
              No tags yet
            </p>
          ) : (
            options.map((option) => (
              <button
                aria-selected={false}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
                key={option}
                onClick={() => handleSelect(option)}
                role="option"
                type="button"
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
