/**
 * Frontend mirror of backend industry registry.
 * Does NOT include promptAddendum (backend-only — would leak prompt internals).
 *
 * Keep in sync with:
 *   ads-creative-meta-backend/src/config/industries.ts
 */

import {
  Home,
  ShoppingBag,
  Laptop,
  MapPin,
  Briefcase,
  Stethoscope,
  GraduationCap,
  Landmark,
  Plane,
  Car,
  Scale,
  Building2,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export interface IndustryTerminology {
  lead: string
  customer: string
  product: string
  conversion: string
}

export interface IndustryMeta {
  id: string
  label: string
  icon: LucideIcon
  terminology: IndustryTerminology
  keyMetrics: string[]
  defaultPrimaryGoal: string
  suggestedCTAs: string[]
}

export const INDUSTRIES: IndustryMeta[] = [
  {
    id: "real_estate",
    label: "Real Estate",
    icon: Home,
    terminology: { lead: "prospect", customer: "buyer", product: "property", conversion: "site visit" },
    keyMetrics: ["CPL", "CPQL", "cost_per_site_visit", "qualified_lead_rate"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Book a Site Visit", "Download Brochure", "Request a Callback"],
  },
  {
    id: "ecommerce",
    label: "E-commerce / D2C",
    icon: ShoppingBag,
    terminology: { lead: "shopper", customer: "buyer", product: "product", conversion: "purchase" },
    keyMetrics: ["ROAS", "CPA", "AOV", "CTR", "add_to_cart_rate"],
    defaultPrimaryGoal: "sales",
    suggestedCTAs: ["Shop Now", "Buy Now", "Add to Cart"],
  },
  {
    id: "saas",
    label: "SaaS",
    icon: Laptop,
    terminology: { lead: "signup", customer: "subscriber", product: "plan", conversion: "trial start" },
    keyMetrics: ["CAC", "cost_per_signup", "trial_to_paid_rate", "LTV"],
    defaultPrimaryGoal: "signups",
    suggestedCTAs: ["Start Free Trial", "Get a Demo", "Sign Up Free"],
  },
  {
    id: "local_services",
    label: "Local Services",
    icon: MapPin,
    terminology: { lead: "enquiry", customer: "client", product: "service", conversion: "booking" },
    keyMetrics: ["CPL", "cost_per_booking", "call_rate"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Call Now", "Get a Quote", "Book Appointment"],
  },
  {
    id: "agency",
    label: "Agency",
    icon: Briefcase,
    terminology: { lead: "prospect", customer: "client", product: "service", conversion: "discovery call" },
    keyMetrics: ["CPL", "CPQL", "cost_per_booked_call"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Book a Call", "Get a Proposal", "See Case Studies"],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    icon: Stethoscope,
    terminology: { lead: "enquiry", customer: "patient", product: "service", conversion: "appointment" },
    keyMetrics: ["CPL", "cost_per_appointment", "appointment_show_rate"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Book Appointment", "Consult a Doctor", "Get a Checkup"],
  },
  {
    id: "education",
    label: "Education / EdTech",
    icon: GraduationCap,
    terminology: { lead: "prospect", customer: "student", product: "course", conversion: "enrollment" },
    keyMetrics: ["CPL", "cost_per_enrollment", "application_completion_rate"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Apply Now", "Download Brochure", "Book a Counseling Call"],
  },
  {
    id: "finance",
    label: "Finance / Fintech",
    icon: Landmark,
    terminology: { lead: "applicant", customer: "customer", product: "product", conversion: "application" },
    keyMetrics: ["CPL", "cost_per_approved_application", "approval_rate"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Apply Now", "Check Eligibility", "Get Started"],
  },
  {
    id: "hospitality",
    label: "Hospitality / Travel",
    icon: Plane,
    terminology: { lead: "guest", customer: "guest", product: "stay", conversion: "booking" },
    keyMetrics: ["CPL", "cost_per_booking", "booking_value", "ROAS"],
    defaultPrimaryGoal: "sales",
    suggestedCTAs: ["Book Now", "Check Availability", "See Rates"],
  },
  {
    id: "automotive",
    label: "Automotive",
    icon: Car,
    terminology: { lead: "prospect", customer: "buyer", product: "vehicle", conversion: "test drive" },
    keyMetrics: ["CPL", "cost_per_test_drive", "cost_per_sale"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Book a Test Drive", "Get a Quote", "Visit Showroom"],
  },
  {
    id: "professional_services",
    label: "Professional Services",
    icon: Scale,
    terminology: { lead: "enquiry", customer: "client", product: "service", conversion: "consultation" },
    keyMetrics: ["CPL", "cost_per_consultation", "consultation_to_retainer_rate"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Book a Consultation", "Get a Quote", "Schedule a Call"],
  },
  {
    id: "b2b_enterprise",
    label: "B2B / Enterprise",
    icon: Building2,
    terminology: { lead: "MQL", customer: "account", product: "solution", conversion: "demo request" },
    keyMetrics: ["CPL", "cost_per_MQL", "MQL_to_SQL_rate", "pipeline_value"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Request a Demo", "Talk to Sales", "Download Report"],
  },
  {
    id: "other",
    label: "Other",
    icon: Sparkles,
    terminology: { lead: "lead", customer: "customer", product: "offering", conversion: "conversion" },
    keyMetrics: ["CPL", "CPA", "ROAS", "CTR"],
    defaultPrimaryGoal: "lead_gen",
    suggestedCTAs: ["Learn More", "Get Started", "Contact Us"],
  },
]

export function getIndustry(id: string | null | undefined): IndustryMeta {
  if (!id) return INDUSTRIES[INDUSTRIES.length - 1]
  return INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES[INDUSTRIES.length - 1]
}
