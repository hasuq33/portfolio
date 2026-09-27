import { cookies } from "next/headers";
import { blogBackendUrl } from "@/lib/public-blogs";

export const runtime = "nodejs";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return new Response(null, { status: 404, headers });

  try {
    const base = blogBackendUrl();
    let response = await fetch(`${base}/public/attachments/images/${id}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    // Public images need no credentials. Drafts require normal Blog read access.
    if (response.status === 404) {
      const token = (await cookies()).get("access_token")?.value;
      if (token) {
        response = await fetch(`${base}/attachments/images/${id}`, {
          headers: { Cookie: `access_token=${encodeURIComponent(token)}` },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });
      }
    }

    if (!response.ok) {
      return new Response(null, {
        status: [401, 403, 404].includes(response.status) ? 404 : 502,
        headers,
      });
    }
    if (response.headers.get("content-type")?.split(";")[0] !== "image/webp") {
      return new Response(null, { status: 502, headers });
    }
    return new Response(response.body, {
      headers: { ...headers, "Content-Type": "image/webp" },
    });
  } catch {
    return new Response(null, { status: 502, headers });
  }
}
