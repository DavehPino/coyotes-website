import { Button } from './Button'
import { AlertIcon, RefreshIcon } from './icons'

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

/** Aviso con la antena a rayas en el borde: algo no se pudo cargar. */
export function ErrorState({
  title = 'No se pudo cargar',
  message = 'Comprueba la conexión e inténtalo de nuevo.',
  onRetry,
  retrying,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={['overflow-hidden rounded-md bg-line shadow-tape', className].join(' ')}
    >
      <div aria-hidden className="bg-antenna-stripes h-2.5" />
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <span className="text-antenna-deep">
          <AlertIcon className="size-8" />
        </span>
        <p className="text-lg font-bold text-ink uppercase">{title}</p>
        <p className="max-w-sm text-ink-soft">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} disabled={retrying} className="mt-1 pr-4 pl-3.5">
            <RefreshIcon className={retrying ? 'size-4 animate-spin motion-reduce:animate-none' : 'size-4'} strokeWidth={2} />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}
