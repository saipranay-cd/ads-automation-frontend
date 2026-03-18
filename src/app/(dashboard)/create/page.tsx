"use client"

import { Suspense } from "react"
import { WizardShell } from "@/components/create/WizardShell"

export default function CreatePage() {
  return (
    <Suspense>
      <WizardShell />
    </Suspense>
  )
}
