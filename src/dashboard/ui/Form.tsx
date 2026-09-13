import { cloneElement, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes } from 'react'

// 16 px en móvil: iOS no hace zoom al enfocar. Área de pulsación de 44 px.
const CONTROL = [
  'min-h-11 w-full rounded-lg bg-coyote-black px-3 text-base text-coyote-silver shadow-border md:min-h-10 md:text-sm',
  'transition-[box-shadow] duration-150 ease-out hover:shadow-border-hover',
  'placeholder:text-coyote-ash/60 disabled:opacity-50',
  'aria-invalid:shadow-[0_0_0_1px_var(--color-coyote-orange)]',
].join(' ')

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL} ${className}`} {...rest} />
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${CONTROL} pr-8 ${className}`} {...rest} />
}

type ControlProps = { id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }

type FieldProps = {
  label: ReactNode
  /** Un único control (Input, Select...): recibe id, aria-invalid y aria-describedby. */
  children: ReactElement<ControlProps>
  hint?: ReactNode
  error?: string | null
  optional?: boolean
  className?: string
}

/** Etiqueta + control + ayuda o error, enlazados por id para lectores de pantalla. */
export function Field({ label, children, hint, error, optional, className = '' }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error || hint
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
      })
    : children

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-coyote-silver">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-coyote-ash">Opcional</span>}
      </label>
      {control}
      {message && (
        <p id={messageId} className={`text-xs ${error ? 'text-coyote-orange' : 'text-coyote-ash'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

/** Error general de un paso del formulario (p.ej. respuesta de la API). */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-coyote-orange/12 px-3 py-2 text-sm text-coyote-orange">
      {children}
    </p>
  )
}
