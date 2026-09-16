// Atajos para publicar el partido: el flyer sale con el marcador, los parciales y el rival ya cargados.
import { Link } from 'react-router'
import type { MatchDetail } from '@shared/schemas'
import { flyerLinkForMatch } from '../flyers/flyerLinks'
import { buttonClasses, Card } from '../ui'
import { ImageIcon } from '../ui/icons'

export function MatchShareCard({ match }: { match: MatchDetail }) {
  return (
    <section aria-labelledby="share-title">
      <h2 id="share-title" className="mb-2 text-3xl leading-none text-coyote-silver">
        Compartir
      </h2>
      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <p className="text-sm text-coyote-ash">El flyer se arma solo con el resultado y los parciales.</p>
        <Link
          to={flyerLinkForMatch(match.slug)}
          className={buttonClasses({ variant: 'primary', className: 'w-full pr-4 pl-3.5 md:w-auto' })}
        >
          <ImageIcon className="size-4" strokeWidth={2} />
          Flyer del resultado
        </Link>
      </Card>
    </section>
  )
}
