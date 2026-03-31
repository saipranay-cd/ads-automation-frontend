"use client"

import { Suspense } from "react"
import { GoogleWizardShell } from "@/components/google-create/GoogleWizardShell"

export default function GoogleCreatePage() {
  return (
    <Suspense>
      <GoogleWizardShell />
    </Suspense>
  )
}
