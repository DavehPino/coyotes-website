// Controles compartidos por los grupos del editor de flyers.
import type { ReactNode } from 'react'

export function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2.5">
      <legend className="mb-2.5 text-xs font-semibold tracking-wide text-coyote-ash uppercase">{label}</legend>
      {children}
    </fieldset>
  )
}

export function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium select-none md:min-h-10',
        'transition-[background-color,color,box-shadow] duration-150 ease-out',
        selected
          ? 'bg-coyote-ember text-coyote-gold shadow-gold'
          : 'bg-coyote-black text-coyote-ash shadow-border hover:text-coyote-silver hover:shadow-border-hover',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
