import "server-only";
import { cache } from "react";
import { headers } from "next/headers";

export interface PublicCategory { _id: string; name: string; slug: string; active?: boolean }
export interface PublicBlog {
  _id: string; title: string; subtitle?: string; slug: string; categoryId?: PublicCategory | null;
  contentHtml?: string; metaTitle?: string; metaDescription?: string; metaKeywords?: string[];
  publishedAt?: string; updatedAt?: string; hasCoverImage: boolean; hasOgImage: boolean; excerpt: string;
}
export interface PublicBlogSearch { records: PublicBlog[]; total: number; page: number; limit: number }
export const blogBackendUrl = () => {
  const base = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) throw new Error("The Blog backend URL is not configured.");
  return base.replace(/\/$/, "");
};
async function request<T>(path: string): Promise<T | null> {
  const response = await fetch(`${blogBackendUrl()}/public/blogs${path}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Blogs are temporarily unavailable.");
  return response.json() as Promise<T>;
}
export const getPublicBlog = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) return null;
  const blog = await request<PublicBlog>(`/${encodeURIComponent(slug)}`);
  // Reserved API paths (such as categories) must not be rendered as articles.
  return blog && !Array.isArray(blog) && typeof blog.title === "string" && blog.slug === slug ? blog : null;
});
export const getPublicCategories = () => request<PublicCategory[]>("/categories");
export const searchPublicBlogs = (params: URLSearchParams) => request<PublicBlogSearch>(`?${params}`);
export const publicBlogImage = (blog: PublicBlog, kind: "cover" | "og-image" = "cover") =>
  `/blog-images/${blog._id}/${kind}?v=${encodeURIComponent(blog.updatedAt ?? "")}`;
export const publicBlogPath = (blog: Pick<PublicBlog, "slug" | "categoryId">) =>
  blog.categoryId?.slug ? `/blog/${blog.categoryId.slug}/${blog.slug}` : `/blog/${blog.slug}`;

export async function websiteOrigin() {
  const configured = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured).origin;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!host) return undefined;
  const protocol = requestHeaders.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}
