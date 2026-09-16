import { useId, useState, type ReactNode } from 'react'
import { errorMessage } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { Button, Chip, FormError, Modal } from '../../ui'
import { useAdminSafeword } from '../api'

type ActionSheetProps = {
  open: boolean
  title: ReactNode
  /** Campos o texto del paso de confirmación. */
  children?: ReactNode
  confirmLabel: string
  busyLabel?: string
  tone?: 'primary' | 'danger'
  cancelLabel?: string
  /** Escribe en la base: pide la palabra clave (en un paso del mismo diálogo) si hace falta. */
  requiresSafeword?: boolean
  /** Tras validar la palabra clave, ejecuta la acción sin otro toque (p.ej. «Guardar» de una formación existente). */
  autoConfirm?: boolean
  /** Comprobación previa del formulario; false no ejecuta la acción. */
  validate?: () => boolean
  /** Si falla, el error se muestra en el diálogo. Quien lo usa lo cierra al terminar bien. */
  onConfirm: (safeword: string | null) => Promise<void> | void
  onCancel: () => void
}

/**
 * Diálogo corto sobre la cancha para confirmar, poner nombre o guardar.
 * Reutiliza Modal (un `<dialog>` encima del de pantalla completa) y SafewordStep.
 */
export function ActionSheet({
  open,
  title,
  children,
  confirmLabel,
  busyLabel = 'Guardando…',
  tone = 'primary',
  cancelLabel = 'Cancelar',
  requiresSafeword = false,
  autoConfirm = false,
  validate,
  onConfirm,
  onCancel,
}: ActionSheetProps) {
  const formId = useId()
  const auth = useAdminSafeword()
  const [verifying, setVerifying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const askSafeword = requiresSafeword && auth.safeword === null

  async function confirm() {
    if (validate && !validate()) return
    setBusy(true)
    setError(null)
    try {
      if (requiresSafeword) await auth.run((safeword) => Promise.resolve(onConfirm(safeword)))
      else await onConfirm(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const locked = busy || verifying
  const handleCancel = () => !locked && onCancel()

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={title}
      eyebrow={askSafeword ? <Chip tone="ash">Acceso restringido</Chip> : null}
      dismissible={!locked}
      scrollResetKey={askSafeword ? 'safeword' : 'form'}
      footer={
        <>
          <Button variant="ghost" onClick={handleCancel} disabled={locked}>
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId} variant={askSafeword ? 'primary' : tone} disabled={locked}>
            {askSafeword ? (verifying ? 'Comprobando…' : 'Continuar') : busy ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      {askSafeword ? (
        <SafewordStep
          formId={formId}
          notice={auth.notice}
          onBusyChange={setVerifying}
          onVerified={(value) => {
            auth.accept(value)
            if (autoConfirm) void confirm()
          }}
        />
      ) : (
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void confirm()
          }}
          className="flex flex-col gap-4"
        >
          {children}
          {error && <FormError>{error}</FormError>}
        </form>
      )}
    </Modal>
  )
}
