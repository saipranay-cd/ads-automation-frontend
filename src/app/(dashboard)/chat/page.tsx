"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Send,
  Megaphone,
  Layers,
  Users,
  BarChart3,
  Sparkles,
  Loader2,
  MessageSquarePlus,
  ArrowDown,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Target,
  DollarSign,
  PauseCircle,
  Activity,
  Trash2,
} from "lucide-react"
import { useAiChat, type ChatMessage } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { usePlatform } from "@/hooks/use-platform"
import {
  useConversations,
  useConversationMessages,
  useDeleteConversation,
  type ChatConversationSummary,
} from "@/hooks/use-chat-conversations"
import { useQueryClient } from "@tanstack/react-query"

// ── Suggested prompts with icons + categories ──────────

const META_PROMPTS = [
  {
    icon: Activity,
    label: "Account health",
    prompt: "Give me a full summary of my ad account health.",
    color: "rgb(34,197,94)",
  },
  {
    icon: TrendingUp,
    label: "Top performers",
    prompt: "Which campaigns and ad sets are performing best? Show me the data.",
    color: "var(--acc)",
  },
  {
    icon: DollarSign,
    label: "Budget optimization",
    prompt: "Analyze my spend efficiency — where am I wasting budget and where should I invest more?",
    color: "rgb(234,179,8)",
  },
  {
    icon: Target,
    label: "Audience insights",
    prompt: "Compare my audiences and tell me which targeting is delivering the cheapest leads.",
    color: "rgb(59,130,246)",
  },
  {
    icon: PauseCircle,
    label: "Underperformers",
    prompt: "Are there any ad sets or campaigns I should pause? Show me the worst performers.",
    color: "rgb(239,68,68)",
  },
  {
    icon: Megaphone,
    label: "City breakdown",
    prompt: "Which cities are giving me the best results? Break down performance by region.",
    color: "rgb(168,85,247)",
  },
]

const GOOGLE_PROMPTS = [
  {
    icon: DollarSign,
    label: "Highest CPC",
    prompt: "Which Google campaigns have the highest CPC?",
    color: "rgb(234,179,8)",
  },
  {
    icon: Target,
    label: "Quality score",
    prompt: "What keywords have the lowest quality score?",
    color: "rgb(59,130,246)",
  },
  {
    icon: PauseCircle,
    label: "Pause ad groups",
    prompt: "Which ad groups should I pause?",
    color: "rgb(239,68,68)",
  },
  {
    icon: Activity,
    label: "Account health",
    prompt: "Give me a full summary of my Google Ads account health.",
    color: "rgb(34,197,94)",
  },
  {
    icon: TrendingUp,
    label: "Top performers",
    prompt: "Which Google campaigns are performing best? Show me the data.",
    color: "var(--acc)",
  },
  {
    icon: BarChart3,
    label: "Conversion tracking",
    prompt: "How are my conversion actions performing across campaigns?",
    color: "rgb(168,85,247)",
  },
]

// ── Data sources indicator ─────────────────────────────

const DATA_SOURCES = [
  { icon: Megaphone, label: "Campaigns", color: "var(--acc)" },
  { icon: Layers, label: "Ad Sets", color: "rgb(168,85,247)" },
  { icon: Users, label: "Audiences", color: "rgb(59,130,246)" },
  { icon: BarChart3, label: "Analytics", color: "rgb(34,197,94)" },
  { icon: Sparkles, label: "Proposals", color: "rgb(234,179,8)" },
]

