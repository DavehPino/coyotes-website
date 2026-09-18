import {
  cloneElement,
  isValidElement,
  useId,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'

// 16 px en móvil: iOS no hace zoom al enfocar. Área de pulsación de 44 px.
// Los campos son celdas: fondo blanco y contorno de tinta de 2 px.
const CONTROL = [
  'min-h-11 w-full rounded-sm border-2 border-ink/60 bg-surface px-3 text-base text-ink md:min-h-10 md:text-[0.9375rem]',
  'transition-[border-color] duration-150 ease-out hover:border-ink focus:border-ink focus:outline-none',
  'placeholder:text-ink-soft/80 disabled:opacity-50',
  'aria-invalid:border-danger',
].join(' ')

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL} ${className}`} {...rest} />
}

export function Textarea({ className = '', rows = 3, ...rest }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={`${CONTROL} resize-y py-2.5 leading-normal ${className}`} {...rest} />
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
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-ink-soft">Opcional</span>}
      </label>
      {control}
      {message && (
        <p id={messageId} className={`text-xs ${error ? 'font-bold text-danger-deep' : 'text-ink-soft'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

/** Error general de un paso del formulario (p.ej. respuesta de la API): la misma regla roja que ErrorState. */
export function FormError({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div role="alert" className={`overflow-hidden rounded-sm bg-surface ${className}`}>
      <div aria-hidden className="bg-danger h-1" />
      <p className="px-3 py-2 text-sm font-medium text-danger-deep">{children}</p>
    </div>
  )
}
