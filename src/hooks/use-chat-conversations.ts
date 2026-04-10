"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"
import { showApiError } from "@/components/layout/ErrorToast"

export interface ChatConversationSummary {
  id: string
  title: string
  platform: "meta" | "google"
  adAccountId: string
  createdAt: string
  updatedAt: string
  messages: Array<{
    content: string
    role: "user" | "assistant"
    createdAt: string
  }>
}

export interface ChatMessageRecord {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export interface ChatConversationFull {
  id: string
  title: string
  platform: string
  adAccountId: string
  createdAt: string
  updatedAt: string
  messages: ChatMessageRecord[]
}

export function useConversations(
  platform?: "meta" | "google" | null,
  adAccountId?: string | null
) {
  return useQuery<ChatConversationSummary[]>({
    queryKey: ["conversations", platform, adAccountId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (platform) params.set("platform", platform)
      if (adAccountId) params.set("adAccountId", adAccountId)
      const res = await apiFetch(`/api/meta/conversations?${params}`)
      if (!res.ok) throw new Error("Failed to load conversations")
      const json = await res.json()
      return json.data || []
    },
    enabled: !!platform && !!adAccountId,
    staleTime: 30_000,
  })
}

export function useConversationMessages(conversationId?: string | null) {
  return useQuery<ChatConversationFull>({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async () => {
      const res = await apiFetch(`/api/meta/conversations/${conversationId}/messages`)
      if (!res.ok) throw new Error("Failed to load messages")
      const json = await res.json()
      return json.data
    },
    enabled: !!conversationId,
    staleTime: 0,
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/meta/conversations/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete conversation")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
    onError: (error) => showApiError(error),
  })
}
