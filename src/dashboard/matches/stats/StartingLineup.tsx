import type { MatchSetLineupPlayer } from '@shared/schemas'
import { BallIcon } from '../../ui/icons'

type StartingLineupProps = { lineup: MatchSetLineupPlayer[] }

/** Zonas vistas desde nuestro campo: delanteras junto a la red (4, 3, 2) y zagueras detrás (5, 6, 1). */
const ROWS = [
  [4, 3, 2],
  [5, 6, 1],
]

/** Formación inicial del set en las seis zonas de la rotación, con quién saca primero; líberos aparte. */
export function StartingLineup({ lineup }: StartingLineupProps) {
  const byZone = new Map(lineup.filter((player) => player.position >= 1 && player.position <= 6).map((player) => [player.position, player]))
  const liberos = lineup.filter((player) => player.position === 0)
  if (byZone.size === 0 && liberos.length === 0) {
    return <p className="text-sm text-coyote-ash">CourtTrack no registró la formación de este set.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border-t-4 border-court-line bg-court p-2" role="group" aria-label="Formación inicial en cancha">
        <p className="mb-2 text-center text-[10px] font-medium tracking-[0.2em] text-court-line/70 uppercase">Red</p>
        <div className="grid grid-cols-3 gap-2">
          {ROWS.flat().map((zone) => {
            const player = byZone.get(zone)
            return (
              <div
                key={zone}
                className="relative flex min-h-16 flex-col items-center justify-center rounded-lg bg-coyote-black/45 px-1 py-2 text-center"
              >
                <span className="sr-only">
                  Zona {zone}
                  {player ? ':' : ', vacía'}
                </span>
                <span aria-hidden className="absolute top-1 left-1.5 text-[10px] text-court-line/50 tabular-nums">
                  {zone}
                </span>
                {player ? (
                  <>
                    <span className="font-display text-2xl leading-none text-coyote-gold tabular-nums">
                      {player.number ?? '–'}
                    </span>
                    <span className="mt-0.5 line-clamp-1 text-[11px] text-coyote-silver">{player.short_name}</span>
                    {player.serving && (
                      <>
                        <BallIcon className="absolute top-1 right-1 size-3.5 text-coyote-yellow" strokeWidth={2} filled />
                        <span className="sr-only">, saca primero</span>
                      </>
                    )}
                  </>
                ) : (
                  <span aria-hidden className="text-xs text-court-line/40">
                    –
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-coyote-ash">
        <span className="inline-flex items-center gap-1">
          <BallIcon className="size-3.5 text-coyote-yellow" strokeWidth={2} filled />
          saca primero
        </span>
        {liberos.length > 0 && (
          <span>
            Líbero: {liberos.map((player) => `${player.number === null ? '' : `#${player.number} `}${player.short_name}`).join(', ')}
          </span>
        )}
      </p>
    </div>
  )
}
