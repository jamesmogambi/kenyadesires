'use client'

import { useEffect } from "react"
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        defaults: '2026-05-30'
      })
    }
  }, [])

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}