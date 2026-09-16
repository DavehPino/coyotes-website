import { useEffect, useState } from 'react'
import type { Player } from '@shared/schemas'
import { canShareFiles, downloadFile, fileSlug, shareFile } from '@/lib/shareImage'
import { errorMessage } from '../../admin/adminApi'
import { Button } from '../../ui'
import { DownloadIcon, ShareIcon } from '../../ui/icons'
import { indexPlayers, usableSlots, type LineupLike } from '../board/rules'

// El dibujo (y el de los flyers, del que reutiliza fuentes) se descarga aparte, sin retrasar la página.
const loadRenderer = () => import('./renderLineup')

/**
 * Hoja nativa solo en pantallas táctiles (móvil, tablet). En escritorio se descarga aunque el sistema sepa compartir
 * (Chrome en Windows o macOS también lo admite, pero ahí se espera un archivo).
 */
const prefersShare = () =>
  canShareFiles() && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

type ShareLineupButtonProps = {
  /** Lo que hay en cancha ahora, guardado o no. */
  lineup: LineupLike
  players: Player[]
  /** `icon`: fila de la lista de formaciones · `toolbar`: barra de la cancha (texto desde `sm`). */
  variant: 'icon' | 'toolbar'
  disabled?: boolean
}

/**
 * Comparte la formación como PNG con la hoja nativa (móvil) o la descarga (escritorio, o si el navegador no puede
 * compartir archivos). No escribe nada, así que no pide palabra clave.
 */
export function ShareLineupButton({ lineup, players, variant, disabled = false }: ShareLineupButtonProps) {
  const [busy, setBusy] = useState(false)
  const [canShare] = useState(prefersShare)
  const empty = usableSlots(lineup.slots, indexPlayers(players)).length === 0
  const label = canShare ? 'Compartir' : 'Descargar'
  const Icon = canShare ? ShareIcon : DownloadIcon

  // Fuentes y escudo listos antes del toque: la hoja de compartir no espera mucho.
  useEffect(() => {
    void loadRenderer()
      .then(({ preloadLineupAssets }) => preloadLineupAssets())
      .catch(() => undefined)
  }, [])

  async function handleClick() {
    setBusy(true)
    try {
      const { renderLineupBlob } = await loadRenderer()
      const blob = await renderLineupBlob(lineup, players)
      const file = new File([blob], `coyotes-alineacion-${fileSlug(lineup.name) || 'formacion'}.png`, {
        type: 'image/png',
      })
      if (canShare) await shareFile(file)
      else downloadFile(file)
    } catch (err) {
      window.alert(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const actionLabel = `${label} «${lineup.name}» como imagen`

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => void handleClick()}
        disabled={disabled || empty || busy}
        aria-label={actionLabel}
        title={empty ? 'La formación no tiene jugadores en cancha' : actionLabel}
      >
        <Icon className={busy ? 'size-5 animate-pulse' : 'size-5'} />
      </Button>
    )
  }

  return (
    <Button
      variant="secondary"
      onClick={() => void handleClick()}
      disabled={disabled || empty || busy}
      aria-label={actionLabel}
      className="size-11 px-0 sm:size-auto sm:pr-4 sm:pl-3.5"
    >
      <Icon className={['size-5 sm:size-4', busy ? 'animate-pulse' : ''].join(' ')} strokeWidth={2} />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
