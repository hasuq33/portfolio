import { blogBackendUrl } from "@/lib/public-blogs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (!/^[a-f\d]{24}$/i.test(id) || !["cover", "og-image"].includes(kind)) return new Response(null, { status: 404 });
  const response = await fetch(`${blogBackendUrl()}/public/blogs/images/${id}/${kind}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) return new Response(null, { status: response.status === 404 ? 404 : 502 });
  return new Response(response.body, { headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
