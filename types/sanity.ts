export interface Category {
  _id: string
  name: string
  slug: {
    current: string
    _type: 'slug'
  }
  description?: string
  icon?: string
  color?: string
  order?: number
  featured?: boolean
  count?: number
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
  email?: string
  socialLinks?: string[]
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
  body?: any
  _createdAt: string
  _updatedAt?: string
  author?: Author
  categories: Category[]
  featured?: boolean
  faq?: Array<{
    _key: string
    question: string
    answer: string
  }>
}

export interface PostsResponse {
  posts: Post[]
  total: number
  totalPages: number
  currentPage: number
}

// Category Colors Mapping
export const CATEGORY_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  pink: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
  green: 'bg-green-100 text-green-800 hover:bg-green-200',
  orange: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  red: 'bg-red-100 text-red-800 hover:bg-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
}

export const CATEGORY_BORDER_COLORS: Record<string, string> = {
  blue: 'border-blue-500',
  purple: 'border-purple-500',
  pink: 'border-pink-500',
  green: 'border-green-500',
  orange: 'border-orange-500',
  red: 'border-red-500',
  yellow: 'border-yellow-500',
}

export const CATEGORY_GRADIENT_COLORS: Record<string, string> = {
  blue: 'from-blue-500/20 to-blue-600/10',
  purple: 'from-purple-500/20 to-purple-600/10',
  pink: 'from-pink-500/20 to-pink-600/10',
  green: 'from-green-500/20 to-green-600/10',
  orange: 'from-orange-500/20 to-orange-600/10',
  red: 'from-red-500/20 to-red-600/10',
  yellow: 'from-yellow-500/20 to-yellow-600/10',
}