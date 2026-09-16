import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TEAM_NAME } from '@/config'
import { COMPETITION_KINDS, COMPETITION_KIND_LABELS, type CompetitionKind } from '@shared/domain'
import { slugify } from '@shared/matches'
import type {
  CourtrackCliente,
  CourtrackEquipo,
  CourtrackLeague,
  CourtrackLiga,
  CourtrackSyncLeague,
  CourtrackSyncStatus,
  LeagueCreateInput,
} from '@shared/schemas'
import { adminPost, errorMessage, isAbort, isUnauthorized, safewordStore } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { Button, Chip, Field, FormError, Input, Modal, Select, Skeleton } from '../../ui'
import { CheckIcon, ChevronRightIcon, PlusIcon, RefreshIcon, TrophyIcon } from '../../ui/icons'
import { competitionsKey, useCompetitions } from '../competitions'
import { Callout, lastSyncLabel } from '../sync/SyncCourtrackDialog'

type WizardStep = 'cliente' | 'liga' | 'equipo' | 'competition'
type Step = 'safeword' | 'list' | WizardStep | 'confirm-delete'

const WIZARD_STEPS: Record<WizardStep, { index: number; title: string }> = {
  cliente: { index: 1, title: 'Asociación' },
  liga: { index: 2, title: 'Liga' },
  equipo: { index: 3, title: 'Tu equipo' },
  competition: { index: 4, title: 'Competición' },
}

type ManageLeaguesDialogProps = {
  open: boolean
  /** `changed`: se añadió, pausó o quitó alguna liga. */
  onClose: (changed: boolean) => void
  /** Cierra este diálogo y abre el de sincronización con esa liga. */
  onSyncLeague: (leagueId: string) => void
}

type Wizard = {
  cliente: CourtrackCliente | null
  liga: CourtrackLiga | null
  equipo: CourtrackEquipo | null
  competitionChoice: 'new' | string
  newName: string
  newKind: CompetitionKind
}

const emptyWizard = (): Wizard => ({
  cliente: null,
  liga: null,
  equipo: null,
  competitionChoice: 'new',
  newName: '',
  newKind: 'league',
})

const normalize = (text: string) => slugify(text)

