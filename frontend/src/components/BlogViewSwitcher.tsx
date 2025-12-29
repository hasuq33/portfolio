import { LayoutGrid, List } from "lucide-react";
import Link from 'next/link';

export const BlogViewSwitcher = ({ view }: { view: "grid" | "list" }) => {
  return (
    <div className="flex gap-2">
        <Link href="/blogs?display=grid"
            className={`p-2 rounded border ${view === "grid" ? "bg-gray-200 dark:bg-gray-800" : ""}`}
        >
            <LayoutGrid size={18} />
        </Link>

        <Link href="/blogs?display=list"
            className={`p-2 rounded border ${view === "list" ? "bg-gray-200 dark:bg-gray-800" : ""}`}
        >
            <List size={18} />
        </Link>
        </div>
  )
}