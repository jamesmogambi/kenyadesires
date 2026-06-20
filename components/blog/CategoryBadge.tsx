import React from 'react'
import Link from 'next/link'
import { CATEGORY_COLORS } from '@/types/sanity'

interface CategoryBadgeProps {
  name: string
  slug: string
  color?: string
  icon?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
}

export default function CategoryBadge({ 
  name, 
  slug, 
  color = 'blue',
  icon,
  className = '', 
  size = 'md' 
}: CategoryBadgeProps) {
  const colorClass = CATEGORY_COLORS[color as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.blue
  const sizeClass = sizeClasses[size]

  return (
    <Link
      href={`/category/${slug}`}
      className={`inline-flex items-center gap-1 rounded-full font-medium transition ${colorClass} ${sizeClass} ${className}`}
    >
      {icon && <span>{icon}</span>}
      {name}
    </Link>
  )
}