import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { HtmlEngine } from "./engine";

export function LinkEditor({
  editor,
  owner,
  onClose,
}: {
  editor: HtmlEngine;
  owner: string;
  onClose: () => void;
}) {
  const link = editor.state().link;
  const [url, setUrl] = useState(link?.getAttribute("href") ?? "");
  const [title, setTitle] = useState(link?.title ?? "");
  const [newTab, setNewTab] = useState(link?.target === "_blank");
  const [error, setError] = useState("");
  const save = () => {
    try {
      editor.link(url, { title, newTab });
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The link could not be saved.",
      );
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        data-editor-ui={owner}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          editor.select(editor.range());
          editor.selection.release();
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            event.target instanceof HTMLInputElement &&
            event.target.type !== "checkbox"
          ) {
            event.preventDefault();
            event.stopPropagation();
            save();
          }
          if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "s"
          ) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{link ? "Edit link" : "Add link"}</DialogTitle>
          <DialogDescription>
            Use a website URL, email link, or relative page address.
          </DialogDescription>
        </DialogHeader>
        <label className="text-sm">
          URL
          <input
            autoFocus
            aria-label="Link URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            className="mt-1 w-full rounded border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Title (optional)
          <input
            aria-label="Link title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={300}
            className="mt-1 w-full rounded border bg-background px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={newTab}
            onChange={(event) => setNewTab(event.target.checked)}
          />
          Open in new tab
        </label>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-between">
          {link ? (
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                editor.unlink();
                onClose();
              }}
            >
              Remove link
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" className="cursor-pointer" onClick={save}>
            Save link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
