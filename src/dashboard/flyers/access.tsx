import { useId, useRef, useState } from 'react'
import { isAbort, isUnauthorized } from '../admin/adminApi'
import { SafewordStep } from '../admin/SafewordStep'
import { Button, Chip, Modal } from '../ui'
import { flyersPost, flyersSafewordStore } from './api'

type Pending = { resolve: (safeword: string | null) => void; notice: string | null }

/**
 * Acceso a las acciones protegidas de Flyers. `run` pide la palabra clave solo cuando hace falta (en un diálogo),
 * la recuerda y, si el servidor la rechaza, la vuelve a pedir y reintenta una vez.
 */
export function useFlyersAccess() {
  const [pending, setPending] = useState<Pending | null>(null)
  const pendingRef = useRef<Pending | null>(null)

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

  /** Ejecuta la acción con la palabra clave. Devuelve undefined si el usuario cancela el diálogo. */
  async function run<T>(action: (safeword: string) => Promise<T>): Promise<T | undefined> {
    let safeword = flyersSafewordStore.get() ?? (await ask(null))
    for (let attempt = 0; safeword; attempt += 1) {
      try {
        return await action(safeword)
      } catch (err) {
        if (!isUnauthorized(err) || isAbort(err) || attempt > 0) throw err
        flyersSafewordStore.clear()
        safeword = await ask('La palabra clave de flyers ya no es válida. Escríbela de nuevo.')
      }
    }
    return undefined
  }

  const dialog = <FlyersAccessDialog pending={pending} onDone={settle} />
  return { run, dialog }
}

function FlyersAccessDialog({ pending, onDone }: { pending: Pending | null; onDone: (safeword: string | null) => void }) {
  const formId = useId()
  const [verifying, setVerifying] = useState(false)

  return (
    <Modal
      open={pending !== null}
      onClose={() => !verifying && onDone(null)}
      title="Flyers"
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
          verify={(safeword) => flyersPost('verify', {}, safeword)}
          description="Subir imágenes, guardar flyers y usar la IA requiere la palabra clave de flyers (distinta de la de carga de datos)."
          onVerified={(value) => {
            flyersSafewordStore.set(value)
            onDone(value)
          }}
        />
      )}
    </Modal>
  )
}
