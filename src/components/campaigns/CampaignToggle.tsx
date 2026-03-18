"use client"

interface CampaignToggleProps {
  isActive: boolean
  onChange: (active: boolean) => void
}

export function CampaignToggle({ isActive, onChange }: CampaignToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={isActive}
      onClick={() => onChange(!isActive)}
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
  )
}
