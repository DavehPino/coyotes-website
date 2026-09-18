import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ApiError } from '@/lib/api'
import { formatDateShort } from '@/lib/dates'
import type {
  CourtrackSeasonEvent,
  CourtrackSyncAction,
  CourtrackSyncAllResult,
  CourtrackSyncLeague,
  CourtrackSyncLeagueResult,
  CourtrackSyncLogEntry,
  CourtrackSyncMatch,
  CourtrackSyncQuota,
  CourtrackSyncResult,
  CourtrackSyncStatus,
  CourtrackSyncSummary,
} from '@shared/schemas'
import { adminPost, errorMessage, isUnauthorized, safewordStore } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { useRivalTeams } from '../../admin/teams'
import { Button, buttonClasses, Chip, Field, FormError, Modal, Select, Skeleton, type ChipTone } from '../../ui'
import { AlertIcon, CheckIcon, RefreshIcon, TrophyIcon } from '../../ui/icons'
import { refreshMatchData } from '../api'
import { courtrackKeys, useCourtrackStatus } from './queries'

type Step = 'safeword' | 'status' | 'running' | 'result' | 'error'

/** '' = todas las ligas activas. */
const ALL = ''

type SyncCourtrackDialogProps = {
  open: boolean
  /** Temporada preseleccionada (desde el gestor de ligas). */
  initialLeagueId?: string | null
  /** `finished`: se importó algo y el listado ya se refrescó. */
  onClose: (finished: boolean) => void
  /** Abre el gestor de ligas (cuando no hay ninguna configurada). */
  onManageLeagues: () => void
}

/** Resultado normalizado: un sync de una temporada se muestra igual que uno de todas. */
type Outcome = {
  dry_run: boolean
  leagues: CourtrackSyncLeagueResult[]
  totals: CourtrackSyncSummary
  quota: CourtrackSyncQuota
}

const ACTION_LABELS: Record<CourtrackSyncAction, string> = {
  created: 'Nuevo',
  updated: 'Actualizado',
  adopted: 'Vinculado',
  unchanged: 'Sin cambios',
  skipped: 'Omitido',
}

const ACTION_TONES: Record<CourtrackSyncAction, ChipTone> = {
  created: 'gold-solid',
  updated: 'gold',
  adopted: 'yellow',
  unchanged: 'ash',
  skipped: 'steel',
}

/** "16 sep, 11:02" a partir de un instante ISO (hora local de quien mira). */
export const formatInstant = (iso: string) => format(new Date(iso), 'd MMM, HH:mm', { locale: es }).replace('.', '')

export function quotaLabel(quota: CourtrackSyncQuota): string {
  if (quota.remaining === 0) {
    return quota.resets_at
      ? `Cupo agotado: la próxima sincronización estará disponible el ${formatInstant(quota.resets_at)}.`
      : 'Cupo agotado por hoy.'
  }
  return quota.remaining === 1
    ? `Te queda 1 sincronización de ${quota.limit} en las próximas 24 horas.`
    : `Te quedan ${quota.remaining} sincronizaciones de ${quota.limit} en las próximas 24 horas.`
}

function summaryLabel(summary: CourtrackSyncSummary): string {
  const changes = summary.created + summary.updated + summary.adopted
  return changes === 0
    ? `sin cambios (${summary.unchanged} al día)`
    : `${summary.created} nuevos, ${summary.updated} actualizados, ${summary.adopted} vinculados`
}

/** Último sync de una temporada (si fue un sync de todas, su resumen particular). */
export function lastSyncLabel(entry: CourtrackSyncLogEntry, leagueId?: string): string {
  const when = formatInstant(entry.started_at)
  if (entry.status === 'success') {
    const summary = (leagueId && entry.leagues?.[leagueId]) ?? entry.summary
    return summary ? `${when} · ${summaryLabel(summary)}` : when
  }
  if (entry.status === 'error') return `${when} · falló${entry.error ? `: ${entry.error}` : ''}`
  if (entry.status === 'rejected') return `${when} · rechazada por cupo`
  return `${when} · en curso`
}

