"use client"

import { AlertCircle, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  sticky?: boolean
  className?: string
}

function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  sticky = false,
  className,
}: ErrorBannerProps) {
  return (
    <div
      data-slot="error-banner"
      role="alert"
      className={cn(
        "flex items-center gap-2 rounded-lg bg-red-bg px-3 py-2 text-sm text-red-text animate-fade-in",
        sticky && "sticky top-0 z-40",
        className
      )}
    >
      <AlertCircle className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onRetry}
          className="text-red-text hover:bg-red-bg/80"
        >
          Retry
        </Button>
      )}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          className="text-red-text hover:bg-red-bg/80"
          aria-label="Dismiss error"
        >
          <X />
        </Button>
      )}
    </div>
  )
}

export { ErrorBanner }
export type { ErrorBannerProps }
