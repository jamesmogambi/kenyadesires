import { createClient, type ClientConfig } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url"; // ✅ Named import

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-06-01";

if (!projectId || !dataset) {
  throw new Error("Missing Sanity environment variables");
}

const config: ClientConfig = {
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
  timeout: 15000,
  maxRetries: 3,
};

export const client = createClient(config);

// ✅ Use the named builder
const builder = createImageUrlBuilder(client);

const SANITY_CDN_HOST = "cdn.sanity.io";

/**
 * Whether a URL is served by Sanity's image CDN.
 *
 * These assets are already resized and re-encoded on demand by the CDN, so
 * running them through the `next/image` optimizer re-downloads the original,
 * re-encodes it with sharp and re-serves it — a second full transfer that adds
 * nothing. On this host's route to Sanity that extra hop is exactly what was
 * failing: `next/image` logged `upstream image response timed out for
 * https://cdn.sanity.io/...` because the optimizer's own server-side fetch of
 * the CDN outlived its timeout. Letting the browser hit the CDN directly
 * removes that hop entirely.
 */
export function isSanityCdnUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === SANITY_CDN_HOST;
  } catch {
    return false;
  }
}

/**
 * Build a Sanity image URL.
 *
 * `auto("format")` lets the CDN negotiate WebP/AVIF per request, and the
 * explicit width/quality do the resizing and compression that would otherwise
 * be the optimizer's job.
 */
export function urlFor(
  source: any,
  options: { width?: number; quality?: number } = {},
): string {
  if (!source) return "";

  const { width = 1200, quality = 75 } = options;

  return builder
    .image(source)
    .auto("format")
    .width(width)
    .quality(quality)
    .url();
}

/**
 * Widths offered to the browser for a Sanity asset.
 *
 * Without this a bypassed image would download one fixed-width file for every
 * viewport. Tailwind's `sizes` then picks the smallest candidate that covers the
 * rendered box, so phones fetch a small file and desktops a large one.
 */
export function urlSetFor(
  source: any,
  widths: number[] = [480, 768, 1200, 1600],
): string | undefined {
  if (!source) return undefined;

  const unique = [...new Set(widths)].sort((a, b) => a - b);

  return unique
    .map((width) => `${urlFor(source, { width })} ${width}w`)
    .join(", ");
}

// Helper to get image dimensions
export function getImageDimensions(source: any) {
  return builder.image(source).auto("format").width(1200).height(800);
}