export function Callout({ tone, icon, children }: { tone: 'gold' | 'orange' | 'ash'; icon: ReactNode; children: ReactNode }) {
  const iconTone = {
    gold: 'bg-paper-deep text-ink',
    orange: 'bg-danger/12 text-danger-deep',
    ash: 'bg-surface text-ink-soft',
  }[tone]
  return (
    <div className="flex items-start gap-3 rounded-md bg-paper-deep/40 p-3 shadow-outline">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-sm ${iconTone}`}>{icon}</span>
      <div className="min-w-0 flex-1 self-center text-sm text-ink-soft">{children}</div>
    </div>
  )
}

function seasonEventLabel(event: CourtrackSeasonEvent, dryRun: boolean): string {
  if (event.kind === 'removed') {
    return dryRun
      ? `La liga ya no existe en CourtTrack: la temporada "${event.archived_season}" se archivaría con su clasificación.`
      : `La liga ya no existe en CourtTrack: la temporada "${event.archived_season}" quedó archivada con su clasificación.`
  }
  return dryRun
    ? `CourtTrack reinició la liga: "${event.archived_season}" se archivaría y empezaría la temporada "${event.new_season}".`
    : `CourtTrack reinició la liga: "${event.archived_season}" quedó archivada y empezó la temporada "${event.new_season}".`
}

type StatusViewProps = {
  status: CourtrackSyncStatus | null
  error: string | null
  leagueId: string
  onLeagueChange: (id: string) => void
  onRetry: () => void
  onManageLeagues: () => void
}

function StatusView({ status, error, leagueId, onLeagueChange, onRetry, onManageLeagues }: StatusViewProps) {
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <FormError>{error}</FormError>
        <Button size="sm" className="self-start pr-3.5 pl-3" onClick={onRetry}>
          <RefreshIcon className="size-4" strokeWidth={2} />
          Reintentar
        </Button>
      </div>
    )
  }
  if (!status) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-sm" />
        <Skeleton className="h-15 w-full rounded-md" />
      </div>
    )
  }

  const active = status.leagues.filter((league) => league.is_active && !league.archived_at)
  if (active.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Callout tone="ash" icon={<TrophyIcon className="size-5" />}>
          {status.leagues.length === 0
            ? 'Todavía no hay ninguna liga de CourtTrack configurada.'
            : 'No hay ligas en curso: todas las temporadas terminaron. Añade la nueva desde Ligas.'}
        </Callout>
        <Button variant="primary" className="self-start" onClick={onManageLeagues}>
          Gestionar ligas
        </Button>
      </div>
    )
  }

  const chosen = active.find((item) => item.id === leagueId) ?? null
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-pretty text-ink-soft">
        Trae de CourtTrack los partidos jugados de tus ligas: parciales, rival, fase y cancha. Los ya importados se
        actualizan y los cargados a mano el mismo día contra el mismo rival se vinculan sin duplicarlos. Si CourtTrack
        reinició una liga, la temporada anterior se archiva con su clasificación.{' '}
        <span className="text-ink">Vista previa</span> muestra qué haría sin guardar nada ni gastar cupo.
      </p>
      {active.length > 1 ? (
        <Field label="Qué sincronizar" hint="Todas las ligas juntas consumen un solo cupo.">
          <Select value={chosen?.id ?? ALL} onChange={(event) => onLeagueChange(event.target.value)}>
            <option value={ALL}>Todas las ligas activas ({active.length})</option>
            {active.map((item) => (
              <option key={item.id} value={item.id}>
                {item.season_label} · {item.competition.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <LeagueSummary league={active[0]!} />
      )}
      {(chosen ?? (active.length === 1 ? active[0] : null)) && (
        <p className="text-xs text-ink-soft tabular-nums">
          {(() => {
            const league = chosen ?? active[0]!
            return league.last_sync
              ? `Último sync de esta liga: ${lastSyncLabel(league.last_sync, league.id)}`
              : 'Esta liga todavía no se sincronizó.'
          })()}
        </p>
      )}
      <Callout
        tone={status.quota.remaining === 0 ? 'orange' : 'gold'}
        icon={status.quota.remaining === 0 ? <AlertIcon className="size-5" /> : <RefreshIcon className="size-5" />}
      >
        <span className="tabular-nums">{quotaLabel(status.quota)}</span>
      </Callout>
    </div>
  )
}

function LeagueSummary({ league }: { league: CourtrackSyncLeague }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-paper-deep/40 p-3 shadow-outline">
      {league.team_logo_url ? (
        <img
          src={league.team_logo_url}
          alt=""
          className="size-9 shrink-0 rounded-sm bg-white/90 object-contain p-0.5 outline-1 outline-white/10"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-paper-deep text-ink">
          <TrophyIcon className="size-5" />
        </span>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-ink">{league.season_label}</span>
        <span className="truncate text-xs text-ink-soft">
          {league.competition.name} · {league.cliente_name ?? 'CourtTrack'} · como {league.team_name}
        </span>
      </div>
    </div>
  )
}

function Counters({ summary, dryRun }: { summary: CourtrackSyncSummary; dryRun: boolean }) {
  const counters: { label: string; value: number }[] = [
    { label: dryRun ? 'Se crearían' : 'Nuevos', value: summary.created },
    { label: dryRun ? 'Se actualizarían' : 'Actualizados', value: summary.updated + summary.adopted },
    { label: 'Sin cambios', value: summary.unchanged },
    { label: 'Omitidos', value: summary.skipped },
  ]
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {counters.map((counter) => (
        <div key={counter.label} className="flex flex-col gap-0.5 rounded-md bg-paper-deep/40 px-3 py-2.5 shadow-outline">
          <dt className="text-xs text-ink-soft">{counter.label}</dt>
          <dd className="text-2xl leading-none text-ink tabular-nums">{counter.value}</dd>
        </div>
      ))}
    </dl>
  )
}

type LinkRival = ((courtrackName: string, teamId: string) => Promise<void>) | null

function LeagueResultView({
  result,
  dryRun,
  onLinkRival,
  compact,
}: {
  result: CourtrackSyncLeagueResult
  dryRun: boolean
  onLinkRival: LinkRival
  /** Dentro de un sync de varias ligas: sin contadores propios. */
  compact: boolean
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={result.league.season_label}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-balance text-ink">
          {result.league.season_label} · {result.league.competition.name}
        </p>
        <p className="text-xs text-ink-soft tabular-nums">
          {result.own} de {result.scanned} partidos de la liga son nuestros
          {compact ? ` · ${summaryLabel(result)}` : ''}
        </p>
      </div>

      {result.season_event && (
        <Callout tone="orange" icon={<AlertIcon className="size-5" />}>
          {seasonEventLabel(result.season_event, dryRun)}
        </Callout>
      )}

      {!compact && <Counters summary={result} dryRun={dryRun} />}

      {result.rivals_created.length > 0 && (
        <p className="text-sm text-pretty text-ink-soft">
          {dryRun ? 'Rivales que se crearían: ' : 'Rivales creados: '}
          <span className="text-ink">{result.rivals_created.join(', ')}</span>
          {onLinkRival && ' Si alguno ya está cargado con otro nombre, vincúlalo abajo antes de sincronizar.'}
        </p>
      )}

      {result.matches.length > 0 && (
        <ol className="flex flex-col gap-2">
          {result.matches.map((match) => (
            <MatchRow key={match.courtrack_id} match={match} dryRun={dryRun} onLinkRival={onLinkRival} />
          ))}
        </ol>
      )}
    </section>
  )
}

function OutcomeView({ outcome, onLinkRival }: { outcome: Outcome; onLinkRival: LinkRival }) {
  const several = outcome.leagues.length > 1
  return (
    <div className="flex flex-col gap-5">
      {several && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-ink-soft tabular-nums">{outcome.leagues.length} ligas sincronizadas con un solo cupo</p>
          <Counters summary={outcome.totals} dryRun={outcome.dry_run} />
        </div>
      )}
      {outcome.leagues.map((result) => (
        <LeagueResultView key={result.league.id} result={result} dryRun={outcome.dry_run} onLinkRival={onLinkRival} compact={several} />
      ))}
      <p className="text-xs text-ink-soft tabular-nums">{quotaLabel(outcome.quota)}</p>
    </div>
  )
}

type MatchRowProps = { match: CourtrackSyncMatch; dryRun: boolean; onLinkRival: LinkRival }

function MatchRow({ match, dryRun, onLinkRival }: MatchRowProps) {
  const played = match.status === 'played'
  const score = played ? `${match.home_sets ?? '–'} – ${match.away_sets ?? '–'}` : 'vs'
  const detail =
    match.reason ??
    (match.opponent?.created
      ? `Rival nuevo: ${match.opponent.name}`
      : match.opponent?.renamed_from
        ? `Rival renombrado: ${match.opponent.renamed_from} → ${match.opponent.name}`
        : null)
  const showLink = !dryRun && match.slug && match.action !== 'skipped'
  const canLink = onLinkRival !== null && match.opponent?.created === true
  return (
    <li className="flex flex-col gap-2.5 rounded-md bg-paper-deep/40 p-3 shadow-outline">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-ink">
            {match.home} <span className="text-ink tabular-nums">{score}</span> {match.away}
          </span>
          <span className="truncate text-xs text-ink-soft tabular-nums">
            {formatDateShort(match.played_on)}
            {match.start_time ? ` · ${match.start_time}` : ''}
            {detail ? ` · ${detail}` : ''}
          </span>
        </div>
        {showLink ? (
          <Link
            to={`/matches/${match.slug}`}
            className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'px-3' })}
            aria-label={`Ver partido ${match.home} contra ${match.away}`}
          >
            <Chip tone={ACTION_TONES[match.action]}>{ACTION_LABELS[match.action]}</Chip>
          </Link>
        ) : (
          <Chip tone={ACTION_TONES[match.action]}>{ACTION_LABELS[match.action]}</Chip>
        )}
      </div>
      {canLink && match.opponent && <LinkRivalField courtrackName={match.opponent.courtrack_name} onLink={onLinkRival} />}
    </li>
  )
}

/** "¿Es un rival ya cargado?": select de rivales que crea el vínculo y vuelve a previsualizar. */
function LinkRivalField({
  courtrackName,
  onLink,
}: {
  courtrackName: string
  onLink: (courtrackName: string, teamId: string) => Promise<void>
}) {
  const rivals = useRivalTeams()
  const [busy, setBusy] = useState(false)
  return (
    <Field label={`¿"${courtrackName}" es un rival ya cargado?`} className="text-xs">
      <Select
        value=""
        disabled={busy || rivals.isPending}
        onChange={(event) => {
          const teamId = event.target.value
          if (!teamId) return
          setBusy(true)
          void onLink(courtrackName, teamId).finally(() => setBusy(false))
        }}
      >
        <option value="">{busy ? 'Vinculando…' : 'No, es un rival nuevo'}</option>
        {rivals.data?.map((rival) => (
          <option key={rival.id} value={rival.id}>
            Sí, es {rival.name}
          </option>
        ))}
      </Select>
    </Field>
  )
}

function toOutcome(data: CourtrackSyncResult | CourtrackSyncAllResult): Outcome {
  if ('leagues' in data) return data
  const { quota, ...league } = data
  return {
    dry_run: data.dry_run,
    leagues: [league],
    totals: {
      scanned: data.scanned,
      own: data.own,
      created: data.created,
      updated: data.updated,
      adopted: data.adopted,
      unchanged: data.unchanged,
      skipped: data.skipped,
      rivals_created: data.rivals_created,
    },
    quota,
  }
}

/**
 * Sincronización con CourtTrack: palabra clave → qué sincronizar (todas las ligas activas o una), cupo y último sync →
 * vista previa o sync → resultado. Habla con /api/admin/courtrack-*, que reenvía al microservicio courtrack-service.
 */
export default function SyncCourtrackDialog({ open, initialLeagueId, onClose, onManageLeagues }: SyncCourtrackDialogProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [step, setStep] = useState<Step>(() => (safeword ? 'status' : 'safeword'))
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [leagueId, setLeagueId] = useState<string>(initialLeagueId ?? ALL)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [error, setError] = useState<{ message: string; quota: CourtrackSyncQuota | null } | null>(null)
  const [lastDryRun, setLastDryRun] = useState(false)
  const [finished, setFinished] = useState(false)

  const handleUnauthorized = useCallback(() => {
    safewordStore.clear()
    setSafeword(null)
    setNotice('La palabra clave ya no es válida. Escríbela de nuevo para continuar.')
    setStep('safeword')
  }, [])

  // Cupo y ligas cacheados 25 s (compartidos con el gestor de Ligas): volver al paso inicial no vuelve a pedirlos.
  const statusQuery = useCourtrackStatus(safeword)
  const status: CourtrackSyncStatus | null = statusQuery.data ?? null
  const statusError = statusQuery.error ? errorMessage(statusQuery.error) : null

  useEffect(() => {
    if (isUnauthorized(statusQuery.error)) handleUnauthorized()
  }, [statusQuery.error, handleUnauthorized])

  // Una temporada elegida que ya no está en curso vuelve a "todas".
  useEffect(() => {
    if (!status) return
    setLeagueId((current) => {
      const active = status.leagues.filter((league) => league.is_active && !league.archived_at)
      if (current !== ALL && !active.some((league) => league.id === current)) return ALL
      return current
    })
  }, [status])

  async function run(dryRun: boolean) {
    if (!safeword) return handleUnauthorized()
    setLastDryRun(dryRun)
    setError(null)
    setStep('running')
    try {
      const data = await adminPost<CourtrackSyncResult | CourtrackSyncAllResult>(
        '/courtrack-sync',
        { ...(leagueId ? { league_id: leagueId } : {}), dry_run: dryRun },
        safeword,
      )
      const result = toOutcome(data)
      setOutcome(result)
      setStep('result')
      const changes = result.totals.created + result.totals.updated + result.totals.adopted + result.totals.rivals_created.length
      const seasonChanges = result.leagues.some((league) => league.season_event)
      if (!dryRun) {
        // El cupo y el último sync cambiaron: la próxima apertura del diálogo o del gestor los vuelve a pedir.
        void queryClient.invalidateQueries({ queryKey: courtrackKeys.all })
      }
      if (!dryRun && (changes > 0 || seasonChanges)) {
        setFinished(true)
        await refreshMatchData(queryClient)
      }
    } catch (err) {
      if (isUnauthorized(err)) return handleUnauthorized()
      const quota =
        err instanceof ApiError && err.status === 429
          ? ((err.details as { quota?: CourtrackSyncQuota } | undefined)?.quota ?? null)
          : null
      setError({ message: errorMessage(err), quota })
      setStep('error')
    }
  }

  /** Vincula un nombre de CourtTrack a un rival existente y repite la vista previa. */
  async function linkRival(courtrackName: string, teamId: string) {
    if (!safeword) return handleUnauthorized()
    try {
      await adminPost('/team-link-create', { courtrack_name: courtrackName, team_id: teamId }, safeword)
    } catch (err) {
      if (isUnauthorized(err)) return handleUnauthorized()
      setError({ message: errorMessage(err), quota: null })
      setStep('error')
      return
    }
    await run(true)
  }

  const busy = step === 'running' || verifying
  const active = status?.leagues.filter((league) => league.is_active && !league.archived_at) ?? []
  const remaining = outcome?.quota.remaining ?? error?.quota?.remaining ?? status?.quota.remaining ?? null
  const canSync = remaining !== null && remaining > 0 && active.length > 0
  const scopeLabel =
    leagueId === ALL
      ? active.length === 1
        ? active[0]!.season_label
        : active.length > 1
          ? 'Todas las ligas activas'
          : null
      : (active.find((league) => league.id === leagueId)?.season_label ?? null)

  function handleClose() {
    if (busy) return
    onClose(finished)
  }

  const titles: Record<Step, string> = {
    safeword: 'Sincronizar con CourtTrack',
    status: 'Sincronizar con CourtTrack',
    running: lastDryRun ? 'Consultando CourtTrack…' : 'Sincronizando…',
    result: lastDryRun ? 'Vista previa' : 'Sincronización completada',
    error: 'No se pudo sincronizar',
  }

  const meta =
    step === 'safeword' ? (
      null
    ) : (
      <>
        <Chip tone="podio">CourtTrack</Chip>
        {/* El alcance va como texto que puede partir línea, no dentro de la etiqueta (en móvil se cortaba). */}
        {scopeLabel && <span>{scopeLabel}</span>}
      </>
    )

  let footer: ReactNode = null
  switch (step) {
    case 'safeword':
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
      break
    case 'status':
      footer = (
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={() => void run(true)} disabled={!status || active.length === 0}>
            Vista previa
          </Button>
          <Button variant="primary" onClick={() => void run(false)} disabled={!status || !canSync}>
            Sincronizar
          </Button>
        </>
      )
      break
    case 'result':
      footer = lastDryRun ? (
        <>
          <Button variant="ghost" onClick={() => setStep('status')}>
            Atrás
          </Button>
          <Button variant="primary" onClick={() => void run(false)} disabled={!canSync}>
            Sincronizar ahora
          </Button>
        </>
      ) : (
        <Button variant="primary" onClick={handleClose}>
          Cerrar
        </Button>
      )
      break
    case 'error':
      footer = (
        <>
          <Button variant="ghost" onClick={() => setStep('status')}>
            Atrás
          </Button>
          <Button variant="primary" onClick={() => void run(lastDryRun)} disabled={!lastDryRun && !canSync}>
            Reintentar
          </Button>
        </>
      )
      break
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={titles[step]}
      meta={meta}
      footer={footer}
      dismissible={!busy}
      scrollResetKey={step}
    >
      {step === 'safeword' && (
        <SafewordStep
          formId={formId}
          notice={notice}
          onBusyChange={setVerifying}
          description="Solo el cuerpo técnico puede importar resultados. Escribe la palabra clave del equipo para continuar."
          onVerified={(value) => {
            safewordStore.set(value)
            setSafeword(value)
            setNotice(null)
            void queryClient.invalidateQueries({ queryKey: courtrackKeys.status })
            setStep('status')
          }}
        />
      )}
      {step === 'status' && (
        <StatusView
          status={status}
          error={statusError}
          leagueId={leagueId}
          onLeagueChange={setLeagueId}
          onRetry={() => void statusQuery.refetch()}
          onManageLeagues={onManageLeagues}
        />
      )}
      {step === 'running' && (
        <Callout tone="gold" icon={<RefreshIcon className="size-5 animate-spin motion-reduce:animate-none" />}>
          <span aria-live="polite">
            {lastDryRun ? 'Consultando los partidos en CourtTrack…' : 'Importando los partidos de tus ligas…'}
          </span>
        </Callout>
      )}
      {step === 'result' && outcome && (
        <>
          {!lastDryRun && (
            <div className="mb-4">
              <Callout tone="gold" icon={<CheckIcon className="size-5" strokeWidth={2} />}>
                {outcome.totals.created + outcome.totals.updated + outcome.totals.adopted === 0
                  ? 'Todo estaba al día: no hubo cambios.'
                  : 'Los partidos ya están en el dashboard.'}
              </Callout>
            </div>
          )}
          <OutcomeView outcome={outcome} onLinkRival={outcome.dry_run ? linkRival : null} />
        </>
      )}
      {step === 'error' && error && (
        <div className="flex flex-col gap-3">
          <FormError>{error.message}</FormError>
          {error.quota && <p className="text-xs text-ink-soft tabular-nums">{quotaLabel(error.quota)}</p>}
        </div>
      )}
    </Modal>
  )
}
