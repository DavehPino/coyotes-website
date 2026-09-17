import { createContext, useContext, useId, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'

type TabValue = string | number

type TabsContextValue = {
  id: string
  value: TabValue
  onChange: (value: TabValue) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs(): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabList y TabPanel van dentro de <Tabs>')
  return context
}

const tabId = (id: string, value: TabValue) => `${id}-tab-${value}`
const panelId = (id: string, value: TabValue) => `${id}-panel-${value}`

/** Enfoca la pestaña y la trae a la vista: en una tira desplazable, `focus()` solo no desplaza. */
function focusTab(id: string, value: TabValue) {
  const tab = document.getElementById(tabId(id, value))
  tab?.focus({ preventScroll: true })
  tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

type TabsProps<T extends TabValue> = {
  value: T
  onChange: (value: T) => void
  children: ReactNode
}

/**
 * Pestañas con el patrón ARIA completo: `tablist`, `tab` y `tabpanel` enlazados por id, foco en la pestaña activa
 * (las demás salen del orden de Tab) y flechas, Inicio y Fin para cambiar de pestaña. Envuelve un TabList y
 * el TabPanel de la pestaña activa; el estado lo lleva quien lo usa.
 */
export function Tabs<T extends TabValue>({ value, onChange, children }: TabsProps<T>) {
  const id = useId()
  return (
    <TabsContext.Provider value={{ id, value, onChange: onChange as (value: TabValue) => void }}>
      {children}
    </TabsContext.Provider>
  )
}

export type TabItem<T extends TabValue> = {
  value: T
  children: ReactNode
  disabled?: boolean
  /** Clases extra de esta pestaña (p.ej. dos líneas de texto). */
  className?: string
}

type TabListProps<T extends TabValue> = {
  label: string
  items: TabItem<T>[]
  /** Disposición de la lista: fila desplazable, rejilla… */
  className?: string
  /** Clases de todas las pestañas además de las base; por defecto solo el relleno horizontal. */
  tabClassName?: string
}

const TAB_BASE = [
  'flex min-h-11 items-center justify-center rounded-lg text-sm font-medium select-none md:min-h-10',
  'transition-[background-color,color] duration-150 ease-out disabled:opacity-50',
].join(' ')
const TAB_SELECTED = 'bg-coyote-ember text-coyote-gold'
const TAB_IDLE = 'text-coyote-ash hover:text-coyote-silver'

export function TabList<T extends TabValue>({ label, items, className = '', tabClassName = 'px-3' }: TabListProps<T>) {
  const { id, value, onChange } = useTabs()
  const enabled = items.filter((item) => !item.disabled)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (enabled.length === 0) return
    const index = enabled.findIndex((item) => item.value === value)
    const next =
      event.key === 'ArrowRight'
        ? enabled[(index + 1) % enabled.length]
        : event.key === 'ArrowLeft'
          ? enabled[(index - 1 + enabled.length) % enabled.length]
          : event.key === 'Home'
            ? enabled[0]
            : event.key === 'End'
              ? enabled[enabled.length - 1]
              : undefined
    if (!next) return
    event.preventDefault()
    onChange(next.value)
    focusTab(id, next.value)
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={handleKeyDown} className={className}>
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={tabId(id, item.value)}
            aria-selected={selected}
            aria-controls={panelId(id, item.value)}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => {
              onChange(item.value)
              focusTab(id, item.value)
            }}
            className={[TAB_BASE, selected ? TAB_SELECTED : TAB_IDLE, tabClassName, item.className ?? ''].join(' ')}
          >
            {item.children}
          </button>
        )
      })}
    </div>
  )
}

type TabPanelProps<T extends TabValue> = HTMLAttributes<HTMLDivElement> & {
  /** Pestaña a la que pertenece el panel. */
  value: T
}

export function TabPanel<T extends TabValue>({ value, ...rest }: TabPanelProps<T>) {
  const { id } = useTabs()
  return <div role="tabpanel" id={panelId(id, value)} aria-labelledby={tabId(id, value)} {...rest} />
}
