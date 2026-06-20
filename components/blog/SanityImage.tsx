import Image from 'next/image'
import { urlFor } from '@/lib/sanity/client'

interface SanityImageProps {
  image: any
  alt?: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  fill?: boolean
  sizes?: string
}

export default function SanityImage({ 
  image, 
  alt, 
  className = '', 
  width,
  height,
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  ...props 
}: SanityImageProps) {
  if (!image) return null
  
  const imageUrl = urlFor(image)
  
  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={alt || image.alt || 'Blog image'}
        fill
        className={`object-cover ${className}`}
        priority={priority}
        sizes={sizes}
        {...props}
      />
    )
  }

  const imgWidth = width || 1200
  const imgHeight = height || 800

  return (
    <Image
      src={imageUrl}
      alt={alt || image.alt || 'Blog image'}
      width={imgWidth}
      height={imgHeight}
      className={className}
      priority={priority}
      sizes={sizes}
      {...props}
    />
  )
}