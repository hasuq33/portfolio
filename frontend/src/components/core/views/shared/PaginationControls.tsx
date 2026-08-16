"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  offset: number;
  limit: number;
  total: number;
  onOffsetChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
}

export function PaginationControls({
  offset,
  limit,
  total,
  onOffsetChange,
  onLimitChange,
  limitOptions = [12, 24, 48, 100],
}: PaginationControlsProps) {
  const pageCount = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(Math.floor(offset / limit) + 1, pageCount);
  const firstRecord = total ? offset + 1 : 0;
  const lastRecord = Math.min(offset + limit, total);

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{firstRecord}-{lastRecord}</span> of <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="records-per-page" className="text-sm text-muted-foreground">Rows per page</label>
        <select
          id="records-per-page"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          className="h-9 cursor-pointer rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
        >
          {limitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <span className="min-w-24 text-center text-sm text-muted-foreground">Page {currentPage} of {pageCount}</span>
        <Button variant="outline" size="icon-sm" disabled={offset <= 0} onClick={() => onOffsetChange(Math.max(offset - limit, 0))} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon-sm" disabled={offset + limit >= total} onClick={() => onOffsetChange(offset + limit)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
