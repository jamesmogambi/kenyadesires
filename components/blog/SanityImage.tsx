import Image from "next/image";
import { urlFor } from "@/lib/sanity/client";

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
}

export default function SanityImage({
  image,
  alt,
  className = "",
  width,
  height,
  priority = false,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fallback = "/og-default.jpg",
  quality = 75,
  ...props
}: SanityImageProps) {
  // ✅ If no image, show fallback
  if (!image) {
    if (fallback) {
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
          {...props}
        />
      );
    }
    return null;
  }

  // ✅ Get image URL from Sanity
  const imageUrl = urlFor(image);

  if (!imageUrl) {
    if (fallback) {
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
          {...props}
        />
      );
    }
    return null;
  }

  // ✅ Render with fill
  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={alt || image.alt || "Image"}
        fill
        className={`object-cover ${className}`}
        priority={priority}
        sizes={sizes}
        quality={quality}
        {...props}
      />
    );
  }

  // ✅ Render with width/height
  const imgWidth = width || 1200;
  const imgHeight = height || 800;

  return (
    <Image
      src={imageUrl}
      alt={alt || image.alt || "Image"}
      width={imgWidth}
      height={imgHeight}
      className={className}
      priority={priority}
      sizes={sizes}
      quality={quality}
      {...props}
    />
  );
}
