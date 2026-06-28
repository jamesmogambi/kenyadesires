import { PortableText as PortableTextComponent } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import SanityImage from "./SanityImage";
import React from "react";

interface PortableTextProps {
  content: PortableTextBlock[];
}

// ============================================
// HELPER: Wrap numbers in a span with rounded border
// ============================================
function wrapNumbersInSpan(text: string): React.ReactNode {
  if (!text) return text;

  const parts = text.split(/(\d+)/);

  return parts.map((part, index) => {
    if (/^\d+$/.test(part)) {
      return (
        <span
          key={`num-${index}`}
          className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full border-2 border-primary text-primary font-bold mx-0.5"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

// ============================================
// HELPER: Process children and wrap numbers
// ============================================
function processChildren(children: any): any {
  if (!children) return children;

  // Handle string - wrap numbers
  if (typeof children === "string") {
    return wrapNumbersInSpan(children);
  }

  // Handle array - process each item
  if (Array.isArray(children)) {
    return children.map((child) => processChildren(child));
  }

  // Handle React elements - don't process them, return as-is
  if (React.isValidElement(children)) {
    return children;
  }

  // Handle objects (like Sanity text spans)
  if (typeof children === "object" && children !== null) {
    // Check if it's a Sanity text span with 'text' property
    if (children.text !== undefined) {
      // Create a new object with processed text
      return {
        ...children,
        text: wrapNumbersInSpan(children.text),
      };
    }

    // For other objects, return as-is to avoid React element issues
    return children;
  }

  return children;
}

// ============================================
// HELPER: Create heading with number styling
// ============================================
function createHeading(level: "h1" | "h2" | "h3" | "h4", className: string) {
  return function Heading({ children }: any) {
    // Process children but keep React elements intact
    let processedChildren = children;

    // Only process if it's a string or array of strings
    if (typeof children === "string") {
      processedChildren = wrapNumbersInSpan(children);
    } else if (Array.isArray(children)) {
      processedChildren = children.map((child) => {
        if (typeof child === "string") {
          return wrapNumbersInSpan(child);
        }
        return child;
      });
    }

    const HeadingTag = level;
    return <HeadingTag className={className}>{processedChildren}</HeadingTag>;
  };
}

const components = {
  types: {
    image: ({ value }: any) => {
      // Get image dimensions from Sanity
      const dimensions = value?.asset?.metadata?.dimensions;
      const isPortrait = dimensions && dimensions.height > dimensions.width;

      // Determine appropriate sizing
      const imageWidth = isPortrait ? 600 : 800;
      const imageHeight = isPortrait ? 800 : 500;

      return (
        <figure className="my-8 w-full max-w-full">
          <div className="relative w-full">
            <SanityImage
              image={value}
              alt={value?.alt || "Article image"}
              width={imageWidth}
              height={imageHeight}
              className="w-full h-auto rounded-none shadow-md"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
              priority={false}
            />
            {value?.caption && (
              <figcaption className="mt-3 text-center text-sm text-white/60">
                {value.caption}
              </figcaption>
            )}
          </div>
        </figure>
      );
    },
  },

  block: {
    h1: createHeading("h1", "text-3xl text-primary font-bold my-6"),
    h2: createHeading("h2", "text-2xl text-primary font-bold my-5"),
    h3: createHeading("h3", "text-xl text-primary font-bold my-4"),
    h4: createHeading("h4", "text-lg text-primary font-bold my-3"),
    normal: ({ children }: any) => {
      // Only process if it's a string
      const processed =
        typeof children === "string" ? wrapNumbersInSpan(children) : children;
      return (
        <p className="my-4 antialiased leading-relaxed text-white/80 font-medium text-lg">
          {processed}
        </p>
      );
    },
    blockquote: ({ children }: any) => {
      const processed =
        typeof children === "string" ? wrapNumbersInSpan(children) : children;
      return (
        <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-white/80">
          {processed}
        </blockquote>
      );
    },
  },

  list: {
    bullet: ({ children }: any) => (
      <ul className="space-y-1 my-4 list-none">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside text-lg font-medium space-y-2 my-4 text-white/80">
        {children}
      </ol>
    ),
  },

  listItem: {
    bullet: ({ children }: any) => {
      const processed =
        typeof children === "string" ? wrapNumbersInSpan(children) : children;
      return (
        <li className="flex items-center  gap-1.5 text-white/80">
          <span className="text-primary text-4xl font-extrabold shrink-0">
            •
          </span>
          <span className="text-lg  font-medium">{processed}</span>
        </li>
      );
    },
    number: ({ children }: any) => {
      const processed =
        typeof children === "string" ? wrapNumbersInSpan(children) : children;
      return <li className="text-white/80 text-lg">{processed}</li>;
    },
  },

  marks: {
    link: ({ children, value }: any) => {
      const processed =
        typeof children === "string" ? wrapNumbersInSpan(children) : children;
      return (
        <a
          href={value.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {processed}
        </a>
      );
    },
    strong: ({ children }: any) => {
      const processed =
        typeof children === "string" ? wrapNumbersInSpan(children) : children;
      return <strong className="font-bold">{processed}</strong>;
    },
    em: ({ children }: any) => {
      const processed =
        typeof children === "string" ? wrapNumbersInSpan(children) : children;
      return <em className="italic">{processed}</em>;
    },
  },
};

export default function PortableText({ content }: PortableTextProps) {
  if (!content) return null;
  return <PortableTextComponent value={content} components={components} />;
}
