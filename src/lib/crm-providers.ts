// ── CRM Provider Configuration ─────────────────────────────
// Metadata for each supported CRM — drives the provider picker UI.

export type CrmProviderId = 'zoho' | 'hubspot' | 'salesforce' | 'pipedrive'

export interface CrmProviderConfig {
  id: CrmProviderId
  name: string
  description: string
  accentColor: string
  features: {
    historyTracking: boolean
    nativeLeadSource: boolean
  }
  nangoIntegrationId: string
}

export const CRM_PROVIDERS: CrmProviderConfig[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts and lifecycle stages',
    accentColor: '#FF7A59',
    features: { historyTracking: false, nativeLeadSource: false },
    nangoIntegrationId: 'hubspot',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync leads with SOQL support',
    accentColor: '#00A1E0',
    features: { historyTracking: false, nativeLeadSource: true },
    nangoIntegrationId: 'salesforce',
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Sync leads, contacts, and deals',
    accentColor: '#E42527',
    features: { historyTracking: true, nativeLeadSource: true },
    nangoIntegrationId: 'zoho-crm',
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sync persons and deal stages',
    accentColor: '#2C3E50',
    features: { historyTracking: false, nativeLeadSource: false },
    nangoIntegrationId: 'pipedrive',
  },
]

export function getCrmProvider(id: CrmProviderId): CrmProviderConfig | undefined {
  return CRM_PROVIDERS.find(p => p.id === id)
}
