import { createClient, type ClientConfig } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImage } from '@/types/sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-06-01'

if (!projectId || !dataset) {
  throw new Error('Missing Sanity environment variables')
}

const config: ClientConfig = {
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
}

export const client = createClient(config)

const builder = imageUrlBuilder(client)

export function urlFor(source: any): string {
  return builder.image(source).url()
}

// Helper to get image dimensions
export function getImageDimensions(source: any) {
  return builder.image(source).width(1200).height(800)
}

// Export types
export type { SanityImage }