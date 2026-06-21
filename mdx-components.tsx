import type { MDXComponents } from "mdx/types";
import { mdxComponents } from "././lib/mdx-components";

/**
 * This file is required by Next.js for MDX support
 * It exports the MDX components used throughout your app
 * 
 * The components are defined in ./lib/mdx-components.tsx
 * Edit that file to customize your blog post styling
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
