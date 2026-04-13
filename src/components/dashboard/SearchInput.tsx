"use client"

import { memo } from "react"
import { Search } from "lucide-react"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const SearchInput = memo(function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div
      className="flex w-[220px] items-center gap-2 rounded-md px-3 py-1.5 transition-[border-color] duration-200 focus-within:border-[var(--acc)]"
      style={{
        background: "var(--bg-subtle)",
        border: "1px solid var(--border-default)",
      }}
    >
      <Search size={13} style={{ color: "var(--text-tertiary)" }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-xs outline-none placeholder:text-text-tertiary"
        style={{ color: "var(--text-primary)" }}
      />
    </div>
  )
})
