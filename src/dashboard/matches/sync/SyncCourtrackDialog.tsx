import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ApiError } from '@/lib/api'
import { formatDateShort } from '@/lib/dates'
import type {
  CourtrackSyncAction,
  CourtrackSyncLogEntry,
  CourtrackSyncMatch,
  CourtrackSyncQuota,
  CourtrackSyncResult,
  CourtrackSyncStatus,
} from '@shared/schemas'
import { adminPost, errorMessage, isAbort, isUnauthorized, safewordStore } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { Button, buttonClasses, Chip, FormError, Modal, Skeleton, type ChipTone } from '../../ui'
import { AlertIcon, CheckIcon, RefreshIcon } from '../../ui/icons'
import { refreshMatchData } from '../api'

type Step = 'safeword' | 'status' | 'running' | 'result' | 'error'

type SyncCourtrackDialogProps = {
  open: boolean
  /** `finished`: se importó algo y el listado ya se refrescó. */
  onClose: (finished: boolean) => void
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
const formatInstant = (iso: string) => format(new Date(iso), 'd MMM, HH:mm', { locale: es }).replace('.', '')

function quotaLabel(quota: CourtrackSyncQuota): string {
  if (quota.remaining === 0) {
    return quota.resets_at
      ? `Cupo agotado: la próxima sincronización estará disponible el ${formatInstant(quota.resets_at)}.`
      : 'Cupo agotado por hoy.'
  }
  return quota.remaining === 1
    ? `Te queda 1 sincronización de ${quota.limit} en las próximas 24 horas.`
    : `Te quedan ${quota.remaining} sincronizaciones de ${quota.limit} en las próximas 24 horas.`
}

function lastSyncLabel(entry: CourtrackSyncLogEntry): string {
  const when = formatInstant(entry.started_at)
  if (entry.status === 'success' && entry.summary) {
    const { created, updated, adopted, unchanged } = entry.summary
    const changes = created + updated + adopted
    return `${when} · ${changes === 0 ? `sin cambios (${unchanged} al día)` : `${created} nuevos, ${updated} actualizados, ${adopted} vinculados`}`
  }
  if (entry.status === 'error') return `${when} · falló${entry.error ? `: ${entry.error}` : ''}`
  if (entry.status === 'rejected') return `${when} · rechazada por cupo`
  return `${when} · en curso`
}

function Callout({ tone, icon, children }: { tone: 'gold' | 'orange' | 'ash'; icon: ReactNode; children: ReactNode }) {
  const iconTone = {
    gold: 'bg-coyote-ember text-coyote-gold',
    orange: 'bg-coyote-orange/15 text-coyote-orange',
    ash: 'bg-coyote-black text-coyote-ash',
  }[tone]
  return (
    <div className="flex items-start gap-3 rounded-xl bg-coyote-black/60 p-3 shadow-border">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>{icon}</span>
      <div className="min-w-0 flex-1 self-center text-sm text-coyote-ash">{children}</div>
    </div>
  )
}

function StatusView({ status, error, onRetry }: { status: CourtrackSyncStatus | null; error: string | null; onRetry: () => void }) {
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
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-pretty text-coyote-ash">
        Trae los resultados de Liga Podio publicados en la app CourtTrack: partidos jugados con sus parciales, rival,
        fase y cancha. Los partidos ya importados se actualizan y los cargados a mano el mismo día contra el mismo rival
        se vinculan sin duplicarlos. <span className="text-coyote-silver">Vista previa</span> muestra qué haría sin
        guardar nada ni gastar cupo.
      </p>
      {status ? (
        <Callout
          tone={status.quota.remaining === 0 ? 'orange' : 'gold'}
          icon={status.quota.remaining === 0 ? <AlertIcon className="size-5" /> : <RefreshIcon className="size-5" />}
        >
          <span className="tabular-nums">{quotaLabel(status.quota)}</span>
        </Callout>
      ) : (
        <Skeleton className="h-15 w-full rounded-xl" />
      )}
      {status && status.last_syncs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold tracking-wide text-coyote-ash uppercase">Últimas sincronizaciones</h3>
          <ul className="flex flex-col gap-1 text-sm text-coyote-ash">
            {status.last_syncs.map((entry) => (
              <li key={entry.id} className="flex items-start gap-2 tabular-nums">
                <span
                  aria-hidden
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    entry.status === 'success' ? 'bg-coyote-gold' : entry.status === 'running' ? 'bg-coyote-ash' : 'bg-coyote-orange'
                  }`}
                />
                <span className="min-w-0 text-pretty">{lastSyncLabel(entry)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ResultView({ result }: { result: CourtrackSyncResult }) {
  const counters: { label: string; value: number }[] = [
    { label: result.dry_run ? 'Se crearían' : 'Nuevos', value: result.created },
    { label: result.dry_run ? 'Se actualizarían' : 'Actualizados', value: result.updated + result.adopted },
    { label: 'Sin cambios', value: result.unchanged },
    { label: 'Omitidos', value: result.skipped },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-balance text-coyote-silver">{result.league.name}</p>
        <p className="text-xs text-coyote-ash tabular-nums">
          {result.own} de {result.scanned} partidos de la liga son nuestros
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counters.map((counter) => (
          <div key={counter.label} className="flex flex-col gap-0.5 rounded-xl bg-coyote-black/60 px-3 py-2.5 shadow-border">
            <dt className="text-xs text-coyote-ash">{counter.label}</dt>
            <dd className="text-2xl leading-none text-coyote-gold tabular-nums">{counter.value}</dd>
          </div>
        ))}
      </dl>

      {result.rivals_created.length > 0 && (
        <p className="text-sm text-pretty text-coyote-ash">
          {result.dry_run ? 'Rivales que se crearían: ' : 'Rivales creados: '}
          <span className="text-coyote-silver">{result.rivals_created.join(', ')}</span>
        </p>
      )}

      {result.matches.length > 0 && (
        <ol className="flex flex-col gap-2">
          {result.matches.map((match) => (
            <MatchRow key={match.courtrack_id} match={match} dryRun={result.dry_run} />
          ))}
        </ol>
      )}

      <p className="text-xs text-coyote-ash tabular-nums">{quotaLabel(result.quota)}</p>
    </div>
  )
}

function MatchRow({ match, dryRun }: { match: CourtrackSyncMatch; dryRun: boolean }) {
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
  return (
    <li className="flex items-center gap-3 rounded-xl bg-coyote-black/60 p-3 shadow-border">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-coyote-silver">
          {match.home} <span className="text-coyote-gold tabular-nums">{score}</span> {match.away}
        </span>
        <span className="truncate text-xs text-coyote-ash tabular-nums">
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
    </li>
  )
}

/**
 * Sincronización con CourtTrack: palabra clave → cupo y últimas ejecuciones → vista previa o sync → resultado.
 * Habla con /api/admin/courtrack-*, que reenvía al microservicio courtrack-service.
 */
export default function SyncCourtrackDialog({ open, onClose }: SyncCourtrackDialogProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [step, setStep] = useState<Step>(() => (safeword ? 'status' : 'safeword'))
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [status, setStatus] = useState<CourtrackSyncStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [result, setResult] = useState<CourtrackSyncResult | null>(null)
  const [error, setError] = useState<{ message: string; quota: CourtrackSyncQuota | null } | null>(null)
  const [lastDryRun, setLastDryRun] = useState(false)
  const [finished, setFinished] = useState(false)

  const handleUnauthorized = useCallback(() => {
    safewordStore.clear()
    setSafeword(null)
    setNotice('La palabra clave ya no es válida. Escríbela de nuevo para continuar.')
    setStep('safeword')
  }, [])

  const loadStatus = useCallback(
    async (word: string, signal?: AbortSignal) => {
      setStatus(null)
      setStatusError(null)
      try {
        setStatus(await adminPost<CourtrackSyncStatus>('/courtrack-status', {}, word, signal))
      } catch (err) {
        if (isAbort(err)) return
        if (isUnauthorized(err)) return handleUnauthorized()
        setStatusError(errorMessage(err))
      }
    },
    [handleUnauthorized],
  )

  // El cupo se consulta cada vez que se vuelve al paso inicial con la palabra clave ya validada.
  useEffect(() => {
    if (step !== 'status' || !safeword) return
    const controller = new AbortController()
    void loadStatus(safeword, controller.signal)
    return () => controller.abort()
  }, [step, safeword, loadStatus])

  async function run(dryRun: boolean) {
    if (!safeword) return handleUnauthorized()
    setLastDryRun(dryRun)
    setError(null)
    setStep('running')
    try {
      const data = await adminPost<CourtrackSyncResult>('/courtrack-sync', { dry_run: dryRun }, safeword)
      setResult(data)
      setStep('result')
      if (!dryRun && data.created + data.updated + data.adopted + data.rivals_created.length > 0) {
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

  const busy = step === 'running' || verifying
  const remaining = result?.quota.remaining ?? error?.quota?.remaining ?? status?.quota.remaining ?? null
  const canSync = remaining !== null && remaining > 0

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

  const eyebrow =
    step === 'safeword' ? <Chip tone="ash">Acceso restringido</Chip> : <Chip tone="podio">Liga Podio · CourtTrack</Chip>

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
          <Button onClick={() => void run(true)} disabled={!status}>
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
      eyebrow={eyebrow}
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
            setStep('status')
          }}
        />
      )}
      {step === 'status' && (
        <StatusView status={status} error={statusError} onRetry={() => safeword && void loadStatus(safeword)} />
      )}
      {step === 'running' && (
        <Callout tone="gold" icon={<RefreshIcon className="size-5 animate-spin" />}>
          <span aria-live="polite">
            {lastDryRun ? 'Consultando los partidos de la liga en CourtTrack…' : 'Importando los partidos de la liga…'}
          </span>
        </Callout>
      )}
      {step === 'result' && result && (
        <>
          {!lastDryRun && (
            <div className="mb-4">
              <Callout tone="gold" icon={<CheckIcon className="size-5" strokeWidth={2} />}>
                {result.created + result.updated + result.adopted === 0
                  ? 'Todo estaba al día: no hubo cambios.'
                  : 'Los partidos ya están en el dashboard.'}
              </Callout>
            </div>
          )}
          <ResultView result={result} />
        </>
      )}
      {step === 'error' && error && (
        <div className="flex flex-col gap-3">
          <FormError>{error.message}</FormError>
          {error.quota && <p className="text-xs text-coyote-ash tabular-nums">{quotaLabel(error.quota)}</p>}
        </div>
      )}
    </Modal>
  )
}
