import { useState, useRef, useEffect, useId, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

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

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const activeDescendant = activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && (
        <Label htmlFor={inputId} className="text-sm text-muted-foreground">
          {label}
        </Label>
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
            "h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground",
            "outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
          )}
        />
        {open && filtered.length > 0 && (
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-3xl bg-popover/70 shadow-lg ring-1 ring-foreground/10 z-50 backdrop-blur-2xl p-1.5"
          >
            {filtered.map((opt, index) => (
              <div
                key={opt}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={opt === value}
                onClick={() => selectOption(opt)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-2xl transition-colors cursor-pointer",
                  index === activeIndex
                    ? "bg-foreground/10 text-foreground"
                    : opt === value
                      ? "bg-foreground/10 text-foreground"
                      : "text-foreground hover:bg-foreground/5"
                )}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
