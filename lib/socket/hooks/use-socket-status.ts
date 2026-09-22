'use client'

import { useEffect, useState } from 'react'
import { socketClient } from '../socket-client'

/**
 * Estado real de la conexión en tiempo real.
 *
 * El panel mostraba un "Socket conectado" fijo, escrito a mano, que seguía en
 * verde aunque la conexión se hubiera caído. Así, cuando el socket moría tras
 * un reinicio del backend, nada lo delataba: los mensajes dejaban de llegar y
 * la interfaz seguía afirmando que todo iba bien.
 */
export const useSocketStatus = (): boolean => {
  const [connected, setConnected] = useState(() => socketClient.isConnected())

  useEffect(() => socketClient.onStatusChange(setConnected), [])

  return connected
}
