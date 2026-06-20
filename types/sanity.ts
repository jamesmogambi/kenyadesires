// Sanity image type used by @sanity/image-url
export interface SanityImage {
  _type?: 'image'
  asset?: {
    _ref: string
    _type?: 'reference'
    url?: string
  }
  alt?: string
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  hotspot?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface Category {
  _id?: string
  name: string
  slug: string
  description?: string
  _createdAt?: string
}

export interface Author {
  _id?: string
  name: string
  image?: {
    asset?: {
      _ref: string
      url?: string
    }
    alt?: string
  }
  bio?: string
}

export interface Post {
  _id: string
  title: string
  slug: {
    current: string
    _type: 'slug'
  }
  excerpt?: string
  mainImage?: {
    asset?: {
      _ref: string
      url?: string
    }
    alt?: string
  }
  body?: any // Portable Text content
  _createdAt: string
  _updatedAt?: string
  author?: Author
  categories: Category[]
  relatedPosts?: Post[]
  readingTime?: number
}

export interface CategoryPageProps {
  params: {
    category: string
  }
}

export interface PostPageProps {
  params: {
    slug: string
  }
}

// Your static categories
export const CATEGORIES: Category[] = [
  {
    name: "Online Dating Kenya",
    slug: "online-dating-kenya",
    description: "Everything about online dating in Kenya. Find the best apps, safety tips, and dating advice for Kenyan singles."
  },
  {
    name: "Relationships in Kenya",
    slug: "relationships-kenya",
    description: "Understanding relationships in Kenya. From dating culture to marriage, explore modern Kenyan relationships."
  },
  {
    name: "Social & Telegram Kenya",
    slug: "social-kenya",
    description: "Social media and Telegram in Kenya. Discover how Kenyans connect online and build communities."
  },
  {
    name: "Safety & Guides Kenya",
    slug: "safety-kenya",
    description: "Stay safe while dating online in Kenya. Learn to avoid scams and protect your privacy."
  },
  {
    name: "Trends Kenya",
    slug: "trends-kenya",
    description: "Latest dating and social trends in Kenya. Stay updated with what's happening in Kenyan dating culture."
  },
]

export const CATEGORY_COLORS: Record<string, string> = {
  "online-dating-kenya": "blue",
  "relationships-kenya": "purple",
  "social-kenya": "pink",
  "safety-kenya": "green",
  "trends-kenya": "orange",
}

export const CATEGORY_ICONS: Record<string, string> = {
  "online-dating-kenya": "💕",
  "relationships-kenya": "❤️",
  "social-kenya": "📱",
  "safety-kenya": "🛡️",
  "trends-kenya": "📈",
}