import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function BlogNotFound() {
  return <section className="flex min-h-[65vh] flex-col items-center justify-center px-6 py-28 text-center">
    <BookOpen aria-hidden="true" className="mb-5 size-10 text-muted-foreground" />
    <h1 className="text-3xl font-bold">Blog not found</h1>
    <p className="mt-3 max-w-md text-gray-600 dark:text-gray-300">This article may have moved, been unpublished, or no longer exist.</p>
    <Link href="/blogs" className="mt-7 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4">Explore other blogs</Link>
  </section>;
}
