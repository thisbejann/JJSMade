import { useState, useRef, useEffect, useId, useCallback } from "react";
import { cn } from "../../lib/utils";

interface ComboboxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
}

export function Combobox({ label, value, onChange, options, placeholder, error }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const id = useId();
  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;
  const errorId = error ? `${id}-error` : undefined;

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  const selectOption = useCallback((opt: string) => {
    onChange(opt);
    setSearch(opt);
    setOpen(false);
    setActiveIndex(-1);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          selectOption(filtered[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const activeDescendant = activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open && filtered.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary placeholder:text-tertiary",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-150",
            error && "border-danger focus:ring-danger/40"
          )}
        />
        {open && filtered.length > 0 && (
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border-default bg-elevated shadow-xl z-50"
          >
            {filtered.map((opt, index) => (
              <div
                key={opt}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={opt === value}
                onClick={() => selectOption(opt)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer",
                  index === activeIndex
                    ? "bg-accent-muted text-accent"
                    : opt === value
                      ? "bg-accent-muted text-accent"
                      : "text-primary hover:bg-hover"
                )}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p id={errorId} className="text-xs text-danger">{error}</p>}
    </div>
  );
}
