// import { FaTelegramPlane } from 'react-icons/fa'

interface TelegramCTAProps {
  variant?: 'home' | 'post' | 'sidebar'
  className?: string
}

const variants = {
  home: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8',
  post: 'bg-blue-50 border border-blue-200 rounded-lg p-6',
  sidebar: 'bg-gray-50 border rounded-lg p-4'
}

export default function TelegramCTA({ variant = 'home', className = '' }: TelegramCTAProps) {
  const baseClass = variants[variant]
  
  return (
    <div className={`${baseClass} ${className}`}>
      <div className="text-center">
        {/* <FaTelegramPlane className="text-4xl mx-auto mb-3 text-blue-500" /> */} 
        <h3 className="text-xl font-bold mb-2">
          {variant === 'home' ? 'Join Our Community' : 'Connect on Telegram'}
        </h3>
        <p className="text-sm opacity-90 max-w-2xl mx-auto">
          {variant === 'home' 
            ? 'Connect with other Kenyans discussing dating, relationships, and more'
            : 'Join our Telegram channel for daily updates and community discussions'}
        </p>
        <a 
          href={process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/yourchannel'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition shadow-lg"
        >
          Join Telegram →
        </a>
      </div>
    </div>
  )
}