"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldShell, getFieldErrorId, getFieldHelpId } from "./FieldShell";
import { WidgetProps } from "./types";

export function CoverImageWidget({ field, value, onChange, readonly, disabled, error, density, appearance }: WidgetProps) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string>();
  const maxSize = field.imageMaxSizeMb ?? 2;
  const accept = field.imageAccept ?? "image/jpeg,image/png,image/webp,image/gif";
  useEffect(() => {
    setLocalError(undefined);
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(typeof value === "string" && value ? value : null);
  }, [value]);
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || readonly || disabled) return;
    if (!accept.split(",").map(type => type.trim()).includes(file.type)) {
      setLocalError("Choose a JPEG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      setLocalError(`Image must be ${maxSize} MB or smaller.`);
      return;
    }
    setLocalError(undefined);
    onChange?.(file);
  };
  const message = localError || error;
  return <FieldShell field={field} error={message} disabled={disabled} density={density} appearance={appearance}>
    <div className={density === "compact" ? "w-full max-w-sm" : "w-full max-w-lg"}>
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/40">
        {preview ? <img src={preview} alt={`${field.label} preview`} className="absolute inset-0 h-full w-full object-contain"
          onError={() => { setPreview(null); setLocalError("Image preview could not be loaded. You can replace or remove it."); }} />
          : <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><ImagePlus className="size-8" /><span>No {field.label.toLowerCase()}</span></div>}
      </div>
      {!readonly && <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} className="cursor-pointer" onClick={() => input.current?.click()}>
          {value ? <Pencil /> : <ImagePlus />}{value ? "Change image" : "Upload image"}
        </Button>
        {value && <Button type="button" variant="ghost" size="sm" disabled={disabled} className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => { setLocalError(undefined); onChange?.(null); }}><Trash2 />Remove</Button>}
        <p className="w-full text-xs text-muted-foreground">JPEG, PNG, WebP or GIF · Maximum {maxSize} MB · Landscape recommended</p>
      </div>}
    </div>
    <input ref={input} id={field.name} type="file" className="sr-only" accept={accept} disabled={readonly || disabled}
      aria-invalid={Boolean(message)} aria-describedby={message ? getFieldErrorId(field.name) : field.helpText ? getFieldHelpId(field.name) : undefined} onChange={choose} />
  </FieldShell>;
}
