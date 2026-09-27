import { editorIconData } from "@/lib/editor-icon-data";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  if (!Object.prototype.hasOwnProperty.call(editorIconData, name)) {
    return new Response(null, { status: 404 });
  }

  const [width, path] = editorIconData[name as keyof typeof editorIconData];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 ${width} 512" fill="#64748b"><path d="${path}"/></svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
