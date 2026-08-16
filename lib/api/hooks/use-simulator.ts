import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ISimulatorResponse } from '@/lib/types'

export const useSimulator = () => {
  const [sessionId, setSessionId] = useState<string | null>(null)

  const sendMessage = useMutation({
    mutationFn: (message: string) => {
      if (!message || !message.trim()) {
        return Promise.reject(new Error('El mensaje no puede estar vacío.'))
      }
      return apiClient.post<ISimulatorResponse>(ENDPOINTS.simulator, {
        message,
        session_id: sessionId,
      })
    },
    onSuccess: (data) => {
      if (data && data.session_id && !sessionId) {
        setSessionId(data.session_id)
      }
    },
  })

  const resetSession = () => setSessionId(null)

  return { sendMessage, sessionId, resetSession }
}
