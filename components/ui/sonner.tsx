"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#c62828",
          "--normal-text": "#ffffff",
          "--normal-border": "#b91c1c",
          "--error-bg": "#dc2626",
          "--error-text": "#ffffff",
          "--error-border": "#b91c1c",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
