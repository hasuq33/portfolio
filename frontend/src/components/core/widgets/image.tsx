"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";
import { WidgetProps } from "./types";

export const ImageWidget = ({ field, value, onChange, readonly, disabled, error, density = "comfortable", appearance }: WidgetProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(typeof value === "string" ? value : null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const maxSizeMb = field.imageMaxSizeMb ?? 2;
  const accept = field.imageAccept ?? "image/jpeg,image/png,image/webp,image/gif";

  useEffect(() => {
    if (typeof File !== "undefined" && value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setPreviewUrl(typeof value === "string" && value ? value : null);
  }, [value]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const acceptedTypes = accept.split(",").map((type) => type.trim());
    if (!acceptedTypes.includes(file.type)) {
      setValidationError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setValidationError(`Image must be ${maxSizeMb} MB or smaller.`);
      return;
    }

    setValidationError(null);
    onChange?.(file);
  };

  const removeImage = () => {
    setValidationError(null);
    onChange?.(null);
  };

  return (
    <FieldShell
      field={field}
      appearance={appearance}
      density={density}
      error={validationError || error}
      disabled={disabled}
    >
      <div className="group/avatar flex min-w-0 items-center gap-4">
  <div className="relative mb-1 mr-7 mt-1 shrink-0">
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full border border-border/60 ring-4 ring-background shadow-sm",
        appearance === "form"
          ? density === "compact"
            ? "size-16"
            : "size-20"
          : "size-24",
        previewUrl
          ? "bg-muted"
          : field.imageColorClassName ||
              "bg-primary text-primary-foreground",
      )}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`${field.label} preview`}
          className="size-full object-cover transition-transform duration-200 group-hover/avatar:scale-105"
          onError={() => setPreviewUrl(null)}
        />
      ) : field.imageFallback ? (
        <span
          className={cn(
            "font-semibold",
            density === "compact"
              ? "text-2xl"
              : "text-3xl",
          )}
          aria-label={`${field.imageFallback} avatar`}
        >
          {field.imageFallback
            .slice(0, 1)
            .toUpperCase()}
        </span>
      ) : (
        <ImageIcon className="size-7 opacity-70" />
      )}

      {!readonly && !disabled && (
        <>
          {/* Hover overlay */}
          <div
            className="
              pointer-events-none
              absolute inset-0
              bg-black/45
              opacity-0
              transition-opacity duration-200
              group-hover/avatar:opacity-100
              group-focus-within/avatar:opacity-100
            "
          />

          {/* Image actions */}
          <div
            className="
              absolute inset-0
              flex items-center justify-center gap-2
              opacity-0
              transition-all duration-200
              group-hover/avatar:opacity-100
              group-focus-within/avatar:opacity-100
            "
          >
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="
                size-8
                cursor-pointer
                rounded-full
                border border-white/20
                bg-black/55
                text-white
                shadow-sm
                backdrop-blur-sm
                hover:bg-black/75
                hover:text-white
              "
              onClick={() =>
                fileInputRef.current?.click()
              }
              title={
                previewUrl
                  ? "Change image"
                  : "Add image"
              }
              aria-label={
                previewUrl
                  ? "Change image"
                  : "Add image"
              }
            >
              <Pencil className="size-3.5" />
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="
                  size-8
                  cursor-pointer
                  rounded-full
                  border border-white/20
                  bg-black/55
                  text-white
                  shadow-sm
                  backdrop-blur-sm
                  hover:border-destructive/50
                  hover:bg-destructive
                  hover:text-destructive-foreground
                "
                onClick={removeImage}
                title="Delete image"
                aria-label="Delete image"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  </div>

  {!readonly && (
    <div className="min-w-0 text-xs leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground/75">
        {previewUrl
          ? `Change ${field.label.toLowerCase()}`
          : `Add ${field.label.toLowerCase()}`}
      </p>

      <p className="mt-0.5">
        JPEG, PNG, WebP or GIF
      </p>

      <p>Maximum {maxSizeMb} MB</p>
    </div>
  )}
</div>

      <input ref={fileInputRef} id={field.name} type="file" accept={accept} disabled={disabled} onChange={chooseFile} className="sr-only" />
    </FieldShell>
  );
};
