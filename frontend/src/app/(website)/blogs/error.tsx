"use client";
export default function BlogError({ reset }: { reset: () => void }) {
  return <div className="min-h-[60vh] px-6 py-32 text-center"><h1 className="text-2xl font-bold">Articles are temporarily unavailable</h1><p className="mt-3 text-gray-500">Please try again in a moment.</p><button onClick={reset} className="mt-6 cursor-pointer rounded-lg border px-5 py-2 hover:bg-muted">Try again</button></div>;
}
