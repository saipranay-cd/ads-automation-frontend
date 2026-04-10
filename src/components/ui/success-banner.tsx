"use client"

import * as React from "react"
import { CheckCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface SuccessBannerProps {
  message: string
  autoDismiss?: boolean
  className?: string
}

function SuccessBanner({
  message,
  autoDismiss = true,
  className,
}: SuccessBannerProps) {
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    if (!autoDismiss) return

    const timer = setTimeout(() => {
      setVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [autoDismiss])

  if (!visible) return null

  return (
    <div
      data-slot="success-banner"
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-lg bg-green-bg px-3 py-2 text-sm text-green-text transition-opacity duration-200 animate-scale-in",
        !visible && "opacity-0",
        className
      )}
    >
      <CheckCircle className="size-4 shrink-0 animate-check-bounce" style={{ animationDelay: "150ms" }} />
      <span className="flex-1">{message}</span>
    </div>
  )
}

export { SuccessBanner }
export type { SuccessBannerProps }
