"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
  size?: number
}

export function CopyButton({ value, label, className, size = 12 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API blocked — silent fail
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : `Copy ${label ?? "value"}`}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors hover:bg-[var(--bg-muted)]",
        className
      )}
      style={{ color: copied ? "var(--acc)" : "var(--text-tertiary)" }}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  )
}
