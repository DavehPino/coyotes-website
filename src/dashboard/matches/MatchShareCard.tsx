// Atajos para publicar el partido: el flyer sale con el marcador, los parciales y el rival ya cargados,
// y el pie de foto se copia listo para pegar en Instagram.
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { MatchDetail } from '@shared/schemas'
import { adminPost, errorMessage } from '../admin/adminApi'
import { useAdminAccess } from '../admin/useSafewordAccess'
import { captionFromMatch, withoutHashtags } from '../flyers/caption'
import { flyerLinkForMatch } from '../flyers/flyerLinks'
import { Button, buttonClasses, Card, FormError } from '../ui'
import { CopyIcon, ImageIcon, PencilIcon } from '../ui/icons'
import { patchMatchDetail } from './api'

export function MatchShareCard({ match }: { match: MatchDetail }) {
  const queryClient = useQueryClient()
  const access = useAdminAccess()
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  const caption = captionFromMatch(match)
  const summary = withoutHashtags(caption)
  const summarySaved = match.summary === summary

  function flash() {
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption)
      flash()
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS): el texto también está en la sección Flyers.
      setError('No se pudo copiar. Abre el flyer y copia el texto desde ahí.')
    }
  }

  /** El resumen se ve en el detalle del partido; hasta ahora solo se editaba en Supabase. */
  async function saveSummary() {
    setBusy(true)
    setError(null)
    try {
      const done = await access.run((safeword) => adminPost('/match-summary', { id: match.id, summary }, safeword))
      if (done) patchMatchDetail(queryClient, match.slug, (current) => ({ ...current, summary }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="share-title">
      <h2 id="share-title" className="mb-2 text-3xl leading-none text-coyote-silver">
        Compartir
      </h2>
      <Card className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-coyote-ash">El flyer y el texto salen del resultado y los parciales.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void copyCaption()} className="pr-4 pl-3.5">
              <CopyIcon className="size-4" strokeWidth={2} />
              {copied ? '¡Copiado!' : 'Copiar pie de foto'}
            </Button>
            <Button onClick={() => void saveSummary()} disabled={busy || summarySaved} className="pr-4 pl-3.5">
              <PencilIcon className="size-4" strokeWidth={2} />
              {summarySaved ? 'Es el resumen' : busy ? 'Guardando…' : 'Usar de resumen'}
            </Button>
            <Link
              to={flyerLinkForMatch(match.slug)}
              className={buttonClasses({ variant: 'primary', className: 'pr-4 pl-3.5' })}
            >
              <ImageIcon className="size-4" strokeWidth={2} />
              Flyer del resultado
            </Link>
          </div>
        </div>
        {error && <FormError>{error}</FormError>}
      </Card>
      {access.dialog}
    </section>
  )
}
