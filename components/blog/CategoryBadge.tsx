import Link from 'next/link'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/sanity'

interface CategoryBadgeProps {
  name: string
  slug: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  pink: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
  green: 'bg-green-100 text-green-800 hover:bg-green-200',
  orange: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
}

export default function CategoryBadge({ 
  name, 
  slug, 
  className = '', 
  size = 'md' 
}: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[slug] || 'blue'
  const icon = CATEGORY_ICONS[slug] || '📌'
  const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
  const sizeClass = sizeClasses[size]

  return (
    <Link 
      href={`/category/${slug}`}
      className={`inline-flex items-center gap-1 rounded-full font-medium transition ${colorClass} ${sizeClass} ${className}`}
    >
      <span>{icon}</span>
      {name}
    </Link>
  )
}