import { useRef, useState, type ReactNode } from 'react'
import { FLYER_ASSET_NAME_MAX, FLYER_MAX_ASSETS } from '@shared/flyers'
import { Button, FormError, Input } from '../ui'
import { CheckIcon, TrashIcon, UploadIcon } from '../ui/icons'
import type { FlyerImage, ImageLibrary } from './assetLibrary'

// Fondo a cuadros: deja ver la transparencia de los logos.
const CHECKER =
  'bg-coyote-black bg-[length:12px_12px] bg-[image:repeating-conic-gradient(oklch(1_0_0/0.06)_0_25%,transparent_0_50%)]'

type ImageLibraryManagerProps = {
  library: ImageLibrary
  /** Se llama antes de borrar para quitar la imagen del flyer abierto. */
  onRemove: (id: string) => void
}

/** Subir, renombrar y borrar imágenes propias (logos de rivales, auspiciantes) en el bucket. */
export function ImageLibraryManager({ library, onRemove }: ImageLibraryManagerProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const full = library.images.length >= FLYER_MAX_ASSETS

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/webp,image/jpeg,image/svg+xml"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          if (event.target.files) void library.add(event.target.files)
          event.target.value = ''
        }}
      />

      {library.images.length > 0 && (
        <ul className="flex flex-col gap-2">
          {library.images.map((image) => (
            <li key={image.id} className="flex items-center gap-2">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg p-1 shadow-border ${CHECKER}`}>
                <img src={image.url} alt="" className="max-h-full max-w-full object-contain outline-none" />
              </span>
              <NameInput
                key={image.name}
                name={image.name}
                disabled={library.busy}
                onCommit={(name) => void library.rename(image.id, name)}
              />
              <Button
                variant="ghost"
                size="icon"
                disabled={library.busy}
                aria-label={`Borrar ${image.name || 'imagen'}`}
                onClick={() => {
                  onRemove(image.id)
                  void library.remove(image.id)
                }}
              >
                <TrashIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {library.loading && <p className="text-sm text-coyote-ash">Cargando imágenes…</p>}
      <Button
        onClick={() => fileRef.current?.click()}
        disabled={full || library.busy || library.loading}
        className="self-start pr-4 pl-3.5"
      >
        <UploadIcon className="size-4" />
        {library.busy ? 'Guardando…' : full ? `Máximo ${FLYER_MAX_ASSETS} imágenes` : 'Subir imágenes'}
      </Button>
      {library.loadError && <FormError>No se pudieron cargar las imágenes: {library.loadError}</FormError>}
      {library.error && <FormError>{library.error}</FormError>}
    </div>
  )
}

/** Nombre editable: se guarda en el bucket al salir del campo o con Enter, no en cada tecla. */
function NameInput({ name, disabled, onCommit }: { name: string; disabled: boolean; onCommit: (name: string) => void }) {
  const [value, setValue] = useState(name)
  const commit = () => {
    if (value.trim() && value.trim() !== name) onCommit(value)
    else setValue(name)
  }
  return (
    <Input
      aria-label="Nombre de la imagen"
      value={value}
      maxLength={FLYER_ASSET_NAME_MAX}
      disabled={disabled}
      placeholder="Nombre (p.ej. Onas Vóley)"
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
    />
  )
}

type ImagePickerProps = {
  images: FlyerImage[]
  selected: string[]
  onToggle: (id: string) => void
  /** Texto de la opción "ninguna" (solo en selección única). */
  noneLabel?: string
  onNone?: () => void
  label: string
  disabledIds?: string[]
}

/** Selector de imágenes de la biblioteca en mosaico. */
export function ImagePicker({ images, selected, onToggle, noneLabel, onNone, label, disabledIds = [] }: ImagePickerProps) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {noneLabel && onNone && (
        <li>
          <Tile selected={selected.length === 0} onClick={onNone} label={noneLabel}>
            <span className="text-xs text-coyote-ash">{noneLabel}</span>
          </Tile>
        </li>
      )}
      {images.map((image) => (
        <li key={image.id}>
          <Tile
            selected={selected.includes(image.id)}
            disabled={disabledIds.includes(image.id)}
            onClick={() => onToggle(image.id)}
            label={image.name || 'Imagen sin nombre'}
          >
            <img src={image.url} alt="" className="max-h-full max-w-full object-contain outline-none" />
          </Tile>
        </li>
      ))}
    </ul>
  )
}

function Tile({
  selected,
  disabled,
  onClick,
  label,
  children,
}: {
  selected: boolean
  disabled?: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        `relative flex size-16 items-center justify-center rounded-lg p-1.5 select-none ${CHECKER}`,
        'transition-[box-shadow,opacity] duration-150 ease-out disabled:opacity-40',
        selected ? 'shadow-gold-strong' : 'shadow-border hover:shadow-border-hover',
      ].join(' ')}
    >
      {children}
      {selected && (
        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-coyote-gold text-coyote-black">
          <CheckIcon className="size-3.5" strokeWidth={2} />
        </span>
      )}
    </button>
  )
}
