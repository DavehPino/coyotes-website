import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { buttonClasses } from '../../ui'
import { MoreIcon } from '../../ui/icons'

export type BoardMenuItem = {
  label: string
  icon?: ReactNode
  disabled?: boolean
  danger?: boolean
  onSelect: () => void
}

/**
 * Menú de acciones de la formación sobre la Popover API: se cierra con Esc o tocando fuera
 * y queda por encima del diálogo. Flechas, Inicio y Fin recorren las opciones.
 */
export function BoardMenu({ items }: { items: BoardMenuItem[] }) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const enabledItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])

  function place() {
    const button = buttonRef.current?.getBoundingClientRect()
    const menu = menuRef.current
    if (!button || !menu) return
    menu.style.top = `${button.bottom + 6}px`
    menu.style.right = `${Math.max(8, window.innerWidth - button.right)}px`
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
        className={buttonClasses({ variant: 'ghost', size: 'icon' })}
        aria-label="Más acciones"
        aria-haspopup="menu"
        popoverTarget={id}
        onClick={place}
      >
        <MoreIcon strokeWidth={2} />
      </button>
      <div
        ref={menuRef}
        id={id}
        popover="auto"
        role="menu"
        aria-label="Acciones de la formación"
        onKeyDown={handleKeyDown}
        onToggle={(event) => {
          if (event.newState === 'open') enabledItems()[0]?.focus()
          else if (menuRef.current?.contains(document.activeElement)) buttonRef.current?.focus()
        }}
        className={[
          'on-surface fixed inset-auto m-0 min-w-56 rounded-sm border-2 border-ink bg-surface p-1.5 text-ink shadow-dialog',
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
              'flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-sm font-bold md:min-h-10',
              'transition-colors duration-150 ease-out hover:bg-paper focus-visible:bg-paper focus-visible:outline-none',
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
