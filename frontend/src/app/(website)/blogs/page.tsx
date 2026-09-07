import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Search, LayoutGrid, List } from "lucide-react";
import { getPublicCategories, publicBlogImage, publicBlogPath, searchPublicBlogs, websiteOrigin } from "@/lib/public-blogs";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const origin = await websiteOrigin();
  return { title: "Technology Blogs", description: "Articles on web development, backend systems, and ERP architecture.", alternates: { canonical: origin ? `${origin}/blogs` : "/blogs" } };
}
export default async function BlogsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search : "";
  const category = typeof query.category === "string" ? query.category : "";
  const page = typeof query.page === "string" ? query.page : "1";
  const view = query.view === "list" ? "list" : "cards";
  const params = new URLSearchParams({ search, category, page });
  const [result, categories] = await Promise.all([searchPublicBlogs(params), getPublicCategories()]);
  const href = (selectedCategory: string, selectedPage = 1, selectedView = view) => `/blogs?${new URLSearchParams({ search, category: selectedCategory, page: String(selectedPage), view: selectedView })}`;
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-24 transition dark:bg-gray-900 md:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
            <Image src="/assets/office.avif" alt="A workspace for ideas and technology" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" priority />
          </div>
          <div><h1 className="mb-4 text-4xl font-bold">Technology Blogs</h1><p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">Explore modern web development, backend systems, and scalable technologies written by Harshiv Joshi.</p></div>
        </div>
        <form action="/blogs" role="search" className="my-8 flex max-w-xl overflow-hidden rounded-full border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
          <input type="hidden" name="view" value={view} />
          {category && <input type="hidden" name="category" value={category} />}
          <label htmlFor="blog-search" className="sr-only">Search articles</label>
          <input id="blog-search" name="search" type="search" defaultValue={search} maxLength={200} placeholder="Search articles..." className="min-w-0 flex-1 bg-transparent px-5 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500" />
          <button type="submit" aria-label="Search articles" className="cursor-pointer border-l border-gray-300 bg-gray-100 px-5 hover:bg-gray-200 focus-visible:outline-2 dark:border-gray-600 dark:bg-gray-800"><Search size={20} /></button>
        </form>
        <nav aria-label="Blog categories" className="mb-8 flex gap-3 overflow-x-auto whitespace-nowrap pb-2">
          <Link href={href("")} aria-current={!category ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm ${!category ? "bg-blue-600 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}>All</Link>
          {(categories ?? []).map(item => <Link key={item._id} href={href(item.slug)} aria-current={category === item.slug ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm ${category === item.slug ? "bg-blue-600 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}>{item.name}</Link>)}
        </nav>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">{result?.total ?? 0} {(result?.total ?? 0) === 1 ? "article" : "articles"}</p>
          <nav aria-label="Blog display" className="inline-flex rounded-lg border border-gray-300 p-1 dark:border-gray-600">
            <Link href={href(category, Number(page) || 1, "cards")} aria-current={view === "cards" ? "page" : undefined} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm focus-visible:outline-2 ${view === "cards" ? "bg-blue-600 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}><LayoutGrid size={16} />Cards</Link>
            <Link href={href(category, Number(page) || 1, "list")} aria-current={view === "list" ? "page" : undefined} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm focus-visible:outline-2 ${view === "list" ? "bg-blue-600 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}><List size={16} />List</Link>
          </nav>
        </div>
        {search && <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">{result?.total ?? 0} results for “{search}”</p>}
        {result?.records.length ? <div className={view === "list" ? "flex flex-col gap-4" : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"}>
          {result.records.map(blog => <article key={blog._id} className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 ${view === "list" ? "sm:flex sm:items-start" : ""}`}>
            {blog.hasCoverImage && <Link href={publicBlogPath(blog)} tabIndex={-1} aria-hidden="true" className={`relative block aspect-[16/9] overflow-hidden ${view === "list" ? "shrink-0 sm:m-5 sm:w-56 sm:rounded-lg" : ""}`}>
              <Image src={publicBlogImage(blog)} alt={blog.title} fill sizes={view === "list" ? "(max-width: 640px) 100vw, 224px" : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"} className="object-cover" />
            </Link>}
            <div className="p-5">
              {blog.categoryId && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">{blog.categoryId.name}</p>}
              <h2 className="text-xl font-bold leading-snug"><Link href={publicBlogPath(blog)} className="hover:text-blue-600 focus-visible:outline-2">{blog.title}</Link></h2>
              {blog.subtitle && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{blog.subtitle}</p>}
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{blog.excerpt}</p>
              {blog.publishedAt && <time dateTime={blog.publishedAt} className="mt-4 block text-xs text-gray-500 dark:text-gray-400">{new Date(blog.publishedAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>}
            </div>
          </article>)}
        </div> : <div className="rounded-xl border border-dashed py-16 text-center"><h2 className="text-xl font-semibold">No articles found</h2><p className="mt-2 text-gray-600 dark:text-gray-400">Try another search or category, or check back for new articles.</p></div>}
        {result && result.total > result.limit && <nav aria-label="Blog pagination" className="mt-8 flex items-center justify-center gap-6">
          {result.page > 1 && <Link href={href(category, result.page - 1)} className="rounded-lg border px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-800">Previous</Link>}
          <span className="text-sm">Page {result.page} of {Math.ceil(result.total / result.limit)}</span>
          {result.page * result.limit < result.total && <Link href={href(category, result.page + 1)} className="rounded-lg border px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-800">Next</Link>}
        </nav>}
      </div>
    </div>
  );
}
