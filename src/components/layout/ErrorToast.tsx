"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, X, Clock } from "lucide-react"
import { create } from "zustand"

// ── Toast Store ────────────────────────────────────────

interface Toast {
  id: string
  message: string
  type: "error" | "warning" | "info"
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ].slice(-3), // Max 3 toasts
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// ── Helper to show API errors ──────────────────────────

export function showApiError(error: unknown) {
  const store = useToastStore.getState()

  if (error instanceof Error) {
    const msg = error.message
    if (msg.includes("rate limit") || msg.includes("Rate limit") || msg.includes("too many calls")) {
      store.addToast({
        message: "Meta API rate limit reached. Wait a few minutes before syncing again.",
        type: "warning",
        duration: 8000,
      })
      return
    }
    store.addToast({ message: msg, type: "error" })
    return
  }

  store.addToast({ message: "Something went wrong. Please try again.", type: "error" })
}

// ── Toast Container ────────────────────────────────────

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-[200] flex flex-col gap-2 md:bottom-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration || 5000)
    return () => clearTimeout(timer)
  }, [toast.duration, onDismiss])

  const config = {
    error: { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", color: "#f87171", icon: AlertTriangle },
    warning: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", color: "#fbbf24", icon: Clock },
    info: { bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)", color: "#60a5fa", icon: AlertTriangle },
  }[toast.type]

  const Icon = config.icon

  return (
    <div
      className="flex max-w-sm items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg backdrop-blur-md animate-in slide-in-from-right"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon size={16} className="mt-0.5 shrink-0" style={{ color: config.color }} />
      <p className="flex-1 text-xs font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {toast.message}
      </p>
      <button onClick={onDismiss} className="shrink-0 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
        <X size={14} />
      </button>
    </div>
  )
}
