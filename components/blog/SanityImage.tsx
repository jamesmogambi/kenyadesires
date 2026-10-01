import Image from "next/image";
import { isSanityCdnUrl, urlFor, urlSetFor } from "@/lib/sanity/client";

interface SanityImageProps {
  image: any;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  fallback?: string;
  quality?: number;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}

/** Widths offered to the browser for a Sanity asset. */
const CDN_WIDTHS = [480, 768, 1200, 1600];

const DEFAULT_SIZES = "(min-width: 768px) 33vw, 100vw";

export default function SanityImage({
  image,
  alt,
  className = "",
  width,
  height,
  priority = false,
  fill = false,
  sizes = DEFAULT_SIZES,
  fallback = "/og-default.jpg",
  quality = 75,
  loading,
  fetchPriority,
  ...props
}: SanityImageProps) {
  const cdnUrl = image ? urlFor(image, { quality }) : "";
  const isCdn = isSanityCdnUrl(cdnUrl);

  // ==================== SANITY CDN ====================
  // Rendered as a plain `<img>` rather than through `next/image`.
  //
  // The CDN already resizes and re-encodes on demand, so the optimizer would
  // re-download the asset, run sharp over it and re-serve the result: a second
  // full transfer for no gain. That extra server-side hop was the thing failing
  // — `next/image` logged `upstream image response timed out for
  // https://cdn.sanity.io/...` because the optimizer's own fetch of the CDN
  // outlived its internal timeout, so the image never rendered at all.
  //
  // A plain `<img>` is also the only way to emit a real `srcSet` here;
  // `next/image` does not forward one, so responsive widths were being dropped
  // and every viewport downloaded the full-size file.
  if (isCdn) {
    const resolvedLoading = loading ?? (priority ? "eager" : "lazy");

    return (
      <img
        src={cdnUrl}
        srcSet={urlSetFor(image, CDN_WIDTHS)}
        sizes={sizes}
        alt={alt || image?.alt || "Image"}
        width={fill ? undefined : width || 1200}
        height={fill ? undefined : height || 800}
        loading={resolvedLoading}
        // `priority` maps to high fetch priority, matching next/image's
        // behaviour for above-the-fold art.
        fetchPriority={fetchPriority ?? (priority ? "high" : "auto")}
        decoding={priority ? "sync" : "async"}
        className={
          fill
            ? `absolute inset-0 h-full w-full ${className || "object-cover"}`
            : className
        }
        {...(fill ? { style: { color: "transparent" } } : {})}
        {...props}
      />
    );
  }

  // ==================== LOCAL FALLBACK ====================
  // No CMS image resolved. This is a small local asset and the one guaranteed
  // to be reachable, so it still goes through the optimizer.
  if (!fallback) return null;

  return (
    <Image
      src={fallback}
      alt={alt || "Image"}
      fill={fill}
      width={!fill ? width || 1200 : undefined}
      height={!fill ? height || 800 : undefined}
      className={className}
      priority={priority}
      sizes={sizes}
      quality={quality}
      loading={loading}
      {...props}
    />
  );
}
