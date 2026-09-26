/**
 * components/seo/JsonLd.tsx
 *
 * Renders a single Schema.org JSON-LD `@graph` document.
 *
 * Why one graph per page: answer engines merge JSON-LD nodes far more
 * reliably when they are linked by explicit `@id` in a single document.
 * Several disconnected scripts on one page get parsed as unrelated
 * fragments.
 *
 * The `<` escape is required. Escorting directories surface provider
 * bios verbatim from the database, and an unescaped `</script>` or `<`
 * inside a bio would otherwise break out of the script element and
 * produce invalid JSON that Google discards. Escaping makes any such text
 * data-only instead of markup.
 */

import { jsonLdGraph, type JsonLdNode } from "@/lib/aeo/schema";

interface JsonLdProps {
  /** Nodes to place in the `@graph`. */
  nodes: JsonLdNode[];
  /** Optional pre-built document, used when a node set is already wrapped. */
  data?: unknown;
}

/** Escapes a JSON string so it is safe inside an HTML <script> element. */
function escapeForScript(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export default function JsonLd({ nodes, data }: JsonLdProps) {
  const document = data ?? jsonLdGraph(nodes);
  const json = JSON.stringify(document);

  // An empty graph is worse than none — it ships a parse error to the
  // validator for no benefit.
  if (!json || json === "{}" || json === '{"@context":"https://schema.org","@graph":[]}') {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      // Content is JSON.stringify output, escaped for HTML context above.
      dangerouslySetInnerHTML={{ __html: escapeForScript(json) }}
    />
  );
}
