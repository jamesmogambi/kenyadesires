import React from "react";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import Image from "next/image";

/**
 * Custom MDX components with shadcn/ui typography standards
 *
 * These components style your MDX content with beautiful, consistent typography.
 * Based on shadcn/ui design system: https://ui.shadcn.com/docs/components/typography
 *
 * Feel free to customize these styles to match your brand!
 */

const mdxComponents: MDXComponents = {
  // Headings - shadcn typography standards
  h1: ({ children }) => (
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h4>
  ),

  // Paragraphs and text
  p: ({ children }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
  ),

  // Blockquote - shadcn style
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
  ),

  // Code - inline and blocks
  code: ({ children, className }) => {
    const isInline = !className;

    if (isInline) {
      return (
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
          {children}
        </code>
      );
    }

    return <code className={className}>{children}</code>;
  },

  pre: ({ children }) => (
    <pre className="mb-4 mt-6 overflow-x-auto rounded-lg border bg-muted p-4">
      {children}
    </pre>
  ),

  // Links - enhanced for external URLs
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    return (
      <Link
        href={href as string}
        className="font-medium underline underline-offset-4"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </Link>
    );
  },

  // Images - optimized with Next.js
  img: ({ src, alt }) => (
    <span className="block my-8">
      <Image
        src={src as string}
        alt={(alt as string) || ""}
        width={1200}
        height={630}
        className="rounded-lg border w-full h-auto"
      />
    </span>
  ),

  // Tables - enhanced styling
  table: ({ children }) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full border border-muted rounded-lg overflow-hidden text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b last:border-none">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 font-semibold text-left bg-muted/30 text-muted-foreground border-b border-muted">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 align-top border-b border-muted">{children}</td>
  ),

  // Horizontal rule - shadcn style
  hr: () => <hr className="my-4 md:my-8" />,

  // Lead paragraph (for first paragraph styling)
  // Usage in MDX: <p className="lead">Your intro text</p>
  // Or define custom: Lead: ({ children }) => <p className="text-xl text-muted-foreground">{children}</p>
};

/**
 * This function is required by Next.js for MDX integration
 * It merges the default components with any custom ones you provide
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components, // Your custom components override defaults
  };
}

// Export for use with next-mdx-remote
export { mdxComponents };
