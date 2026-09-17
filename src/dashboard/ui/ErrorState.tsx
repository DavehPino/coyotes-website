import { Button } from './Button'
import { AlertIcon, RefreshIcon } from './icons'

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

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
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-2xl bg-coyote-night px-6 py-12 text-center shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-coyote-orange)_40%,transparent)]',
        className,
      ].join(' ')}
    >
      <span className="text-coyote-orange">
        <AlertIcon className="size-8" />
      </span>
      <p className="font-medium text-coyote-silver">{title}</p>
      <p className="max-w-sm text-sm text-coyote-ash">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} disabled={retrying} className="mt-1 pr-4 pl-3.5">
          <RefreshIcon className={retrying ? 'size-4 animate-spin motion-reduce:animate-none' : 'size-4'} strokeWidth={2} />
          Reintentar
        </Button>
      )}
    </div>
  )
}
