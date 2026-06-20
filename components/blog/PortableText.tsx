import { PortableText as PortableTextComponent } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import SanityImage from './SanityImage'
import Link from 'next/link'

interface PortableTextProps {
  content: PortableTextBlock[]
}

const components = {
  types: {
    image: ({ value }: any) => (
      <div className="my-8">
        <SanityImage 
          image={value} 
          className="w-full rounded-lg"
          width={800}
          height={500}
        />
      </div>
    ),
  },
  block: {
    h1: ({ children }: any) => <h1 className="text-4xl font-bold my-6">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-3xl font-bold my-5">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-2xl font-bold my-4">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-xl font-bold my-3">{children}</h4>,
    normal: ({ children }: any) => <p className="my-4 leading-relaxed text-gray-700">{children}</p>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }: any) => (
      <a 
        href={value.href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
  },
}

export default function PortableText({ content }: PortableTextProps) {
  if (!content) return null
  return <PortableTextComponent value={content} components={components} />
}