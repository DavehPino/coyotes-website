import { useCallback, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { TEAM_NAME } from '@/config'
import { Button, buttonClasses, Chip, Modal } from '../../ui'
import { safewordStore } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { useRivalTeams } from '../../admin/teams'
import {
  initialDraft,
  validateMatch,
  validateTeam,
  validateVideos,
  type Draft,
  type Errors,
  type MatchDraft,
  type TeamDraft,
  type VideoDraft,
} from './draft'
import { MatchStep } from './MatchStep'
import { SubmitProgress } from './SubmitProgress'
import { TeamStep } from './TeamStep'
import { useMatchSubmission } from './useMatchSubmission'
import { VideosStep } from './VideosStep'

type Step = 'safeword' | 'team' | 'match' | 'videos' | 'submit'

const FORM_STEPS: Partial<Record<Step, { index: number; title: string }>> = {
  team: { index: 1, title: 'Equipo rival' },
  match: { index: 2, title: 'Datos del partido' },
  videos: { index: 3, title: 'Videos' },
}

type NewMatchDialogProps = {
  open: boolean
  /** `finished`: el partido ya se guardó y el formulario debe empezar de cero la próxima vez. */
  onClose: (finished: boolean) => void
  /** Empieza otro alta sin cerrar el diálogo. */
  onRestart: () => void
}

/**
 * Alta de partido en pasos: palabra clave → rival → partido → videos → guardado y subida.
 * El borrador se conserva si se cierra el diálogo antes de guardar.
 */
export default function NewMatchDialog({ open, onClose, onRestart }: NewMatchDialogProps) {
  const formId = useId()
  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [step, setStep] = useState<Step>(() => (safeword ? 'team' : 'safeword'))
  const [returnTo, setReturnTo] = useState<Step>('team')
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [draft, setDraft] = useState<Draft>(initialDraft)
  const [errors, setErrors] = useState<Errors>({})
  const rivals = useRivalTeams()

  const handleUnauthorized = useCallback(() => {
    safewordStore.clear()
    setSafeword(null)
    setNotice('La palabra clave ya no es válida. Escríbela de nuevo para continuar.')
    setReturnTo('submit')
    setStep('safeword')
  }, [])

  const { state: submission, busy, submit, retryVideo, cancel } = useMatchSubmission({
    onUnauthorized: handleUnauthorized,
  })

  const rivalName =
    (draft.team.mode === 'existing'
      ? rivals.data?.find((rival) => rival.id === draft.team.teamId)?.name
      : draft.team.newTeam.name.trim()) || 'Rival'
  // Los partidos cargados desde aquí son siempre como visitante: el rival va primero.
  const matchLabel = `${rivalName} vs ${TEAM_NAME}`

  const patchTeam = (patch: Partial<TeamDraft>) => setDraft((prev) => ({ ...prev, team: { ...prev.team, ...patch } }))
  const patchMatch = (patch: Partial<MatchDraft>) =>
    setDraft((prev) => ({ ...prev, match: { ...prev.match, ...patch } }))
  const setVideos = (videos: VideoDraft[]) => setDraft((prev) => ({ ...prev, videos }))

  function goTo(next: Step) {
    setErrors({})
    setStep(next)
  }

  /** Avanza solo si el paso no tiene errores. */
  function advance(found: Errors, next: Step): boolean {
    setErrors(found)
    if (Object.keys(found).length > 0) return false
    setStep(next)
    return true
  }

  function startSubmit() {
    if (!safeword) return handleUnauthorized()
    void submit(draft, safeword)
  }

  const matchSaved = submission.match !== null
  const dismissible = !busy && !verifying

  function handleClose() {
    if (!dismissible) return
    onClose(matchSaved)
  }

  const formStep = FORM_STEPS[step]
  let title: ReactNode = formStep?.title ?? 'Cargar partido'
  if (step === 'submit') {
    title =
      submission.phase === 'save-error'
        ? 'No se pudo guardar'
        : submission.phase === 'finished'
          ? 'Partido cargado'
          : submission.phase === 'uploading'
            ? 'Subiendo videos'
            : 'Guardando partido'
  }

  const meta = formStep ? (
    <Chip tone="gold" className="tabular-nums">
      Paso {formStep.index} de 3
    </Chip>
  ) : step === 'safeword' ? (
    null
  ) : null

  const primary = (label: string, disabled = false) => (
    <Button type="submit" form={formId} variant="primary" disabled={disabled}>
      {label}
    </Button>
  )

  let footer: ReactNode = null
  switch (step) {
    case 'safeword':
      footer = (
        <>
          <Button variant="ghost" onClick={handleClose} disabled={verifying}>
            Cancelar
          </Button>
          {primary(verifying ? 'Comprobando…' : 'Continuar', verifying)}
        </>
      )
      break
    case 'team':
      footer = (
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          {primary('Siguiente', rivals.isPending || rivals.isError)}
        </>
      )
      break
    case 'match':
      footer = (
        <>
          <Button variant="ghost" onClick={() => goTo('team')}>
            Atrás
          </Button>
          {primary('Siguiente')}
        </>
      )
      break
    case 'videos':
      footer = (
        <>
          <Button variant="ghost" onClick={() => goTo('match')}>
            Atrás
          </Button>
          {primary(
            draft.videos.length === 0
              ? 'Guardar partido'
              : `Guardar y subir ${draft.videos.length === 1 ? '1 video' : `${draft.videos.length} videos`}`,
          )}
        </>
      )
      break
    case 'submit':
      if (submission.phase === 'save-error') {
        footer = (
          <>
            <Button variant="ghost" onClick={() => goTo('videos')}>
              Atrás
            </Button>
            <Button variant="primary" onClick={startSubmit}>
              Reintentar
            </Button>
          </>
        )
      } else if (submission.phase === 'uploading') {
        footer = <Button onClick={cancel}>Cancelar subidas</Button>
      } else if (submission.phase === 'finished' && submission.match) {
        footer = (
          <>
            <Button variant="ghost" onClick={onRestart}>
              Cargar otro
            </Button>
            <Link
              to={`/matches/${submission.match.slug}`}
              onClick={() => onClose(true)}
              className={buttonClasses({ variant: 'primary' })}
            >
              Ver partido
            </Link>
          </>
        )
      }
      break
  }

  const failedUploads = Object.values(submission.uploads).filter(
    (upload) => upload.status === 'error' || upload.status === 'cancelled',
  ).length

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      meta={meta}
      footer={footer}
      dismissible={dismissible}
      scrollResetKey={step}
    >
      {step === 'safeword' && (
        <SafewordStep
          formId={formId}
          notice={notice}
          onBusyChange={setVerifying}
          onVerified={(value) => {
            safewordStore.set(value)
            setSafeword(value)
            setNotice(null)
            goTo(returnTo)
          }}
        />
      )}
      {step === 'team' && (
        <TeamStep
          formId={formId}
          team={draft.team}
          errors={errors}
          onChange={patchTeam}
          onSubmit={(list) => {
            // Sin rivales cargados solo se puede crear uno nuevo.
            const team = list.length === 0 ? { ...draft.team, mode: 'new' as const } : draft.team
            if (team !== draft.team) patchTeam({ mode: 'new' })
            advance(validateTeam(team, list), 'match')
          }}
        />
      )}
      {step === 'match' && (
        <MatchStep
          formId={formId}
          match={draft.match}
          rivalName={rivalName}
          errors={errors}
          onChange={patchMatch}
          onSubmit={() => advance(validateMatch(draft.match), 'videos')}
        />
      )}
      {step === 'videos' && (
        <VideosStep
          formId={formId}
          videos={draft.videos}
          errors={errors}
          onChange={setVideos}
          onSubmit={() => {
            if (advance(validateVideos(draft.videos), 'submit')) startSubmit()
          }}
        />
      )}
      {step === 'submit' && (
        <>
          <SubmitProgress
            submission={submission}
            videos={draft.videos}
            matchLabel={matchLabel}
            onRetryVideo={(key) => safeword && void retryVideo(draft, key, safeword)}
          />
          {submission.phase === 'finished' && failedUploads > 0 && submission.match && (
            <p className="mt-3 text-xs text-ink-soft">
              El partido ya está guardado. Puedes reintentar ahora o subir los videos más tarde a la carpeta{' '}
              <code className="text-ink">games/{submission.match.slug}/</code> del bucket.
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
