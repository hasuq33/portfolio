import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { BlogArticle, blogMetadata } from "@/components/website/BlogArticle";
import { getPublicBlog, publicBlogPath, websiteOrigin } from "@/lib/public-blogs";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ categoryOrSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blog = await getPublicBlog((await params).categoryOrSlug);
  if (!blog) notFound();
  return blogMetadata(blog, await websiteOrigin());
}

export default async function BlogDetailPage({ params }: Props) {
  const { categoryOrSlug: slug } = await params;
  const blog = await getPublicBlog(slug);
  if (!blog) notFound();
  const canonical = publicBlogPath(blog);
  if (canonical !== `/blog/${slug}`) redirect(canonical);
  return <BlogArticle blog={blog} />;
}
