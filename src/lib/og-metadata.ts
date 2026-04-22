/**
 * Extracts Open Graph metadata from a URL by fetching the page HTML
 * and parsing <meta> tags server-side.
 */
export interface OgMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

export async function fetchOgMetadata(url: string): Promise<OgMetadata> {
  const result: OgMetadata = { title: null, description: null, image: null, siteName: null };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HackQubeBot/1.0)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return result;

    const html = await res.text();
    // Only parse the first 50KB to avoid memory issues
    const head = html.slice(0, 50_000);

    result.title = extractMeta(head, "og:title") || extractTag(head, "title");
    result.description = extractMeta(head, "og:description") || extractMeta(head, "description");
    result.image = extractMeta(head, "og:image");
    result.siteName = extractMeta(head, "og:site_name");
  } catch {
    // Silently fail — metadata is optional
  }

  return result;
}

function extractMeta(html: string, property: string): string | null {
  // Match both property="" and name="" variants
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(regex);
  if (match) return decodeHtmlEntities(match[1]);

  // Also check content before property (some sites reverse the order)
  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapeRegex(property)}["']`,
    "i"
  );
  const match2 = html.match(regex2);
  return match2 ? decodeHtmlEntities(match2[1]) : null;
}

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
  const match = html.match(regex);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
