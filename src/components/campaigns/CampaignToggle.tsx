"use client"

import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface CampaignToggleProps {
  isActive: boolean
  onChange: (active: boolean) => void
  campaignName?: string
}

export function CampaignToggle({ isActive, onChange, campaignName }: CampaignToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  function handleClick() {
    if (isActive) {
      // Pausing requires confirmation
      setShowConfirm(true)
    } else {
      // Activating is a positive action — no confirmation needed
      onChange(true)
    }
  }

  return (
    <>
      <button
        role="switch"
        aria-checked={isActive}
        aria-label="Toggle campaign active"
        onClick={handleClick}
        className="relative h-[18px] w-8 rounded-full transition-colors duration-200"
        style={{
          background: isActive ? "var(--acc)" : "var(--border-strong)",
        }}
      >
        <span
          className="absolute top-[3px] left-[3px] h-3 w-3 rounded-full bg-white transition-transform duration-200"
          style={{
            transform: isActive ? "translateX(14px)" : "translateX(0)",
          }}
        />
      </button>

      <ConfirmDialog
        open={showConfirm}
        onConfirm={() => {
          setShowConfirm(false)
          onChange(false)
        }}
        onCancel={() => setShowConfirm(false)}
        title={`Pause ${campaignName || "campaign"}?`}
        description="This will stop serving ads immediately. You can reactivate anytime."
        confirmLabel="Pause"
        variant="warning"
      />
    </>
  )
}
