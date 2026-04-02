"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, AlertTriangle, Info, AlertCircle, Check } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"

interface Notification {
  id: string
  type: string
  priority: "critical" | "warning" | "info"
  title: string
  body: string
  entityType?: string
  entityId?: string
  isRead: boolean
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const priorityIcon = {
  critical: <AlertCircle size={14} style={{ color: "var(--status-error)" }} />,
  warning: <AlertTriangle size={14} style={{ color: "var(--status-warning)" }} />,
  info: <Info size={14} style={{ color: "var(--text-tertiary)" }} />,
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data } = useQuery<{ data: Notification[] }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiFetch("/api/meta/notifications?limit=30")
      return res.json()
    },
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
    refetchIntervalInBackground: false,
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/meta/notifications", { method: "PUT" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const notifications = data?.data || []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "var(--status-error)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl shadow-lg"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--accent-primary)" }}
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-8">
                <Bell size={24} style={{ color: "var(--text-disabled)" }} />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No notifications yet
                </span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-3 px-4 py-3 transition-colors"
                  style={{
                    background: n.isRead
                      ? "transparent"
                      : "var(--bg-subtle)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    {priorityIcon[n.priority]}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {n.title}
                    </span>
                    <span
                      className="line-clamp-2 text-[11px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {n.body}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-disabled)" }}
                    >
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
