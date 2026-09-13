import type { FormEvent } from 'react'
import { TEAM_NAME } from '@/config'
import { todayIsoDate } from '@shared/dates'
import { MATCH_COMPETITIONS, MAX_SETS, type MatchCompetition } from '@shared/domain'
import { tallySets } from '@shared/matches'
import { Button, Chip, Field, FormError, Input, Select } from '../../ui'
import { PlusIcon, TrashIcon } from '../../ui/icons'
import { newKey, setErrorKey, toSetScores, type Errors, type MatchDraft, type SetDraft } from './draft'

type MatchStepProps = {
  formId: string
  match: MatchDraft
  rivalName: string
  errors: Errors
  onChange: (patch: Partial<MatchDraft>) => void
  onSubmit: () => void
}

/** Solo dígitos, como mucho dos: los marcadores de un set. */
const onlyScore = (value: string) => value.replace(/\D/g, '').slice(0, 2)

const SCORE_INPUT = 'text-center font-display text-2xl leading-none tabular-nums md:text-2xl'

function ResultPreview({ sets }: { sets: SetDraft[] }) {
  // Solo sets con los dos marcadores: uno a medio escribir no cuenta todavía.
  const scores = toSetScores(sets.filter((set) => set.us !== '' && set.them !== ''))
  if (scores.length === 0) return null
  const { won, lost } = tallySets(scores)
  const label = won > lost ? 'Victoria' : won < lost ? 'Derrota' : 'Empate'
  const tone = won > lost ? 'gold-solid' : won < lost ? 'orange' : 'ash'
  return (
    <Chip tone={tone} size="md" aria-live="polite" className="tabular-nums">
      {label} {won}–{lost}
    </Chip>
  )
}

/** Paso 2: fecha, competición, lugar y parciales. Siempre como visitante. */
export function MatchStep({ formId, match, rivalName, errors, onChange, onSubmit }: MatchStepProps) {
  const updateSet = (key: number, patch: Partial<SetDraft>) =>
    onChange({ sets: match.sets.map((set) => (set.key === key ? { ...set, ...patch } : set)) })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" error={errors.playedOn}>
          <Input
            data-autofocus
            type="date"
            max={todayIsoDate()}
            value={match.playedOn}
            onChange={(event) => onChange({ playedOn: event.target.value })}
          />
        </Field>
        <Field label="Hora" optional>
          <Input type="time" value={match.startTime} onChange={(event) => onChange({ startTime: event.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Competición">
          <Select
            value={match.competition}
            onChange={(event) => onChange({ competition: event.target.value as MatchCompetition })}
          >
            {MATCH_COMPETITIONS.map((competition) => (
              <option key={competition} value={competition}>
                {competition}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fase o jornada" optional>
          <Input
            value={match.phase}
            maxLength={60}
            placeholder="Fecha 3"
            onChange={(event) => onChange({ phase: event.target.value })}
          />
        </Field>
      </div>

      <Field label="Lugar" optional>
        <Input
          value={match.location}
          maxLength={120}
          placeholder="Gimnasio o club"
          onChange={(event) => onChange({ location: event.target.value })}
        />
      </Field>

      <section aria-labelledby={`${formId}-sets`} className="flex flex-col gap-2 pt-1">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h3 id={`${formId}-sets`} className="text-2xl leading-none text-coyote-silver">
            Parciales
          </h3>
          <ResultPreview sets={match.sets} />
        </div>

        <div
          aria-hidden
          className="grid grid-cols-[3rem_minmax(0,1fr)_0.75rem_minmax(0,1fr)_2.75rem] items-end gap-2 text-xs font-medium tracking-wide text-coyote-ash uppercase md:grid-cols-[3rem_minmax(0,1fr)_0.75rem_minmax(0,1fr)_2.5rem]"
        >
          <span />
          <span className="truncate text-center text-coyote-gold">{TEAM_NAME}</span>
          <span />
          <span className="truncate text-center">{rivalName}</span>
          <span />
        </div>

        <ol className="flex flex-col gap-2">
          {match.sets.map((set, index) => {
            const error = errors[setErrorKey(set.key)]
            const setLabel = `Set ${index + 1}`
            return (
              <li key={set.key} className="flex flex-col gap-1">
                <div className="grid grid-cols-[3rem_minmax(0,1fr)_0.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 md:grid-cols-[3rem_minmax(0,1fr)_0.75rem_minmax(0,1fr)_2.5rem]">
                  <span className="text-sm font-medium text-coyote-ash">{setLabel}</span>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    aria-label={`${setLabel}, puntos de ${TEAM_NAME}`}
                    aria-invalid={error ? true : undefined}
                    value={set.us}
                    onChange={(event) => updateSet(set.key, { us: onlyScore(event.target.value) })}
                    className={SCORE_INPUT}
                  />
                  <span aria-hidden className="text-center text-coyote-rust">
                    –
                  </span>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    aria-label={`${setLabel}, puntos de ${rivalName}`}
                    aria-invalid={error ? true : undefined}
                    value={set.them}
                    onChange={(event) => updateSet(set.key, { them: onlyScore(event.target.value) })}
                    className={SCORE_INPUT}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar ${setLabel.toLowerCase()}`}
                    disabled={match.sets.length === 1}
                    onClick={() => onChange({ sets: match.sets.filter((item) => item.key !== set.key) })}
                  >
                    <TrashIcon className="size-4.5" />
                  </Button>
                </div>
                {error && <p className="pl-14 text-xs text-coyote-orange">{error}</p>}
              </li>
            )
          })}
        </ol>

        {errors.sets && <FormError>{errors.sets}</FormError>}

        <Button
          variant="ghost"
          size="sm"
          className="self-start pr-3.5 pl-2.5"
          disabled={match.sets.length >= MAX_SETS}
          onClick={() => onChange({ sets: [...match.sets, { key: newKey(), us: '', them: '' }] })}
        >
          <PlusIcon className="size-4" strokeWidth={2} />
          Añadir set
        </Button>
        <p className="text-xs text-coyote-ash">Los sets vacíos no se guardan.</p>
      </section>
    </form>
  )
}