// ── Markdown renderer ──────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const content = headerMatch[2]
      const cls =
        level <= 2
          ? "mt-4 mb-1.5 text-[13px] font-semibold"
          : level === 3
            ? "mt-3 mb-1 text-xs font-semibold"
            : "mt-2.5 mb-1 text-xs font-medium"
      elements.push(
        <div key={i} className={cls} style={{ color: "var(--text-primary)" }}>
          {formatInline(content)}
        </div>
      )
      i++
      continue
    }

    // Tables (pipe-delimited rows)
    if (line.match(/^\|.*\|/) && i + 1 < lines.length && lines[i + 1].match(/^\|[\s\-:|]+\|/)) {
      const tableRows: string[][] = []
      // Header row
      tableRows.push(
        line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim())
      )
      i++ // skip header
      i++ // skip separator (|---|---|)
      // Data rows
      while (i < lines.length && lines[i].match(/^\|.*\|/)) {
        tableRows.push(
          lines[i].split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim())
        )
        i++
      }
      const headers = tableRows[0]
      const rows = tableRows.slice(1)
      elements.push(
        <div key={`tbl-${i}`} className="my-2 overflow-x-auto rounded-lg" style={{ border: "1px solid var(--border-subtle)" }}>
          <table className="w-full text-[11.5px]">
            <thead>
              <tr style={{ background: "var(--bg-muted)" }}>
                {headers.map((h, j) => (
                  <th
                    key={j}
                    className="whitespace-nowrap px-3 py-1.5 text-left font-semibold"
                    style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    {formatInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    borderBottom: ri < rows.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                    background: ri % 2 === 1 ? "var(--bg-muted)" : "transparent",
                  }}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="whitespace-nowrap px-3 py-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // Indented sub-bullets
    if (line.match(/^\s{1,4}[-*]\s/)) {
      const subBullets: string[] = []
      while (i < lines.length && lines[i].match(/^\s{1,4}[-*]\s/)) {
        subBullets.push(lines[i].replace(/^\s{1,4}[-*]\s/, ""))
        i++
      }
      elements.push(
        <ul key={`sub-${i}`} className="my-0.5 ml-5 list-[circle] space-y-0.5">
          {subBullets.map((b, j) => (
            <li key={j} className="text-[12.5px] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
              {formatInline(b)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Top-level bullets
    if (line.match(/^[-*]\s/)) {
      const bullets: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        bullets.push(lines[i].replace(/^[-*]\s/, ""))
        const subItems: string[] = []
        i++
        while (i < lines.length && lines[i].match(/^\s{1,4}[-*]\s/)) {
          subItems.push(lines[i].replace(/^\s{1,4}[-*]\s/, ""))
          i++
        }
        if (subItems.length > 0) {
          bullets[bullets.length - 1] += "\n" + subItems.map((s) => `  - ${s}`).join("\n")
        }
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1.5 ml-4 list-disc space-y-1">
          {bullets.map((b, j) => {
            const [main, ...subLines] = b.split("\n")
            return (
              <li key={j} className="text-[12.5px] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
                {formatInline(main)}
                {subLines.length > 0 && (
                  <ul className="mt-0.5 ml-3 list-[circle] space-y-0.5">
                    {subLines.map((sl, k) => (
                      <li key={k} className="text-[12.5px] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
                        {formatInline(sl.replace(/^\s{2}-\s/, ""))}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )
      continue
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-1.5 ml-4 list-decimal space-y-1">
          {items.map((item, j) => (
            <li key={j} className="text-[12.5px] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
              {formatInline(item)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    // HR
    if (line.match(/^---+$/)) {
      elements.push(
        <hr key={i} className="my-3" style={{ borderColor: "var(--border-subtle)" }} />
      )
      i++
      continue
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />)
      i++
      continue
    }

    // Paragraph
    elements.push(
      <p key={i} className="text-[12.5px] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
        {formatInline(line)}
      </p>
    )
    i++
  }

  return elements
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|₹[\d,.]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith("***") && part.endsWith("***")) {
      return <strong key={i} className="italic" style={{ color: "var(--text-primary)" }}>{part.slice(3, -3)}</strong>
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--text-primary)" }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded px-1 py-0.5 font-mono text-[11px]"
          style={{ background: "var(--bg-subtle)", color: "var(--acc-text)" }}
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    // Highlight currency values
    if (part.match(/^₹[\d,.]+$/)) {
      return (
        <span key={i} className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
          {part}
        </span>
      )
    }
    return part
  })
}

// ── Copy button for messages ───────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100"
      style={{ color: "var(--text-tertiary)" }}
      title="Copy response"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

// ── Typing dots animation ──────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--text-tertiary)",
            animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ── Relative time formatter ────────────────────────────

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString("en", { month: "short", day: "numeric" })
}

// ── Conversation sidebar ───────────────────────────────

function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  isLoading,
}: {
  conversations: ChatConversationSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNewChat: () => void
  isLoading: boolean
}) {
  return (
    <div
      className="flex w-[220px] shrink-0 flex-col border-r"
      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span
          className="text-[10px] font-medium uppercase tracking-[0.06em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          History
        </span>
        <button
          onClick={onNewChat}
          title="New chat"
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <MessageSquarePlus size={13} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId
            const lastMsg = conv.messages[0]
            const preview = lastMsg
              ? lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? "..." : "")
              : ""

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className="group relative cursor-pointer px-3 py-2 transition-colors"
                style={{
                  background: isActive ? "var(--bg-subtle)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-subtle)"
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent"
                }}
              >
                <div className="flex items-start justify-between gap-1">
                  <p
                    className="truncate text-[11.5px] font-medium leading-tight"
                    style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
                  >
                    {conv.title}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "rgb(239,68,68)"
                      e.currentTarget.style.background = "var(--bg-subtle)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-tertiary)"
                      e.currentTarget.style.background = "transparent"
                    }}
                    title="Delete conversation"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {preview && (
                  <p
                    className="mt-0.5 truncate text-[10px] leading-tight"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {preview}
                  </p>
                )}
                <p
                  className="mt-0.5 text-[9px]"
                  style={{ color: "var(--text-tertiary)", opacity: 0.6 }}
                >
                  {timeAgo(conv.updatedAt)}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Chat page component ────────────────────────────────

export default function ChatPage() {
  const { platform } = usePlatform()
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId)
  const accountId = platform === "google" ? selectedGoogleAccountId : selectedAdAccountId
  const chatMutation = useAiChat()
  const queryClient = useQueryClient()
  const SUGGESTED_PROMPTS = platform === "google" ? GOOGLE_PROMPTS : META_PROMPTS

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Conversation data
  const { data: conversations, isLoading: convLoading } = useConversations(platform, accountId)
  const messagesQuery = useConversationMessages(activeConversationId)
  const deleteMutation = useDeleteConversation()

  // Seed local messages from DB when loading a conversation
  useEffect(() => {
    if (messagesQuery.data?.messages) {
      setMessages(
        messagesQuery.data.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      )
    }
  }, [messagesQuery.data])

  // Reset conversation when platform or account changes
  useEffect(() => {
    setActiveConversationId(null)
    setMessages([])
  }, [platform, accountId])

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, chatMutation.isPending, scrollToBottom])

  // Show/hide scroll-to-bottom button
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onScroll() {
      if (!el) return
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollBtn(gap > 200)
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = "0"
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px"
  }, [input])

  async function sendMessage(text?: string) {
    const msg = text || input.trim()
    if (!msg || !accountId) return

    const userMsg: ChatMessage = { role: "user", content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")

    setTimeout(() => inputRef.current?.focus(), 50)

    try {
      const result = await chatMutation.mutateAsync({
        message: msg,
        contextAreas: ["campaigns", "adsets", "audiences", "analytics", "proposals"],
        history: messages,
        adAccountId: accountId,
        platform,
        conversationId: activeConversationId ?? undefined,
      })
      setMessages([...newMessages, { role: "assistant", content: result.reply }])

      // Lock in conversationId on first message
      if (!activeConversationId && result.conversationId) {
        setActiveConversationId(result.conversationId)
      }

      // Refresh sidebar
      queryClient.invalidateQueries({ queryKey: ["conversations", platform, accountId] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again."
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Something went wrong: ${message}` },
      ])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function newChat() {
    setActiveConversationId(null)
    setMessages([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function selectConversation(id: string) {
    if (id === activeConversationId) return
    setActiveConversationId(id)
    // Messages will be loaded via useConversationMessages + useEffect
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id)
    if (id === activeConversationId) {
      newChat()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div
      className="flex"
      style={{
        margin: "-20px -24px",
        height: "calc(100vh - 52px)",
      }}
    >
      {/* ── Sidebar ──────────────────────────────────── */}
      <ConversationSidebar
        conversations={conversations || []}
        activeId={activeConversationId}
        onSelect={selectConversation}
        onDelete={handleDelete}
        onNewChat={newChat}
        isLoading={convLoading}
      />

      {/* ── Main chat area ───────────────────────────── */}
      <div className="flex flex-1 flex-col" style={{ padding: "0 24px" }}>
        {/* Messages area */}
        <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
          {isEmpty && !messagesQuery.isLoading ? (
            /* ── Empty state ────────────────────────────── */
            <div className="flex h-full flex-col items-center justify-center px-4">
              <style>{`
                @keyframes chat-breathe {
                  0%, 100% { transform: scale(1); opacity: 0.06; }
                  50% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes chat-breathe-inner {
                  0%, 100% { transform: scale(1); opacity: 0.1; }
                  50% { transform: scale(1.3); opacity: 0.03; }
                }
                @keyframes chat-appear {
                  from { opacity: 0; transform: translateY(8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                  .chat-empty-ring, .chat-empty-ring-inner { animation: none !important; }
                  .chat-empty-appear { animation: none !important; opacity: 1 !important; }
                }
              `}</style>

              {/* Breathing rings + icon */}
              <div className="relative mb-8 flex items-center justify-center" style={{ width: 140, height: 140 }}>
                {/* Outer breathing ring */}
                <div
                  className="chat-empty-ring absolute inset-0 rounded-full"
                  style={{
                    border: "1px solid var(--acc)",
                    animation: "chat-breathe 4s cubic-bezier(0.45, 0, 0.55, 1) infinite",
                  }}
                />
                {/* Inner breathing ring */}
                <div
                  className="chat-empty-ring-inner absolute rounded-full"
                  style={{
                    inset: 20,
                    border: "1px solid var(--acc)",
                    animation: "chat-breathe-inner 4s cubic-bezier(0.45, 0, 0.55, 1) infinite",
                    animationDelay: "0.3s",
                  }}
                />
                {/* Static center circle */}
                <div
                  className="relative flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: "var(--acc-subtle)",
                    border: "1px solid var(--acc-border)",
                  }}
                >
                  <Zap size={24} style={{ color: "var(--acc)" }} />
                </div>
              </div>

              {/* Text */}
              <div
                className="chat-empty-appear flex flex-col items-center gap-1.5"
                style={{ animation: "chat-appear 600ms cubic-bezier(0.25, 1, 0.5, 1) 200ms both" }}
              >
                <h2 className="text-base font-medium tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {platform === "google" ? "Google Ads" : "Meta Ads"} Assistant
                </h2>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Ask anything about your campaigns, budgets, and performance
                </p>
              </div>
            </div>
          ) : messagesQuery.isLoading ? (
            <div className="mx-auto max-w-2xl px-4 py-6">
              {/* Skeleton: user message */}
              <div className="mb-5 flex justify-end">
                <div
                  className="h-10 w-[60%] animate-pulse rounded-2xl rounded-br-md"
                  style={{ background: "var(--bg-subtle)" }}
                />
              </div>
              {/* Skeleton: assistant message */}
              <div className="mb-6 flex gap-3">
                <div
                  className="mt-1 h-7 w-7 shrink-0 animate-pulse rounded-lg"
                  style={{ background: "var(--bg-subtle)" }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-3 w-20 animate-pulse rounded"
                    style={{ background: "var(--bg-subtle)" }}
                  />
                  <div
                    className="h-24 w-full animate-pulse rounded-xl rounded-tl-md"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}
                  />
                </div>
              </div>
              {/* Skeleton: user message */}
              <div className="mb-5 flex justify-end">
                <div
                  className="h-10 w-[45%] animate-pulse rounded-2xl rounded-br-md"
                  style={{ background: "var(--bg-subtle)" }}
                />
              </div>
              {/* Skeleton: assistant message */}
              <div className="mb-6 flex gap-3">
                <div
                  className="mt-1 h-7 w-7 shrink-0 animate-pulse rounded-lg"
                  style={{ background: "var(--bg-subtle)" }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-3 w-20 animate-pulse rounded"
                    style={{ background: "var(--bg-subtle)" }}
                  />
                  <div
                    className="h-32 w-full animate-pulse rounded-xl rounded-tl-md"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── Conversation ───────────────────────────── */
            <div className="mx-auto max-w-2xl px-4 py-6">
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="mb-5 flex justify-end">
                    <div
                      className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5"
                      style={{ background: "#6c47ff" }}
                    >
                      <p className="text-[13px] font-medium leading-relaxed text-white whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="group mb-6 flex gap-3">
                    <div
                      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: "linear-gradient(135deg, var(--acc) 0%, rgb(168,85,247) 100%)",
                      }}
                    >
                      <Zap size={14} color="white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                          Adsflow AI
                        </span>
                        <CopyButton text={msg.content} />
                      </div>
                      <div
                        className="rounded-xl rounded-tl-md px-4 py-3"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {renderMarkdown(msg.content)}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Typing indicator */}
              {chatMutation.isPending && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="mb-6 flex gap-3">
                  <div
                    className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, var(--acc) 0%, rgb(168,85,247) 100%)",
                    }}
                  >
                    <Zap size={14} color="white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        Adsflow AI
                      </span>
                    </div>
                    <div
                      className="inline-flex items-center gap-2.5 rounded-xl rounded-tl-md px-4 py-3"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--text-tertiary)" }} />
                          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--text-tertiary)", animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--text-tertiary)", animationDelay: "300ms" }} />
                        </div>
                        <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                          Analyzing your data...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}

          {/* Scroll to bottom FAB */}
          {showScrollBtn && (
            <button
              onClick={() => scrollToBottom()}
              className="sticky bottom-4 left-1/2 z-10 mx-auto -mt-12 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              <ArrowDown size={14} />
            </button>
          )}
        </div>

        {/* ── Input area ───────────────────────────────── */}
        <div className="px-4 pb-3 pt-2">
          {!accountId ? (
            <div
              className="flex items-center justify-center rounded-xl py-3"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}
            >
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Select an ad account to start chatting
              </span>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">
              {/* Suggestion chips — only when no messages */}
              {isEmpty && (
                <div className="flex flex-nowrap justify-center gap-1.5 mb-3 overflow-x-auto">
                  {SUGGESTED_PROMPTS.map((item, i) => (
                    <button
                      key={item.label}
                      onClick={() => sendMessage(item.prompt)}
                      disabled={!accountId || chatMutation.isPending}
                      className="animate-fade-in shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        border: "1px solid var(--border-default)",
                        color: "var(--text-secondary)",
                        animationDelay: `${i * 50}ms`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-strong)"
                        e.currentTarget.style.color = "var(--text-primary)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-default)"
                        e.currentTarget.style.color = "var(--text-secondary)"
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* New chat button when conversation exists */}
                {messages.length > 0 && (
                  <button
                    onClick={newChat}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                    style={{
                      border: "1px solid var(--border-default)",
                      color: "var(--text-tertiary)",
                    }}
                    title="New chat"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <MessageSquarePlus size={16} />
                  </button>
                )}

                {/* Text input */}
                <div
                  className={`flex flex-1 items-end gap-2 rounded-xl border px-3.5 py-2.5 transition-colors ${chatMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    background: "var(--bg-base)",
                    borderColor: input && !chatMutation.isPending ? "var(--acc)" : "var(--border-default)",
                    boxShadow: input && !chatMutation.isPending ? "0 0 0 1px var(--acc)" : "none",
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={chatMutation.isPending ? "Waiting for response..." : "Ask about your campaigns, performance, audiences..."}
                    rows={1}
                    className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed"
                    style={{ color: "var(--text-primary)" }}
                    disabled={chatMutation.isPending}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || chatMutation.isPending}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    style={{
                      background: input.trim() && !chatMutation.isPending ? "#6c47ff" : "var(--bg-subtle)",
                      color: input.trim() && !chatMutation.isPending ? "white" : "var(--text-tertiary)",
                    }}
                  >
                    {chatMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-2 text-center text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                Adsflow AI pulls live data from {platform === "google" ? "Google Ads" : "Meta"} to answer your questions. Responses may vary.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
