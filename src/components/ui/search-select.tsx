"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"

interface SearchSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string // e.g. "All Campaigns"
  width?: string // e.g. "180px"
}

export function SearchSelect({ value, onChange, options, placeholder, width = "220px" }: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase()
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [options, query])

  const handleSelect = useCallback(
    (opt: string) => {
      onChange(opt)
      setOpen(false)
      setQuery("")
    },
    [onChange]
  )

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Focus search input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const isFiltered = value !== "All" && value !== placeholder

  return (
    <div ref={ref} className="relative" style={{ width }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        title={value === "All" ? undefined : value}
        className="flex w-full items-center justify-between rounded-md py-1.5 pl-3 pr-2 text-xs font-medium transition-colors"
        style={{
          background: "var(--bg-subtle)",
          border: `1px solid ${isFiltered ? "var(--acc)" : "var(--border-default)"}`,
          color: isFiltered ? "var(--acc-text)" : "var(--text-secondary)",
        }}
      >
        <span className="truncate">{value === "All" ? placeholder : value}</span>
        <ChevronDown
          size={11}
          className={`ml-1.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-tertiary)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg shadow-lg animate-scale-in"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-popup)",
            minWidth: "260px",
          }}
        >
          {/* Search input */}
          {options.length > 5 && (
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <Search size={12} style={{ color: "var(--text-tertiary)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          )}

          {/* Options */}
          <div className="max-h-[200px] overflow-y-auto py-1">
            {/* "All" option */}
            <button
              onClick={() => handleSelect("All")}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors"
              style={{
                color: value === "All" ? "var(--acc-text)" : "var(--text-secondary)",
                background: value === "All" ? "var(--acc-subtle)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (value !== "All") e.currentTarget.style.background = "var(--bg-subtle)"
              }}
              onMouseLeave={(e) => {
                if (value !== "All") e.currentTarget.style.background = "transparent"
              }}
            >
              <span>{placeholder}</span>
              {value === "All" && <Check size={11} style={{ color: "var(--acc)" }} />}
            </button>

            {filtered.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors"
                style={{
                  color: value === opt ? "var(--acc-text)" : "var(--text-primary)",
                  background: value === opt ? "var(--acc-subtle)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (value !== opt) e.currentTarget.style.background = "var(--bg-subtle)"
                }}
                onMouseLeave={(e) => {
                  if (value !== opt) e.currentTarget.style.background = "transparent"
                }}
              >
                <span className="truncate" title={opt}>{opt}</span>
                {value === opt && <Check size={11} style={{ color: "var(--acc)" }} />}
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-3 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
