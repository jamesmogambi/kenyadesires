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
  timeout: 10000,
};

export const client = createClient(config);

// ✅ Use the named builder
const builder = createImageUrlBuilder(client);

export function urlFor(source: any): string {
  if (!source) return "";
  return builder.image(source).url();
}

// Helper to get image dimensions
export function getImageDimensions(source: any) {
  return builder.image(source).width(1200).height(800);
}
