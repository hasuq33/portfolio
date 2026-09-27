import { useEffect, useId, useState, type ReactNode } from "react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import type { HtmlEngine } from "./engine";

export type RunCommand = (command: (editor: HtmlEngine) => void) => void;
function useSelectionHold(editor: HtmlEngine) {
  const token = useId();
  useEffect(() => () => editor.selection.release(token), [editor, token]);
  return (open: boolean) =>
    open ? editor.selection.hold(token) : editor.selection.release(token);
}
export function ToolButton({
  label,
  active,
  children,
  onClick,
  disabled,
}: {
  label: string;
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={`size-8 shrink-0 cursor-pointer focus-visible:ring-2 ${active ? "bg-accent text-accent-foreground" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function ChoiceMenu({
  editor,
  owner,
  label,
  icon,
  value,
  options,
  onSelect,
}: {
  editor: HtmlEngine;
  owner: string;
  label: string;
  icon: ReactNode;
  value: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
}) {
  const hold = useSelectionHold(editor);
  return (
    <DropdownMenu modal={false} onOpenChange={hold}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title={`${label}: ${options.find((option) => option.value === value)?.label ?? value}`}
          aria-label={label}
          className="size-8 cursor-pointer"
          onMouseDown={(event) => event.preventDefault()}
        >
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-editor-ui={owner}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={() => editor.select(editor.range())}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onSelect}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="cursor-pointer"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ControlPopover({
  editor,
  owner,
  label,
  icon,
  children,
}: {
  editor: HtmlEngine;
  owner: string;
  label: string;
  icon: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hold = useSelectionHold(editor);
  const change = (next: boolean) => {
    hold(next);
    setOpen(next);
  };
  return (
    <Popover.Root open={open} onOpenChange={change}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title={label}
          aria-label={label}
          className="size-8 cursor-pointer"
          onMouseDown={(event) => event.preventDefault()}
        >
          {icon}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          data-editor-ui={owner}
          sideOffset={6}
          collisionPadding={8}
          aria-label={label}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={() => editor.select(editor.range())}
          className="z-[60] max-h-[min(24rem,70vh)] max-w-[calc(100vw-16px)] overflow-y-auto rounded-lg border bg-popover p-3 text-popover-foreground shadow-md"
          onKeyDown={(event) => {
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === "s"
            ) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          {children(() => change(false))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