function Logo({ src, fallback }: { src: string | null; fallback: ReactNode }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className="size-9 shrink-0 rounded-lg bg-white/90 object-contain p-0.5 outline-1 outline-white/10" />
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-coyote-ember text-coyote-gold">{fallback}</span>
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

function LeagueRow({
  league,
  busy,
  onSync,
  onToggle,
  onDelete,
}: {
  league: CourtrackSyncLeague
  busy: boolean
  onSync: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-coyote-black/60 p-3 shadow-border">
      <div className="flex items-start gap-3">
        <Logo src={league.team_logo_url} fallback={<TrophyIcon className="size-5" />} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-balance text-coyote-silver">{league.competition.name}</span>
          <span className="text-xs text-pretty text-coyote-ash">
            {league.liga_name} · {league.cliente_name ?? 'CourtTrack'} · como {league.team_name}
          </span>
          <span className="text-xs text-coyote-ash tabular-nums">
            {league.last_sync ? lastSyncLabel(league.last_sync) : 'Todavía no se sincronizó'}
          </span>
        </div>
        <Chip tone={league.is_active ? 'gold' : 'ash'}>{league.is_active ? 'Activa' : 'Pausada'}</Chip>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" className="pr-3.5 pl-3" onClick={onSync} disabled={busy || !league.is_active}>
          <RefreshIcon className="size-4" strokeWidth={2} />
          Sincronizar
        </Button>
        <Button size="sm" onClick={onToggle} disabled={busy}>
          {league.is_active ? 'Pausar' : 'Activar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy} className="ml-auto text-coyote-orange">
          Quitar
        </Button>
      </div>
    </li>
  )
}

/**
 * Ligas de CourtTrack que sigue el equipo: lista con estado y último sync, pausar/activar, quitar y el asistente
 * "Agregar liga" (asociación → liga → tu equipo → competición).
 */
export default function ManageLeaguesDialog({ open, onClose, onSyncLeague }: ManageLeaguesDialogProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const competitions = useCompetitions()
  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [step, setStep] = useState<Step>(() => (safeword ? 'list' : 'safeword'))
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [status, setStatus] = useState<CourtrackSyncStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)
  const [justAdded, setJustAdded] = useState<CourtrackLeague | null>(null)
  const [toDelete, setToDelete] = useState<CourtrackSyncLeague | null>(null)

  // Asistente
  const [wizard, setWizard] = useState<Wizard>(emptyWizard)
  const [clientes, setClientes] = useState<CourtrackCliente[] | null>(null)
  const [ligas, setLigas] = useState<CourtrackLiga[] | null>(null)
  const [equipos, setEquipos] = useState<CourtrackEquipo[] | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [wizardError, setWizardError] = useState<string | null>(null)

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

  useEffect(() => {
    if (step !== 'list' || !safeword) return
    const controller = new AbortController()
    void loadStatus(safeword, controller.signal)
    return () => controller.abort()
  }, [step, safeword, loadStatus])

  /** Catálogo del paso actual del asistente (se pide al entrar en él). */
  const loadCatalog = useCallback(
    async (target: WizardStep, current: Wizard, word: string, signal?: AbortSignal) => {
      setCatalogError(null)
      try {
        if (target === 'cliente' && !clientes) {
          setClientes(await adminPost<CourtrackCliente[]>('/courtrack-catalog', { resource: 'clientes' }, word, signal))
        } else if (target === 'liga' && current.cliente) {
          setLigas(null)
          setLigas(
            await adminPost<CourtrackLiga[]>('/courtrack-catalog', { resource: 'ligas', id_cliente: current.cliente.id }, word, signal),
          )
        } else if (target === 'equipo' && current.cliente && current.liga) {
          setEquipos(null)
          const list = await adminPost<CourtrackEquipo[]>(
            '/courtrack-catalog',
            { resource: 'equipos', id_cliente: current.cliente.id, liga_id: current.liga.id },
            word,
            signal,
          )
          setEquipos(list)
          // Preselecciona el equipo propio si aparece con el mismo nombre.
          const own = list.find((team) => normalize(team.name) === normalize(TEAM_NAME))
          if (own) setWizard((prev) => (prev.equipo ? prev : { ...prev, equipo: own }))
        }
      } catch (err) {
        if (isAbort(err)) return
        if (isUnauthorized(err)) return handleUnauthorized()
        setCatalogError(errorMessage(err))
      }
    },
    [clientes, handleUnauthorized],
  )

  function goToWizard(target: WizardStep, next: Wizard = wizard) {
    if (!safeword) return handleUnauthorized()
    setWizard(next)
    setSearch('')
    setWizardError(null)
    setStep(target)
    void loadCatalog(target, next, safeword)
  }

  function startWizard() {
    setJustAdded(null)
    goToWizard('cliente', emptyWizard())
  }

  async function saveLeague() {
    if (!safeword) return handleUnauthorized()
    const { cliente, liga, equipo } = wizard
    if (!cliente || !liga || !equipo) return
    const competition: LeagueCreateInput['competition'] =
      wizard.competitionChoice === 'new'
        ? { kind: 'new', name: wizard.newName.trim(), competition_kind: wizard.newKind }
        : { kind: 'existing', id: wizard.competitionChoice }
    if (competition.kind === 'new' && !competition.name) {
      setWizardError('Escribe el nombre de la competición')
      return
    }
    setBusy(true)
    setWizardError(null)
    try {
      const created = await adminPost<CourtrackLeague>(
        '/league-create',
        { id_cliente: cliente.id, cliente_name: cliente.nombre, liga_id: liga.id, team_name: equipo.name, competition },
        safeword,
      )
      setChanged(true)
      setJustAdded(created)
      void queryClient.invalidateQueries({ queryKey: competitionsKey })
      setStep('list')
    } catch (err) {
      if (isUnauthorized(err)) return handleUnauthorized()
      setWizardError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function toggleLeague(league: CourtrackSyncLeague) {
    if (!safeword) return handleUnauthorized()
    setBusy(true)
    setActionError(null)
    try {
      await adminPost('/league-update', { id: league.id, is_active: !league.is_active }, safeword)
      setChanged(true)
      await loadStatus(safeword)
    } catch (err) {
      if (isUnauthorized(err)) return handleUnauthorized()
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function deleteLeague() {
    if (!safeword) return handleUnauthorized()
    if (!toDelete) return
    setBusy(true)
    setActionError(null)
    try {
      await adminPost('/league-delete', { id: toDelete.id }, safeword)
      setChanged(true)
      setToDelete(null)
      void queryClient.invalidateQueries({ queryKey: competitionsKey })
      setStep('list')
      await loadStatus(safeword)
    } catch (err) {
      if (isUnauthorized(err)) return handleUnauthorized()
      setActionError(errorMessage(err))
      setStep('list')
    } finally {
      setBusy(false)
    }
  }

  const dismissible = !busy && !verifying
  function handleClose() {
    if (!dismissible) return
    onClose(changed)
  }

  const wizardStep = step in WIZARD_STEPS ? WIZARD_STEPS[step as WizardStep] : null
  const title =
    step === 'confirm-delete' ? 'Quitar liga' : step === 'safeword' ? 'Ligas' : wizardStep ? wizardStep.title : 'Ligas de CourtTrack'
  const eyebrow = wizardStep ? (
    <Chip tone="gold" className="tabular-nums">
      Agregar liga · paso {wizardStep.index} de 4
    </Chip>
  ) : step === 'safeword' ? (
    <Chip tone="ash">Acceso restringido</Chip>
  ) : (
    <Chip tone="gold">CourtTrack</Chip>
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
    case 'liga':
      footer = (
        <Button variant="ghost" onClick={() => goToWizard('cliente')}>
          Atrás
        </Button>
      )
      break
    case 'equipo':
      footer = (
        <>
          <Button variant="ghost" onClick={() => goToWizard('liga')}>
            Atrás
          </Button>
          <Button variant="primary" disabled={!wizard.equipo} onClick={() => goToWizard('competition')}>
            Siguiente
          </Button>
        </>
      )
      break
    case 'competition':
      footer = (
        <>
          <Button variant="ghost" onClick={() => goToWizard('equipo')} disabled={busy}>
            Atrás
          </Button>
          <Button type="submit" form={formId} variant="primary" disabled={busy || competitions.isPending}>
            {busy ? 'Guardando…' : 'Guardar liga'}
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
            setStep('list')
          }}
        />
      )}

      {step === 'list' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-pretty text-coyote-ash">
            Cada liga de CourtTrack alimenta una competición del dashboard. Al cambiar de temporada, añade la liga nueva
            y pausa la anterior: sus partidos se conservan.
          </p>
          {justAdded && (
            <Callout tone="gold" icon={<CheckIcon className="size-5" strokeWidth={2} />}>
              <span className="text-coyote-silver">{justAdded.liga_name}</span> añadida a {justAdded.competition.name}.{' '}
              <button type="button" className="font-medium text-coyote-gold underline-offset-2 hover:underline" onClick={() => onSyncLeague(justAdded.id)}>
                Ver vista previa
              </button>
            </Callout>
          )}
          {actionError && <FormError>{actionError}</FormError>}
          {statusError ? (
            <div className="flex flex-col gap-3">
              <FormError>{statusError}</FormError>
              <Button size="sm" className="self-start pr-3.5 pl-3" onClick={() => safeword && void loadStatus(safeword)}>
                <RefreshIcon className="size-4" strokeWidth={2} />
                Reintentar
              </Button>
            </div>
          ) : !status ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : status.leagues.length === 0 ? (
            <Callout tone="ash" icon={<TrophyIcon className="size-5" />}>
              Todavía no sigues ninguna liga. Pulsa <span className="text-coyote-silver">Agregar liga</span> para elegirla en CourtTrack.
            </Callout>
          ) : (
            <ul className="flex flex-col gap-2">
              {status.leagues.map((league) => (
                <LeagueRow
                  key={league.id}
                  league={league}
                  busy={busy}
                  onSync={() => onSyncLeague(league.id)}
                  onToggle={() => void toggleLeague(league)}
                  onDelete={() => {
                    setToDelete(league)
                    setStep('confirm-delete')
                  }}
                />
              ))}
            </ul>
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
          onPick={(cliente) => goToWizard('liga', { ...wizard, cliente, liga: null, equipo: null })}
          emptyLabel="Ninguna asociación coincide con la búsqueda."
          onRetry={() => safeword && void loadCatalog('cliente', wizard, safeword)}
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

      {step === 'liga' && (
        <PickList
          items={ligas}
          error={catalogError}
          search={search}
          onSearch={setSearch}
          searchPlaceholder={`Buscar liga en ${wizard.cliente?.nombre ?? 'la asociación'}`}
          keyOf={(item) => item.id}
          matches={(item, needle) => normalize(`${item.nombre} ${item.descripcion ?? ''}`).includes(needle)}
          selectedKey={wizard.liga?.id}
          onPick={(liga) => goToWizard('equipo', { ...wizard, liga, equipo: null, newName: liga.nombre })}
          emptyLabel="Ninguna liga coincide con la búsqueda."
          onRetry={() => safeword && void loadCatalog('liga', wizard, safeword)}
          render={(item) => (
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium text-pretty text-coyote-silver">{item.nombre}</span>
              <span className="truncate text-xs text-coyote-ash">
                {item.etapas.length === 1 ? '1 etapa' : `${item.etapas.length} etapas`}
                {item.descripcion ? ` · ${item.descripcion}` : ''}
              </span>
            </span>
          )}
        />
      )}

      {step === 'equipo' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-pretty text-coyote-ash">
            Elige cómo aparece tu equipo en esta liga. Solo se importarán sus partidos.
          </p>
          <PickList
            items={equipos}
            error={catalogError}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Buscar equipo"
            keyOf={(item) => item.name}
            matches={(item, needle) => normalize(item.name).includes(needle)}
            selectedKey={wizard.equipo?.name}
            onPick={(equipo) => setWizard((prev) => ({ ...prev, equipo }))}
            emptyLabel="Ningún equipo coincide con la búsqueda."
            onRetry={() => safeword && void loadCatalog('equipo', wizard, safeword)}
            render={(item) => (
              <>
                <Logo src={item.logo} fallback={<span className="text-xs font-semibold">{item.display_name.slice(0, 3).toUpperCase()}</span>} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-coyote-silver">{item.display_name}</span>
                  <span className="truncate text-xs text-coyote-ash tabular-nums">
                    {item.matches === 1 ? '1 partido' : `${item.matches} partidos`} en la liga
                  </span>
                </span>
              </>
            )}
          />
        </div>
      )}

      {step === 'competition' && (
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void saveLeague()
          }}
        >
          <p className="text-sm text-pretty text-coyote-ash">
            Los partidos de <span className="text-coyote-silver">{wizard.liga?.nombre}</span> se guardarán bajo esta
            competición, que es la que verás en los filtros y en el formulario de partido.
          </p>
          <Field label="Competición">
            <Select
              data-autofocus
              value={wizard.competitionChoice}
              disabled={competitions.isPending}
              onChange={(event) => setWizard((prev) => ({ ...prev, competitionChoice: event.target.value }))}
            >
              <option value="new">Nueva competición</option>
              {competitions.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  Añadir a: {item.name}
                </option>
              ))}
            </Select>
          </Field>
          {wizard.competitionChoice === 'new' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="Nombre" error={wizardError && !wizard.newName.trim() ? wizardError : null}>
                <Input
                  value={wizard.newName}
                  maxLength={80}
                  onChange={(event) => setWizard((prev) => ({ ...prev, newName: event.target.value }))}
                />
              </Field>
              <Field label="Tipo">
                <Select
                  value={wizard.newKind}
                  onChange={(event) => setWizard((prev) => ({ ...prev, newKind: event.target.value as CompetitionKind }))}
                >
                  {COMPETITION_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {COMPETITION_KIND_LABELS[kind]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          <p className="text-xs text-pretty text-coyote-ash">
            Una competición por temporada ("{wizard.liga?.nombre ?? 'Clausura 2026'}") permite filtrar cada torneo por
            separado; añadirla a una existente junta varias temporadas bajo el mismo nombre.
          </p>
          {wizardError && wizard.newName.trim() && <FormError>{wizardError}</FormError>}
          {wizardError && wizard.competitionChoice !== 'new' && <FormError>{wizardError}</FormError>}
        </form>
      )}

      {step === 'confirm-delete' && toDelete && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-pretty text-coyote-silver">
            ¿Quitar <span className="font-medium">{toDelete.liga_name}</span> de las ligas que sigues?
          </p>
          <p className="text-sm text-pretty text-coyote-ash">
            Los partidos ya importados y la competición "{toDelete.competition.name}" se conservan. Si vuelves a añadir
            la liga, los partidos se reconocen y no se duplican.
          </p>
          {actionError && <FormError>{actionError}</FormError>}
        </div>
      )}
    </Modal>
  )
}
