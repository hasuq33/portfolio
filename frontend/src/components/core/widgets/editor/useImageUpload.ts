import { useEffect, useRef, useState, type RefObject } from "react";
import { apiFetch } from "@/lib/orm_service";
import type { HtmlEngine } from "./engine";

export function useImageUpload(
  engine: RefObject<HtmlEngine | null>,
  revision: RefObject<number>,
  locked: boolean,
  onError: (message: string) => void,
) {
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false);
  const lockedRef = useRef(locked);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const upload = async (file: File) => {
    if (lockedRef.current || busy || !engine.current) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      ) ||
      file.size > 2 * 1024 * 1024
    ) {
      onError("Choose JPEG, PNG, WebP or GIF, maximum 2 MB.");
      return;
    }
    const editor = engine.current,
      insertion = editor.range(),
      startedAt = revision.current;
    setBusy(true);
    onError("");
    try {
      const payload = new FormData();
      payload.append("file", file);
      const response = await apiFetch({
        url: "/attachments/images",
        method: "POST",
        payload,
        suppressGlobalError: true,
      });
      if (!response?.ok) {
        const body = (await response?.json().catch(() => null)) as {
          message?: string | string[];
        } | null;
        throw Error(
          Array.isArray(body?.message)
            ? body.message.join(" ")
            : body?.message || "Image upload failed. Please try again.",
        );
      }
      const attachment = (await response.json()) as {
        url: string;
        width?: number;
        height?: number;
      };
      if (
        !mounted.current ||
        revision.current !== startedAt ||
        lockedRef.current ||
        engine.current !== editor
      )
        return;
      if (!/^\/editor-media\/[a-f\d]{24}$/.test(attachment.url))
        throw Error("The server returned an invalid image URL.");
      const image = document.createElement("img");
      image.src = attachment.url;
      image.alt = file.name.replace(/\.[^.]+$/, "");
      if (attachment.width) image.width = attachment.width;
      if (attachment.height) image.height = attachment.height;
      const figure = document.createElement("figure");
      figure.append(image);
      editor.select(insertion);
      editor.insertBlock(figure);
    } catch (cause) {
      if (mounted.current && revision.current === startedAt)
        onError(
          cause instanceof Error ? cause.message : "Image upload failed.",
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return { busy, upload };
}
