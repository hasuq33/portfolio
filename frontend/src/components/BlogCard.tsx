'use client';
import Image from "next/image";
import { useRef } from "react";

export function BlogCard({ view , className }: { view: "grid" | "list" ,className:string}) {
  const cardsRef = useRef<HTMLDivElement>(null);
    
  return (
    <div
     ref={cardsRef} className={`rounded-xl border p-4 transition
        ${view === "list" ? "flex gap-6 flex-col md:flex-row col-span-12" : "md:col-span-6 lg:col-span-4 xl:col-span-3 col-span-12"} ${className}
      `}
    >
      <Image
        src="/assets/office.avif"
        alt="Blog"
        width={view === "list" ? 220 : 400}
        height={200}
        className={`rounded-lg object-cover ${view === 'list' && 'w-full md:w-auto lg:w-auto' || 'w-full'}`}
      />

      <div>
        <h3 className="text-lg font-semibold mt-3 md:mt-0">
          Building Scalable Backend with NestJS
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
          Learn how to design scalable APIs using NestJS and MongoDB.
        </p>

        <div className="mt-3 text-sm text-blue-600">
          Read more →
        </div>
      </div>
    </div>
  );
}
