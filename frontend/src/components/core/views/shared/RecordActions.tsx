"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ModelRecordAction } from "./model-view-config";

export function RecordActions({
  actions,
  disabled,
  dirty,
  onRun,
}: {
  actions: ModelRecordAction[];
  disabled: boolean;
  dirty: boolean;
  onRun: (action: ModelRecordAction, reason: string) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<ModelRecordAction>();
  const [reason, setReason] = useState("");
  return (
    <>
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || dirty}
          title={dirty ? "Save or discard your changes first" : action.label}
          className="cursor-pointer"
          onClick={() => {
            setReason("");
            setSelected(action);
          }}
        >
          {action.label}
        </Button>
      ))}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !disabled) setSelected(undefined);
        }}
      >
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>{selected?.label}</DialogTitle>
            <DialogDescription>{selected?.confirmation}</DialogDescription>
          </DialogHeader>
          {selected?.reasonField && (
            <div className="space-y-2">
              <label
                htmlFor="record-action-reason"
                className="text-sm font-medium"
              >
                {selected.reasonField.label} (optional)
              </label>
              <textarea
                id="record-action-reason"
                maxLength={2000}
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={disabled}
                className="w-full rounded-md border bg-background p-3 text-sm"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => setSelected(undefined)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={selected?.destructive ? "destructive" : "default"}
              disabled={disabled || dirty}
              onClick={async () => {
                if (selected && (await onRun(selected, reason)))
                  setSelected(undefined);
              }}
            >
              {disabled ? "Working..." : selected?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
