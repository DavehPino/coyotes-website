import { useState, type FormEvent } from 'react'
import { ApiError } from '@/lib/api'
import { Field, FormError, Input } from '../ui'
import { LockIcon } from '../ui/icons'
import { adminPost, errorMessage } from './adminApi'

type SafewordStepProps = {
  formId: string
  notice: string | null
  onVerified: (safeword: string) => void
  onBusyChange: (busy: boolean) => void
  /** Comprobación contra la API; por defecto, la palabra clave de carga. */
  verify?: (safeword: string) => Promise<unknown>
  description?: string
}

const verifyAdmin = (safeword: string) => adminPost('/verify', {}, safeword)

/** Pide la palabra clave y la valida contra la API antes de mostrar el formulario. */
export function SafewordStep({
  formId,
  notice,
  onVerified,
  onBusyChange,
  verify = verifyAdmin,
  description = 'Solo el cuerpo técnico puede cargar datos. Escribe la palabra clave del equipo para continuar.',
}: SafewordStepProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const safeword = value.trim()
    if (!safeword) {
      setError('Escribe la palabra clave')
      return
    }
    setError(null)
    onBusyChange(true)
    try {
      await verify(safeword)
      onVerified(safeword)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Palabra clave incorrecta' : errorMessage(err))
    } finally {
      onBusyChange(false)
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl bg-coyote-black/60 p-3 shadow-border">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-coyote-ember text-coyote-gold">
          <LockIcon />
        </span>
        <p className="text-sm text-coyote-ash">{description}</p>
      </div>
      {notice && <FormError>{notice}</FormError>}
      <Field label="Palabra clave" error={error}>
        <Input
          data-autofocus
          type="password"
          name="safeword"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
    </form>
  )
}
