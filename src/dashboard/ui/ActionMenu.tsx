import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { buttonClasses } from './Button'
import { MoreIcon } from './icons'

export type ActionMenuItem = {
  label: string
  icon?: ReactNode
  disabled?: boolean
  danger?: boolean
  onSelect: () => void
}

/** Ancho mínimo del panel (min-w-60), para decidir hacia qué lado abre antes de que se pinte. */
const MENU_MIN_WIDTH = 240

type ActionMenuProps = {
  items: ActionMenuItem[]
  /** Texto de la tecla que abre el menú; también nombra el menú para lectores de pantalla. */
  label?: string
  className?: string
}

/**
 * Menú de acciones secundarias: en móvil recoge los botones de una cabecera para que no ocupen tres filas.
 * Va sobre la Popover API (como el menú de la cancha): se cierra con Esc o tocando fuera y queda por encima de
 * todo. Flechas, Inicio y Fin recorren las opciones; al cerrarse devuelve el foco a la tecla.
 */
export function ActionMenu({ items, label = 'Más', className = '' }: ActionMenuProps) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const enabledItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])

  /** Bajo la tecla: alineado a su borde izquierdo si cabe; si no, al derecho. Nunca se sale de la pantalla. */
  function place() {
    const button = buttonRef.current?.getBoundingClientRect()
    const menu = menuRef.current
    if (!button || !menu) return
    const width = Math.max(MENU_MIN_WIDTH, menu.offsetWidth)
    menu.style.top = `${button.bottom + 8}px`
    if (button.left + width <= window.innerWidth - 8) {
      menu.style.left = `${Math.max(8, button.left)}px`
      menu.style.right = 'auto'
    } else {
      menu.style.left = 'auto'
      menu.style.right = `${Math.max(8, window.innerWidth - button.right)}px`
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const options = enabledItems()
    const index = options.indexOf(document.activeElement as HTMLButtonElement)
    const target =
      event.key === 'ArrowDown'
        ? options[(index + 1) % options.length]
        : event.key === 'ArrowUp'
          ? options[(index - 1 + options.length) % options.length]
          : event.key === 'Home'
            ? options[0]
            : event.key === 'End'
              ? options[options.length - 1]
              : null
    if (!target) return
    event.preventDefault()
    target.focus()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClasses({ className: `pr-4 pl-3 ${className}` })}
        aria-haspopup="menu"
        popoverTarget={id}
        onClick={place}
      >
        <MoreIcon className="size-5" strokeWidth={2} />
        {label}
      </button>
      <div
        ref={menuRef}
        id={id}
        popover="auto"
        role="menu"
        aria-label={label}
        onKeyDown={handleKeyDown}
        onToggle={(event) => {
          if (event.newState === 'open') enabledItems()[0]?.focus()
          else if (menuRef.current?.contains(document.activeElement)) buttonRef.current?.focus()
        }}
        className={[
          'fixed inset-auto m-0 min-w-60 bg-surface p-1.5 text-ink shadow-dialog',
          'outline-2 -outline-offset-2 outline-ink',
          'opacity-0 transition-[opacity,translate,display,overlay] duration-150 ease-out transition-discrete',
          '-translate-y-1 open:translate-y-0 open:opacity-100 starting:open:-translate-y-1 starting:open:opacity-0',
          'motion-reduce:translate-y-0 motion-reduce:starting:open:translate-y-0',
        ].join(' ')}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              menuRef.current?.hidePopover()
              item.onSelect()
            }}
            className={[
              'flex min-h-12 w-full items-center gap-3 px-3 text-left font-bold tracking-wide uppercase',
              'transition-colors duration-150 ease-out hover:bg-ink/8 focus-visible:bg-ink/10 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-40',
              item.danger ? 'text-danger-deep' : '',
            ].join(' ')}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
