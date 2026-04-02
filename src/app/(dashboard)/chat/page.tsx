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
} from "lucide-react"
import { useAiChat, type ChatMessage } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { usePlatform } from "@/hooks/use-platform"

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

// ── Chat page component ────────────────────────────────

export default function ChatPage() {
  const { platform } = usePlatform()
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId)
  const accountId = platform === "google" ? selectedGoogleAccountId : selectedAdAccountId
  const chatMutation = useAiChat()
  const SUGGESTED_PROMPTS = platform === "google" ? GOOGLE_PROMPTS : META_PROMPTS

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

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

    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 50)

    try {
      const result = await chatMutation.mutateAsync({
        message: msg,
        contextAreas: ["campaigns", "adsets", "audiences", "analytics", "proposals"],
        history: messages,
        adAccountId: accountId,
        platform,
      })
      setMessages([...newMessages, { role: "assistant", content: result.reply }])
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

  function clearChat() {
    setMessages([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const isEmpty = messages.length === 0

  return (
    <div
      className="flex flex-col"
      style={{
        /* negate <main> padding so chat fills entire viewport below topbar */
        margin: "-20px -24px",
        padding: "0 24px",
        height: "calc(100vh - 52px)",
      }}
    >
      {/* ── Messages area ─────────────────────────────── */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        {isEmpty ? (
          /* ── Empty state ────────────────────────────── */
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="flex flex-col items-center gap-3 mb-8">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, var(--acc) 0%, rgb(168,85,247) 100%)",
                  boxShadow: "0 8px 32px rgba(108,71,255,0.2)",
                }}
              >
                <Zap size={26} color="white" />
              </div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                AI Chat — {platform === "google" ? "Google Ads" : "Meta Ads"}
              </h2>
              <p className="max-w-md text-center text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                {platform === "google"
                  ? "I can analyze your Google campaigns, keywords, quality scores, and give you actionable recommendations — all from live Google Ads data."
                  : "I can analyze your campaigns, compare audiences, find budget leaks, and give you actionable recommendations — all from live Meta data."}
              </p>
            </div>

            {/* Data sources bar */}
            <div className="mb-6 flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Connected to
              </span>
              <div className="flex gap-1">
                {DATA_SOURCES.map((src) => {
                  const Icon = src.icon
                  return (
                    <div
                      key={src.label}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: `color-mix(in srgb, ${src.color} 8%, transparent)`,
                        color: src.color,
                      }}
                      title={src.label}
                    >
                      <Icon size={10} />
                      {src.label}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Prompt cards */}
            <div className="grid w-full max-w-xl grid-cols-2 gap-2.5">
              {SUGGESTED_PROMPTS.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => sendMessage(item.prompt)}
                    disabled={!accountId}
                    className="group flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all disabled:opacity-30"
                    style={{
                      borderColor: "var(--border-default)",
                      background: "var(--bg-base)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = item.color
                      e.currentTarget.style.background = `color-mix(in srgb, ${item.color} 4%, var(--bg-base))`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-default)"
                      e.currentTarget.style.background = "var(--bg-base)"
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in srgb, ${item.color} 12%, transparent)` }}
                    >
                      <Icon size={13} style={{ color: item.color }} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {item.label}
                      </span>
                      <span className="text-[10.5px] leading-snug" style={{ color: "var(--text-tertiary)" }}>
                        {item.prompt.length > 65 ? item.prompt.slice(0, 62) + "…" : item.prompt}
                      </span>
                    </div>
                  </button>
                )
              })}
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

            {/* Loading state */}
            {chatMutation.isPending && (
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
                    <Loader2 size={13} className="animate-spin" style={{ color: "var(--acc)" }} />
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Pulling data from {platform === "google" ? "Google" : "Meta"} and analyzing...
                    </span>
                    <TypingDots />
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
            className="absolute bottom-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
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
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2">
              {/* New chat button when conversation exists */}
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
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
                className="flex flex-1 items-end gap-2 rounded-xl border px-3.5 py-2.5 transition-colors"
                style={{
                  background: "var(--bg-base)",
                  borderColor: input ? "var(--acc)" : "var(--border-default)",
                  boxShadow: input ? "0 0 0 1px var(--acc)" : "none",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your campaigns, performance, audiences..."
                  rows={1}
                  className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-text-tertiary"
                  style={{ color: "var(--text-primary)" }}
                  disabled={chatMutation.isPending}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || chatMutation.isPending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-20"
                  style={{
                    background: input.trim() ? "#6c47ff" : "var(--bg-subtle)",
                    color: input.trim() ? "white" : "var(--text-tertiary)",
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
  )
}
