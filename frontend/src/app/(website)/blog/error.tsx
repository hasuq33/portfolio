"use client";

import Link from "next/link";

export default function BlogError({ reset }: { reset: () => void }) {
  return <section className="min-h-[65vh] px-6 py-32 text-center">
    <h1 className="text-3xl font-bold">This blog could not be loaded</h1>
    <p className="mt-3 text-gray-600 dark:text-gray-300">Please try again, or explore other blogs on the main Blog page.</p>
    <div className="mt-7 flex flex-wrap justify-center gap-3">
      <button onClick={reset} className="cursor-pointer rounded-lg border px-5 py-3 text-sm hover:bg-muted">Try again</button>
      <Link href="/blogs" className="rounded-lg bg-blue-600 px-5 py-3 text-sm text-white hover:bg-blue-700">Explore other blogs</Link>
    </div>
  </section>;
}
