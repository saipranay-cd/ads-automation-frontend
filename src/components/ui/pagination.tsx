"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  pageSize: number
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }: PaginationProps) {
  if (totalPages <= 1) {
    if (totalItems === 0) return null
    return (
      <div className="pt-3">
        <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>
          {totalItems} of {totalItems}
        </span>
      </div>
    )
  }

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>
        {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-30"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={14} />
        </button>
        {generatePageNumbers(currentPage, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className="flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11px] font-medium transition-colors"
              style={{
                background: p === currentPage ? "var(--acc)" : "transparent",
                color: p === currentPage ? "white" : "var(--text-secondary)",
                border: p === currentPage ? "none" : "1px solid var(--border-default)",
              }}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-30"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "...")[] = [1]

  if (current > 3) pages.push("...")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push("...")

  pages.push(total)

  return pages
}

export function usePagination<T>(items: T[], pageSize: number = 25) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(items.length / pageSize)

  // Reset to page 1 when item count changes (filter applied)
  useEffect(() => {
    setCurrentPage(1)
  }, [items.length])

  const paginatedItems = useMemo(() =>
    items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize]
  )

  return {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems: items.length,
    pageSize,
    setCurrentPage,
  }
}
