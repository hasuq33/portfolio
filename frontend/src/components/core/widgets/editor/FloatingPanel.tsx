import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function FloatingPanel({
  rect,
  owner,
  children,
  label,
  below = false,
  className = "",
}: {
  rect: DOMRect;
  owner: string;
  children: ReactNode;
  label: string;
  below?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  useLayoutEffect(() => {
    const place = () => {
      const size = ref.current?.getBoundingClientRect();
      const width = size?.width || 300,
        height = size?.height || 48;
      const above = (rect.top ?? rect.bottom) - height - 8;
      const top = !below && above >= 8 ? above : rect.bottom + 8;
      setPosition({
        left: Math.max(
          8,
          Math.min(
            rect.left + (rect.width || 0) / 2 - width / 2,
            window.innerWidth - width - 8,
          ),
        ),
        top: Math.max(8, Math.min(top, window.innerHeight - height - 8)),
      });
    };
    place();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    if (ref.current) observer?.observe(ref.current);
    return () => observer?.disconnect();
  }, [rect, below]);
  return createPortal(
    <div
      ref={ref}
      data-editor-ui={owner}
      role="toolbar"
      aria-label={label}
      style={position}
      className={`fixed z-50 max-w-[calc(100vw-16px)] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
