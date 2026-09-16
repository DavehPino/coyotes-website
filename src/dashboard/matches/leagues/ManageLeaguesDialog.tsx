import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TEAM_NAME } from '@/config'
import { slugify } from '@shared/matches'
import type {
  CourtrackCliente,
  CourtrackDiscoveredLiga,
  CourtrackLeague,
  CourtrackLeagueSnapshot,
  CourtrackSyncLeague,
  CourtrackSyncStatus,
  LeagueCreateInput,
} from '@shared/schemas'
import { formatDateShort } from '@/lib/dates'
import { adminPost, errorMessage, isAbort, isUnauthorized, safewordStore } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { Button, Chip, Field, FormError, Input, Modal, Skeleton } from '../../ui'
import { CheckIcon, ChevronRightIcon, PlusIcon, RefreshIcon, TrophyIcon } from '../../ui/icons'
import { competitionsKey } from '../competitions'
import { courtrackKeys, useCourtrackStatus, useLeagueSnapshot } from '../sync/queries'
import { Callout, formatInstant, lastSyncLabel } from '../sync/SyncCourtrackDialog'

type WizardStep = 'cliente' | 'descubrir'
type Step = 'safeword' | 'list' | WizardStep | 'confirm-delete' | 'standings'

const WIZARD_TITLES: Record<WizardStep, string> = {
  cliente: 'Asociación',
  descubrir: 'Tus ligas',
}

const ARCHIVE_REASONS: Record<NonNullable<CourtrackLeague['archive_reason']>, string> = {
  reset: 'CourtTrack reinició la liga',
  removed: 'la liga ya no existe en CourtTrack',
}

type ManageLeaguesDialogProps = {
  open: boolean
  /** `changed`: se añadió o quitó alguna liga. */
  onClose: (changed: boolean) => void
  /** Cierra este diálogo y abre el de sincronización con esa temporada. */
  onSyncLeague: (leagueId: string) => void
}

type Wizard = { cliente: CourtrackCliente | null }

const emptyWizard = (): Wizard => ({ cliente: null })

const normalize = (text: string) => slugify(text)

function Logo({ src, fallback }: { src: string | null; fallback: ReactNode }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className="size-9 shrink-0 rounded-lg bg-white/90 object-contain p-0.5 outline-1 outline-white/10" />
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-coyote-ember text-coyote-gold">{fallback}</span>
  )
}

