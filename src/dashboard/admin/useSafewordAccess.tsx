// Acciones protegidas por una palabra clave: se pide solo cuando hace falta, se recuerda y, si el
// servidor la rechaza, se vuelve a pedir y se reintenta una vez. Cada ámbito (carga, flyers) tiene
// su propia configuración; la mecánica es la misma.
import { useId, useRef, useState } from 'react'
import { Button, Chip, Modal } from '../ui'
import { adminPost, isAbort, isUnauthorized, safewordStore, type SafewordStore } from './adminApi'
import { SafewordStep } from './SafewordStep'

type Pending = { resolve: (safeword: string | null) => void; notice: string | null }

export type SafewordAccessConfig = {
  store: SafewordStore
  verify: (safeword: string) => Promise<unknown>
  /** Título del diálogo (el ámbito: "Flyers", "Cargar datos"...). */
  title: string
  description: string
  /** Aviso al volver a pedirla porque el servidor la rechazó. */
  staleNotice: string
}

/** Ejecuta una acción protegida. Devuelve undefined si el usuario cancela el diálogo. */
export type RunProtected = <T>(action: (safeword: string) => Promise<T>) => Promise<T | undefined>

export function useSafewordAccess(config: SafewordAccessConfig): { run: RunProtected; dialog: React.ReactNode } {
  const [pending, setPending] = useState<Pending | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  // La configuración se lee al ejecutar, no al montar: evita capturar una versión vieja en `run`.
  const latest = useRef(config)
  latest.current = config

  function ask(notice: string | null): Promise<string | null> {
    return new Promise((resolve) => {
      const next = { resolve, notice }
      pendingRef.current = next
      setPending(next)
    })
  }

  function settle(safeword: string | null) {
    pendingRef.current?.resolve(safeword)
    pendingRef.current = null
    setPending(null)
  }

  async function run<T>(action: (safeword: string) => Promise<T>): Promise<T | undefined> {
    let safeword = latest.current.store.get() ?? (await ask(null))
    for (let attempt = 0; safeword; attempt += 1) {
      try {
        return await action(safeword)
      } catch (err) {
        if (!isUnauthorized(err) || isAbort(err) || attempt > 0) throw err
        latest.current.store.clear()
        safeword = await ask(latest.current.staleNotice)
      }
    }
    return undefined
  }

  const dialog = <SafewordAccessDialog config={config} pending={pending} onDone={settle} />
  return { run, dialog }
}

function SafewordAccessDialog({
  config,
  pending,
  onDone,
}: {
  config: SafewordAccessConfig
  pending: Pending | null
  onDone: (safeword: string | null) => void
}) {
  const formId = useId()
  const [verifying, setVerifying] = useState(false)

  return (
    <Modal
      open={pending !== null}
      onClose={() => !verifying && onDone(null)}
      title={config.title}
      eyebrow={<Chip tone="ash">Acceso restringido</Chip>}
      dismissible={!verifying}
      footer={
        <>
          <Button variant="ghost" onClick={() => onDone(null)} disabled={verifying}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="primary" disabled={verifying}>
            {verifying ? 'Comprobando…' : 'Continuar'}
          </Button>
        </>
      }
    >
      {pending && (
        <SafewordStep
          formId={formId}
          notice={pending.notice}
          onBusyChange={setVerifying}
          verify={config.verify}
          description={config.description}
          onVerified={(value) => {
            config.store.set(value)
            onDone(value)
          }}
        />
      )}
    </Modal>
  )
}

/** Acciones de carga de datos (ADMIN_SAFEWORD) fuera de los formularios, que ya piden la clave por pasos. */
export function useAdminAccess() {
  return useSafewordAccess({
    store: safewordStore,
    verify: (safeword) => adminPost('/verify', {}, safeword),
    title: 'Cargar datos',
    description: 'Solo el cuerpo técnico puede editar los datos del equipo. Escribe la palabra clave para continuar.',
    staleNotice: 'La palabra clave ya no es válida. Escríbela de nuevo.',
  })
}
