import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import "@/components/core/widgets/editor/rich-content.css";
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
      <div className="rich-content mt-10"
        dangerouslySetInnerHTML={{ __html: blog.contentHtml ?? "" }} />
    </div>
  </article>;
}
