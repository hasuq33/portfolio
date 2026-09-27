import { Sparkles } from "lucide-react";
import { ControlPopover } from "./EditorControls";
import type { HtmlEngine } from "./engine";
export const AI_ACTIONS = [
  "Improve Writing",
  "Rewrite",
  "Make Shorter",
  "Make Longer",
  "Fix Grammar",
  "Change Tone",
  "Translate",
  "Generate Similar Text",
];
export function AiActions({
  editor,
  owner,
}: {
  editor: HtmlEngine;
  owner: string;
}) {
  return (
    <ControlPopover
      editor={editor}
      owner={owner}
      label="AI writing tools"
      icon={<Sparkles className="size-4" />}
    >
      {() => (
        <div className="w-52">
          <p className="mb-2 text-xs text-muted-foreground">
            Coming soon — no AI service connected.
          </p>
          {AI_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              disabled
              className="block w-full rounded px-2 py-1.5 text-left text-sm opacity-60"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </ControlPopover>
  );
}