function RetryError({ error, onRetry }: { error: string; onRetry: () => void }) {
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

type PickListProps<T> = {
  items: T[] | null
  error: string | null
  search: string
  onSearch: (value: string) => void
  searchPlaceholder: string
  keyOf: (item: T) => string | number
  matches: (item: T, needle: string) => boolean
  selectedKey?: string | number | null
  onPick: (item: T) => void
  render: (item: T) => ReactNode
  emptyLabel: string
  onRetry: () => void
}

/** Lista con buscador para elegir un elemento del catálogo de CourtTrack. */
function PickList<T>({
  items,
  error,
  search,
  onSearch,
  searchPlaceholder,
  keyOf,
  matches,
  selectedKey,
  onPick,
  render,
  emptyLabel,
  onRetry,
}: PickListProps<T>) {
  if (error) return <RetryError error={error} onRetry={onRetry} />
  const needle = normalize(search)
  const visible = items?.filter((item) => !needle || matches(item, needle)) ?? null
  return (
    <div className="flex flex-col gap-3">
      <Input
        data-autofocus
        type="search"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        autoComplete="off"
      />
      {visible === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-coyote-ash">{emptyLabel}</p>
      ) : (
        <ul className="flex max-h-[45dvh] flex-col gap-1.5 overflow-y-auto">
          {visible.map((item) => {
            const selected = selectedKey !== undefined && selectedKey !== null && keyOf(item) === selectedKey
            return (
              <li key={keyOf(item)}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onPick(item)}
                  className={[
                    'flex min-h-14 w-full items-center gap-3 rounded-xl p-2.5 pr-3 text-left transition-[background-color,box-shadow] duration-150 ease-out',
                    selected ? 'bg-coyote-ember shadow-gold' : 'bg-coyote-black/60 shadow-border hover:bg-coyote-ember/60 hover:shadow-border-hover',
                  ].join(' ')}
                >
                  {render(item)}
                  <ChevronRightIcon className="size-4 shrink-0 text-coyote-ash" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

type LeagueRowProps = {
  league: CourtrackSyncLeague
  busy: boolean
  onSync: () => void
  onDelete: () => void
  onStandings: () => void
}

function LeagueRow({ league, busy, onSync, onDelete, onStandings }: LeagueRowProps) {
  const archived = league.archived_at !== null
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-coyote-black/60 p-3 shadow-border">
      <div className="flex items-start gap-3">
        <Logo src={league.team_logo_url} fallback={<TrophyIcon className="size-5" />} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-balance text-coyote-silver">{league.season_label}</span>
          <span className="text-xs text-pretty text-coyote-ash">
            {league.competition.name} · {league.cliente_name ?? 'CourtTrack'} · como {league.team_name}
          </span>
          <span className="text-xs text-coyote-ash tabular-nums">
            {archived
              ? `Finalizada el ${formatDateShort(league.archived_at!.slice(0, 10))}${league.archive_reason ? ` · ${ARCHIVE_REASONS[league.archive_reason]}` : ''}`
              : league.last_sync
                ? lastSyncLabel(league.last_sync, league.id)
                : 'Todavía no se sincronizó'}
          </span>
        </div>
        <Chip tone={archived ? 'steel' : 'gold'}>{archived ? 'Finalizada' : 'En curso'}</Chip>
      </div>
      <div className="flex flex-wrap gap-2">
        {!archived && (
          <Button size="sm" variant="primary" className="pr-3.5 pl-3" onClick={onSync} disabled={busy}>
            <RefreshIcon className="size-4" strokeWidth={2} />
            Sincronizar
          </Button>
        )}
        {league.snapshot_at && (
          <Button size="sm" onClick={onStandings} disabled={busy}>
            Clasificación
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy} className="ml-auto text-coyote-orange">
          Quitar
        </Button>
      </div>
    </li>
  )
}

/** Tabla de posiciones guardada: CourtTrack devuelve filas [pos, equipo, pts, pj, pg, pp, ...]. */
function StandingsView({ snapshot, teamName }: { snapshot: CourtrackLeagueSnapshot; teamName: string }) {
  const tables = (snapshot.standings ?? []).flatMap((table) => {
    if (!table || typeof table !== 'object') return []
    const { titulo, division, descripcion_etapa, posiciones } = table as {
      titulo?: unknown
      division?: unknown
      descripcion_etapa?: unknown
      posiciones?: unknown
    }
    if (!Array.isArray(posiciones)) return []
    const rows = posiciones.flatMap((row) => (Array.isArray(row) && row.length >= 6 ? [row as unknown[]] : []))
    const label = [descripcion_etapa, division, titulo].filter((part) => typeof part === 'string' && part).join(' · ')
    return [{ label: label || 'Clasificación', rows }]
  })

  if (tables.length === 0) {
    return <p className="text-sm text-coyote-ash">Esta temporada no tiene clasificación guardada.</p>
  }
  return (
    <div className="flex flex-col gap-4">
      {snapshot.snapshot_at && (
        <p className="text-xs text-coyote-ash tabular-nums">Instantánea de CourtTrack del {formatInstant(snapshot.snapshot_at)}.</p>
      )}
      {tables.map((table) => (
        <section key={table.label} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-coyote-ash uppercase">{table.label}</h3>
          <div className="overflow-x-auto rounded-xl bg-coyote-black/60 shadow-border">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs text-coyote-ash">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-2 py-2 font-medium">Equipo</th>
                  <th className="px-2 py-2 text-right font-medium">Pts</th>
                  <th className="px-2 py-2 text-right font-medium">PJ</th>
                  <th className="px-2 py-2 text-right font-medium">PG</th>
                  <th className="px-3 py-2 text-right font-medium">PP</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, index) => {
                  const name = String(row[1] ?? '')
                  const own = normalize(name) === normalize(teamName)
                  return (
                    <tr key={index} className={own ? 'bg-coyote-ember/70 text-coyote-gold' : 'text-coyote-silver'}>
                      <td className="px-3 py-1.5">{String(row[0] ?? index + 1)}</td>
                      <td className="px-2 py-1.5 font-medium">{name}</td>
                      <td className="px-2 py-1.5 text-right">{String(row[2] ?? '')}</td>
                      <td className="px-2 py-1.5 text-right">{String(row[3] ?? '')}</td>
                      <td className="px-2 py-1.5 text-right">{String(row[4] ?? '')}</td>
                      <td className="px-3 py-1.5 text-right">{String(row[5] ?? '')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Ligas de CourtTrack que sigue el equipo: temporadas en curso y finalizadas (las cierra el sync solo) con su
 * clasificación, quitar, y el asistente "Agregar liga": asociación → ligas de esa asociación donde aparece el equipo
 * (solo se pueden añadir esas: no hay alta a mano). Estado y clasificación vienen cacheados de `sync/queries.ts`.
 */
export default function ManageLeaguesDialog({ open, onClose, onSyncLeague }: ManageLeaguesDialogProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [step, setStep] = useState<Step>(() => (safeword ? 'list' : 'safeword'))
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)
  const [justAdded, setJustAdded] = useState<CourtrackLeague[]>([])
  const [target, setTarget] = useState<CourtrackSyncLeague | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  // Asistente
  const [wizard, setWizard] = useState<Wizard>(emptyWizard)
  const [clientes, setClientes] = useState<CourtrackCliente[] | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [wizardError, setWizardError] = useState<string | null>(null)
  // Descubrimiento
  const [teamQuery, setTeamQuery] = useState(TEAM_NAME)
  const [discovered, setDiscovered] = useState<CourtrackDiscoveredLiga[] | null>(null)
  const [discovering, setDiscovering] = useState(false)
  const [picked, setPicked] = useState<Set<number>>(new Set())

  const handleUnauthorized = useCallback(() => {
    safewordStore.clear()
    setSafeword(null)
    setNotice('La palabra clave ya no es válida. Escríbela de nuevo para continuar.')
    setStep('safeword')
  }, [])

  // Estado (cupo, temporadas, último sync) cacheado 25 s: ir y volver entre pasos no vuelve a pedirlo.
  const statusQuery = useCourtrackStatus(safeword)
  const status: CourtrackSyncStatus | null = statusQuery.data ?? null
  const statusError = statusQuery.error ? errorMessage(statusQuery.error) : null
  const snapshotQuery = useLeagueSnapshot(safeword, step === 'standings' && target ? target.id : null)
  const snapshot: CourtrackLeagueSnapshot | null = snapshotQuery.data ?? null
  const snapshotError = snapshotQuery.error ? errorMessage(snapshotQuery.error) : null

  useEffect(() => {
    if (isUnauthorized(statusQuery.error) || isUnauthorized(snapshotQuery.error)) handleUnauthorized()
  }, [statusQuery.error, snapshotQuery.error, handleUnauthorized])

  const invalidateStatus = () => queryClient.invalidateQueries({ queryKey: courtrackKeys.status })

  const configuredLigaIds = new Set((status?.leagues ?? []).filter((league) => !league.archived_at).map((league) => league.liga_id))

  /** Asociaciones de CourtTrack (se piden una vez por sesión del diálogo). */
  const loadClientes = useCallback(
    async (word: string, signal?: AbortSignal) => {
      setCatalogError(null)
      try {
        setClientes(await adminPost<CourtrackCliente[]>('/courtrack-catalog', { resource: 'clientes' }, word, signal))
      } catch (err) {
        if (isAbort(err)) return
        if (isUnauthorized(err)) return handleUnauthorized()
        setCatalogError(errorMessage(err))
      }
    },
    [handleUnauthorized],
  )

  async function discover(cliente: CourtrackCliente, team: string) {
    if (!safeword) return handleUnauthorized()
    setDiscovering(true)
    setCatalogError(null)
    setDiscovered(null)
    try {
      const found = await adminPost<CourtrackDiscoveredLiga[]>(
        '/courtrack-catalog',
        { resource: 'descubrir', id_cliente: cliente.id, team: team.trim() },
        safeword,
      )
      setDiscovered(found)
      setPicked(new Set(found.filter((item) => !configuredLigaIds.has(item.liga.id)).map((item) => item.liga.id)))
    } catch (err) {
      if (isUnauthorized(err)) return handleUnauthorized()
      setCatalogError(errorMessage(err))
    } finally {
      setDiscovering(false)
    }
  }

  function goToWizard(target: WizardStep, next: Wizard = wizard) {
    if (!safeword) return handleUnauthorized()
    setWizard(next)
    setSearch('')
    setWizardError(null)
    setStep(target)
    if (target === 'descubrir') {
      if (next.cliente) void discover(next.cliente, teamQuery)
    } else if (!clientes) {
      void loadClientes(safeword)
    }
  }

  function startWizard() {
    setJustAdded([])
    goToWizard('cliente', emptyWizard())
  }

  async function createLeague(input: LeagueCreateInput): Promise<CourtrackLeague> {
    if (!safeword) throw new Error('Falta la palabra clave')
    return adminPost<CourtrackLeague>('/league-create', input, safeword)
  }

  /** Alta de las ligas descubiertas marcadas: cada una bajo una competición nueva con el nombre de la liga. */
  async function saveDiscovered() {
    const { cliente } = wizard
    if (!cliente || !discovered) return
    const chosen = discovered.filter((item) => picked.has(item.liga.id))
    if (chosen.length === 0) return
    setBusy(true)
    setWizardError(null)
    const created: CourtrackLeague[] = []
    try {
      for (const item of chosen) {
        created.push(
          await createLeague({
            id_cliente: cliente.id,
            cliente_name: cliente.nombre,
            liga_id: item.liga.id,
            team_name: item.team.name,
            competition: { kind: 'new', name: item.liga.nombre, competition_kind: 'league' },
          }),
        )
      }
      setChanged(true)
      setJustAdded(created)
      void queryClient.invalidateQueries({ queryKey: competitionsKey })
      void invalidateStatus()
      setStep('list')
    } catch (err) {
      if (isUnauthorized(err)) return handleUnauthorized()
      if (created.length > 0) {
        setChanged(true)
        setJustAdded(created)
        void queryClient.invalidateQueries({ queryKey: competitionsKey })
        void invalidateStatus()
      }
      setWizardError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function deleteLeague() {
    if (!safeword) return handleUnauthorized()
    if (!target) return
    setBusy(true)
    setActionError(null)
    try {
      await adminPost('/league-delete', { id: target.id }, safeword)
      setChanged(true)
      setTarget(null)
      void queryClient.invalidateQueries({ queryKey: competitionsKey })
      queryClient.removeQueries({ queryKey: courtrackKeys.snapshot(target.id) })
      setStep('list')
      await invalidateStatus()
    } catch (err) {
      if (isUnauthorized(err)) return handleUnauthorized()
      setActionError(errorMessage(err))
      setStep('list')
    } finally {
      setBusy(false)
    }
  }

  function openStandings(league: CourtrackSyncLeague) {
    setTarget(league)
    setStep('standings')
  }

  const dismissible = !busy && !verifying
  function handleClose() {
    if (!dismissible) return
    onClose(changed)
  }

  const isWizard = step in WIZARD_TITLES
  const title =
    step === 'confirm-delete'
      ? 'Quitar liga'
      : step === 'standings'
          ? 'Clasificación'
          : step === 'safeword'
            ? 'Ligas'
            : isWizard
              ? WIZARD_TITLES[step as WizardStep]
              : 'Ligas de CourtTrack'
  const eyebrow = isWizard ? (
    <Chip tone="gold">Agregar liga</Chip>
  ) : step === 'safeword' ? (
    <Chip tone="ash">Acceso restringido</Chip>
  ) : step === 'standings' && target ? (
    <Chip tone="gold" className="max-w-full truncate">
      {target.season_label}
    </Chip>
  ) : (
    <Chip tone="gold">CourtTrack</Chip>
  )

  const openLeagues = (status?.leagues ?? []).filter((league) => !league.archived_at)
  const archivedLeagues = (status?.leagues ?? []).filter((league) => league.archived_at)
  const pickedCount = picked.size

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
    case 'list':
      footer = (
        <>
          <Button variant="ghost" onClick={handleClose} disabled={busy}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={startWizard} disabled={busy || !status} className="pr-4 pl-3.5">
            <PlusIcon className="size-4" strokeWidth={2} />
            Agregar liga
          </Button>
        </>
      )
      break
    case 'cliente':
      footer = (
        <Button variant="ghost" onClick={() => setStep('list')}>
          Cancelar
        </Button>
      )
      break
    case 'descubrir':
      footer = (
        <>
          <Button variant="ghost" onClick={() => goToWizard('cliente')} disabled={busy}>
            Atrás
          </Button>
          <Button variant="primary" onClick={() => void saveDiscovered()} disabled={busy || discovering || pickedCount === 0}>
            {busy ? 'Guardando…' : pickedCount === 1 ? 'Agregar 1 liga' : `Agregar ${pickedCount} ligas`}
          </Button>
        </>
      )
      break
    case 'confirm-delete':
      footer = (
        <>
          <Button variant="ghost" onClick={() => setStep('list')} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void deleteLeague()} disabled={busy}>
            {busy ? 'Quitando…' : 'Quitar liga'}
          </Button>
        </>
      )
      break
    case 'standings':
      footer = (
        <Button variant="primary" onClick={() => setStep('list')}>
          Volver
        </Button>
      )
      break
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      eyebrow={eyebrow}
      footer={footer}
      dismissible={dismissible}
      scrollResetKey={step}
    >
      {step === 'safeword' && (
        <SafewordStep
          formId={formId}
          notice={notice}
          onBusyChange={setVerifying}
          description="Solo el cuerpo técnico puede configurar las ligas. Escribe la palabra clave del equipo para continuar."
          onVerified={(value) => {
            safewordStore.set(value)
            setSafeword(value)
            setNotice(null)
            void invalidateStatus()
            setStep('list')
          }}
        />
      )}

      {step === 'list' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-pretty text-coyote-ash">
            Cada liga de CourtTrack alimenta una competición del dashboard. Cuando CourtTrack reinicia una liga al
            terminar, la temporada se cierra sola al sincronizar, con su clasificación, y empieza la siguiente.
          </p>
          {justAdded.length > 0 && (
            <Callout tone="gold" icon={<CheckIcon className="size-5" strokeWidth={2} />}>
              {justAdded.length === 1 ? (
                <>
                  <span className="text-coyote-silver">{justAdded[0]!.season_label}</span> añadida a {justAdded[0]!.competition.name}.{' '}
                </>
              ) : (
                <>
                  <span className="text-coyote-silver">{justAdded.length} ligas</span> añadidas.{' '}
                </>
              )}
              <button
                type="button"
                className="font-medium text-coyote-gold underline-offset-2 hover:underline"
                onClick={() => onSyncLeague(justAdded[0]!.id)}
              >
                Ver vista previa
              </button>
            </Callout>
          )}
          {actionError && <FormError>{actionError}</FormError>}
          {statusError ? (
            <RetryError error={statusError} onRetry={() => void statusQuery.refetch()} />
          ) : !status ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {openLeagues.length === 0 ? (
                <Callout tone="ash" icon={<TrophyIcon className="size-5" />}>
                  No sigues ninguna liga en curso. Pulsa <span className="text-coyote-silver">Agregar liga</span> para
                  buscarla en CourtTrack.
                </Callout>
              ) : (
                <ul className="flex flex-col gap-2">
                  {openLeagues.map((league) => (
                    <LeagueRow
                      key={league.id}
                      league={league}
                      busy={busy}
                      onSync={() => onSyncLeague(league.id)}
                      onDelete={() => {
                        setTarget(league)
                        setStep('confirm-delete')
                      }}
                      onStandings={() => openStandings(league)}
                    />
                  ))}
                </ul>
              )}
              {archivedLeagues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    aria-expanded={showArchived}
                    onClick={() => setShowArchived((value) => !value)}
                    className="flex min-h-11 items-center gap-2 self-start rounded-lg pr-3 pl-1 text-sm font-medium text-coyote-ash transition-colors duration-150 hover:text-coyote-silver md:min-h-9"
                  >
                    <ChevronRightIcon
                      className={`size-4 transition-transform duration-150 ease-out ${showArchived ? 'rotate-90' : ''}`}
                      strokeWidth={2}
                    />
                    Temporadas finalizadas
                    <span className="text-xs tabular-nums">{archivedLeagues.length}</span>
                  </button>
                  {showArchived && (
                    <ul className="flex flex-col gap-2">
                      {archivedLeagues.map((league) => (
                        <LeagueRow
                          key={league.id}
                          league={league}
                          busy={busy}
                          onSync={() => undefined}
                          onDelete={() => {
                            setTarget(league)
                            setStep('confirm-delete')
                          }}
                          onStandings={() => openStandings(league)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 'cliente' && (
        <PickList
          items={clientes}
          error={catalogError}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Buscar asociación (p.ej. PODIO)"
          keyOf={(item) => item.id}
          matches={(item, needle) => normalize(`${item.nombre} ${item.titulo ?? ''}`).includes(needle)}
          selectedKey={wizard.cliente?.id}
          onPick={(cliente) => goToWizard('descubrir', { cliente })}
          emptyLabel="Ninguna asociación coincide con la búsqueda."
          onRetry={() => safeword && void loadClientes(safeword)}
          render={(item) => (
            <>
              <Logo src={item.logo} fallback={<TrophyIcon className="size-5" />} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-coyote-silver">{item.nombre}</span>
                {item.titulo && <span className="truncate text-xs text-coyote-ash">{item.titulo}</span>}
              </span>
            </>
          )}
        />
      )}

      {step === 'descubrir' && wizard.cliente && (
        <div className="flex flex-col gap-4">
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (wizard.cliente) void discover(wizard.cliente, teamQuery)
            }}
          >
            <Field label={`Tu equipo en ${wizard.cliente.nombre}`} className="flex-1">
              <Input value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} autoComplete="off" />
            </Field>
            <Button type="submit" disabled={discovering || !teamQuery.trim()}>
              Buscar
            </Button>
          </form>
          {catalogError ? (
            <RetryError error={catalogError} onRetry={() => wizard.cliente && void discover(wizard.cliente, teamQuery)} />
          ) : discovering || !discovered ? (
            <Callout tone="gold" icon={<RefreshIcon className="size-5 animate-spin" />}>
              Buscando "{teamQuery.trim()}" en las ligas de {wizard.cliente.nombre}…
            </Callout>
          ) : discovered.length === 0 ? (
            <Callout tone="ash" icon={<TrophyIcon className="size-5" />}>
              No aparece ningún equipo llamado "{teamQuery.trim()}" en las ligas de {wizard.cliente.nombre}. Escribe el
              nombre tal como figura en CourtTrack (sin importar mayúsculas ni acentos) y vuelve a buscar.
            </Callout>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {discovered.map((item) => {
                const already = configuredLigaIds.has(item.liga.id)
                const checked = picked.has(item.liga.id)
                return (
                  <li key={item.liga.id}>
                    <label
                      className={[
                        'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl p-2.5 pr-3 transition-[background-color,box-shadow] duration-150 ease-out',
                        already ? 'bg-coyote-black/40 opacity-60' : checked ? 'bg-coyote-ember shadow-gold' : 'bg-coyote-black/60 shadow-border hover:bg-coyote-ember/60',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-coyote-gold"
                        checked={checked}
                        disabled={already}
                        onChange={(event) => {
                          setPicked((prev) => {
                            const next = new Set(prev)
                            if (event.target.checked) next.add(item.liga.id)
                            else next.delete(item.liga.id)
                            return next
                          })
                        }}
                      />
                      <Logo src={item.team.logo} fallback={<TrophyIcon className="size-5" />} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-medium text-pretty text-coyote-silver">{item.liga.nombre}</span>
                        <span className="truncate text-xs text-coyote-ash tabular-nums">
                          {already
                            ? 'Ya configurada'
                            : `como ${item.team.display_name} · ${item.played_matches} de ${item.total_matches} partidos jugados`}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
          {discovered && discovered.length > 0 && (
            <p className="text-xs text-pretty text-coyote-ash">
              Cada liga se guarda como una competición con su nombre; las temporadas siguientes de la misma liga se
              cuelgan de ella solas.
            </p>
          )}
          {wizardError && <FormError>{wizardError}</FormError>}
        </div>
      )}

      {step === 'confirm-delete' && target && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-pretty text-coyote-silver">
            ¿Quitar <span className="font-medium">{target.season_label}</span> de las ligas que sigues?
          </p>
          <p className="text-sm text-pretty text-coyote-ash">
            Los partidos ya importados y la competición "{target.competition.name}" se conservan, pero se pierde la
            clasificación guardada de esta temporada. Si vuelves a añadir la liga, los partidos se reconocen y no se
            duplican.
          </p>
          {actionError && <FormError>{actionError}</FormError>}
        </div>
      )}

      {step === 'standings' && target && (
        snapshotError ? (
          <RetryError error={snapshotError} onRetry={() => void snapshotQuery.refetch()} />
        ) : !snapshot ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-1/2 rounded-md" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <StandingsView snapshot={snapshot} teamName={target.team_name} />
        )
      )}
    </Modal>
  )
}
