"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useRef } from "react";
import { SearchIcon, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

interface ViewSearchInputBoxProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onEscape?: () => void;
}

export function ViewSearchInputBox({
  value = "",
  placeholder = "Search records...",
  onChange,
  onEscape,
}: ViewSearchInputBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      onEscape?.();
      inputRef.current?.blur();
    }
  };

  return (
    <InputGroup className="h-10 rounded-lg bg-background shadow-none">
      <InputGroupAddon align="inline-start">
        <SearchIcon className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        id="view-search-input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)}
        onKeyDown={handleKeyDown}
        className="h-10 text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Clear search" size="icon-xs" onClick={() => onChange?.("")}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      ) : (
        <InputGroupAddon align="inline-end">
          <kbd className="hidden border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">/</kbd>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
