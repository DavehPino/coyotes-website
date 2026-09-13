import { useQueryClient } from '@tanstack/react-query'
import { useId, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { MatchDetail, MatchSummary } from '@shared/schemas'
import { formatDateShort } from '@/lib/dates'
import { adminPost, errorMessage, isUnauthorized, safewordStore } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { Button, Chip, FormError, Modal } from '../../ui'
import { matchesKeys, refreshMatchData } from '../api'
import { matchTitle, videoCountLabel } from '../matchLabels'

type DeleteMatchDialogProps = {
  open: boolean
  match: MatchDetail
  onClose: () => void
}

/** Confirmación para eliminar un partido con sus videos. Al terminar vuelve al listado de partidos. */
export default function DeleteMatchDialog({ open, match, onClose }: DeleteMatchDialogProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [askSafeword, setAskSafeword] = useState(() => safewordStore.get() === null)
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = verifying || deleting
  const handleClose = () => !busy && onClose()

  async function handleDelete() {
    const safeword = safewordStore.get()
    if (!safeword) return setAskSafeword(true)
    setDeleting(true)
    setError(null)
    try {
      await adminPost('/match-delete', { id: match.id }, safeword)
    } catch (err) {
      setDeleting(false)
      if (isUnauthorized(err)) {
        safewordStore.clear()
        setNotice('La palabra clave ya no es válida. Escríbela de nuevo para continuar.')
        setAskSafeword(true)
      } else {
        setError(errorMessage(err))
      }
      return
    }

    // Primero se sale del detalle: si se quitara antes de la caché, la página lo pediría otra vez (404).
    queryClient.setQueryData<MatchSummary[]>(matchesKeys.list(), (items) => items?.filter((item) => item.id !== match.id))
    navigate('/matches', { replace: true })
    queryClient.removeQueries({ queryKey: matchesKeys.detail(match.slug) })
    void refreshMatchData(queryClient).catch(() => undefined)
  }

  let footer: ReactNode
  if (askSafeword) {
    footer = (
      <>
        <Button variant="ghost" onClick={handleClose} disabled={verifying}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} variant="primary" disabled={verifying}>
          {verifying ? 'Comprobando…' : 'Continuar'}
        </Button>
      </>
    )
  } else {
    footer = (
      <>
        <Button variant="ghost" onClick={handleClose} disabled={deleting}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={() => void handleDelete()} disabled={deleting}>
          {deleting ? 'Eliminando…' : 'Eliminar partido'}
        </Button>
      </>
    )
  }

  const videoCount = match.videos.length

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Eliminar partido"
      eyebrow={askSafeword ? <Chip tone="ash">Acceso restringido</Chip> : <Chip tone="orange">No se puede deshacer</Chip>}
      footer={footer}
      dismissible={!busy}
      scrollResetKey={askSafeword ? 'safeword' : 'confirm'}
    >
      {askSafeword ? (
        <SafewordStep
          formId={formId}
          notice={notice}
          onBusyChange={setVerifying}
          onVerified={(value) => {
            safewordStore.set(value)
            setNotice(null)
            setAskSafeword(false)
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-coyote-silver">
            Se elimina <span className="font-medium">{matchTitle(match)}</span> ({formatDateShort(match.played_on)})
            {videoCount > 0 ? (
              <>
                {' '}
                {videoCount === 1 ? 'con su video' : <span className="tabular-nums">con sus {videoCountLabel(videoCount)}</span>}
                . Los archivos también se borran del almacenamiento.
              </>
            ) : (
              '.'
            )}
          </p>
          <p className="text-sm text-coyote-ash">El equipo rival se conserva.</p>
          {error && <FormError>{error}</FormError>}
        </div>
      )}
    </Modal>
  )
}
