import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { publicBlogImage, publicBlogPath, type PublicBlog } from "@/lib/public-blogs";

export function blogMetadata(blog: PublicBlog, origin?: string): Metadata {
  const canonical = `${origin ?? ""}${publicBlogPath(blog)}`;
  const image = blog.hasOgImage ? publicBlogImage(blog, "og-image") : blog.hasCoverImage ? publicBlogImage(blog) : undefined;
  const title = blog.metaTitle || blog.title;
  const description = blog.metaDescription || blog.excerpt;
  return {
    title, description, keywords: blog.metaKeywords,
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    alternates: { canonical },
    openGraph: { title, description, type: "article", url: canonical, publishedTime: blog.publishedAt, images: image ? [{ url: `${origin ?? ""}${image}`, alt: blog.title }] : [] },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [`${origin ?? ""}${image}`] : [] },
  };
}

export function BlogArticle({ blog }: { blog: PublicBlog }) {
  return <article className="min-h-screen bg-gray-50 px-4 py-24 dark:bg-gray-900 sm:px-8">
    <div className="mx-auto max-w-4xl">
      <Link href="/blogs" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← All articles</Link>
      {blog.categoryId && <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">{blog.categoryId.name}</p>}
      <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{blog.title}</h1>
      {blog.subtitle && <p className="mt-5 text-xl leading-relaxed text-gray-600 dark:text-gray-300">{blog.subtitle}</p>}
      {blog.publishedAt && <time dateTime={blog.publishedAt} className="mt-5 block text-sm text-gray-500 dark:text-gray-400">{new Date(blog.publishedAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>}
      {blog.hasCoverImage && <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
        <Image src={publicBlogImage(blog)} alt={blog.title} fill sizes="(max-width: 768px) 100vw, 896px" className="object-cover" priority />
      </div>}
      <div className="mt-10 break-words text-base leading-8 text-gray-800 dark:text-gray-200 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-5 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-200 [&_pre]:p-4 dark:[&_pre]:bg-gray-800 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-5 [&_img]:h-auto [&_img]:max-w-full [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:p-3 [&_th]:border [&_th]:p-3"
        dangerouslySetInnerHTML={{ __html: blog.contentHtml ?? "" }} />
    </div>
  </article>;
}
