// Atajos para publicar el partido: el flyer sale con el marcador, los parciales y el rival ya cargados,
// y el pie de foto se copia listo para pegar en Instagram.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { MatchDetail } from '@shared/schemas'
import { captionFromMatch } from '../flyers/caption'
import { flyerLinkForMatch } from '../flyers/flyerLinks'
import { Button, buttonClasses, Card } from '../ui'
import { CopyIcon, ImageIcon } from '../ui/icons'

export function MatchShareCard({ match }: { match: MatchDetail }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(captionFromMatch(match))
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS): el texto también está en la sección Flyers.
      setCopied(false)
    }
  }

  return (
    <section aria-labelledby="share-title">
      <h2 id="share-title" className="mb-2 text-3xl leading-none text-coyote-silver">
        Compartir
      </h2>
      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <p className="text-sm text-coyote-ash">El flyer y el texto salen del resultado y los parciales.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => void copyCaption()} className="pr-4 pl-3.5">
            <CopyIcon className="size-4" strokeWidth={2} />
            {copied ? '¡Copiado!' : 'Copiar pie de foto'}
          </Button>
          <Link
            to={flyerLinkForMatch(match.slug)}
            className={buttonClasses({ variant: 'primary', className: 'pr-4 pl-3.5' })}
          >
            <ImageIcon className="size-4" strokeWidth={2} />
            Flyer del resultado
          </Link>
        </div>
      </Card>
    </section>
  )
}
