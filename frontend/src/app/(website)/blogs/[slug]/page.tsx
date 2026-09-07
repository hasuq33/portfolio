import { notFound, redirect } from "next/navigation";
import { getPublicBlog, publicBlogPath } from "@/lib/public-blogs";

type Props = { params: Promise<{ slug: string }> };

export default async function LegacyBlogDetailPage({ params }: Props) {
  const blog = await getPublicBlog((await params).slug);
  if (!blog) notFound();
  redirect(publicBlogPath(blog));
}
