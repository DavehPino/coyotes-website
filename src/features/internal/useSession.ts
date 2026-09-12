import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LoginInput } from '@shared/schemas'
import { apiGet, apiPost } from '@/lib/api'

type SessionState = { authenticated: boolean; expiresAt?: string }

const sessionKey = ['session'] as const

export function useSession() {
  return useQuery({ queryKey: sessionKey, queryFn: () => apiGet<SessionState>('/auth/session'), staleTime: 60_000 })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => apiPost<SessionState>('/auth/login', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey }),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<SessionState>('/auth/logout'),
    onSuccess: () => qc.clear(),
  })
}
