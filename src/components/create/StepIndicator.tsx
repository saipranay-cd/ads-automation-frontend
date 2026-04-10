"use client"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

const STEPS = [
  { num: 1, label: "Details" },
  { num: 2, label: "Targeting" },
  { num: 3, label: "Creative" },
  { num: 4, label: "Lead Form" },
  { num: 5, label: "Review" },
]

interface StepIndicatorProps {
  currentStep: number
  completedSteps: number[]
  onStepClick: (step: number) => void
}

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const isActive = step.num === currentStep
        const isCompleted = completedSteps.includes(step.num)
        const isClickable = step.num <= currentStep || isCompleted

        return (
          <div key={step.num} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.num)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && !isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                !isActive && !isCompleted && "text-muted-foreground",
                !isClickable && "cursor-default opacity-50"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  isActive && "bg-primary-foreground/20",
                  isCompleted && !isActive && "bg-primary/20",
                  !isActive && !isCompleted && "bg-muted dark:bg-muted/50"
                )}
              >
                {isCompleted ? <CheckIcon className="size-3 animate-check-bounce" /> : step.num}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-8 sm:w-12",
                  step.num < currentStep ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
