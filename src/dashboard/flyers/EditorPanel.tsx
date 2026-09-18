import { useRef, type ReactNode } from 'react'
import {
  FLYER_FORMATS,
  FLYER_FORMAT_SIZES,
  FLYER_MAX_LOGOS,
  FLYER_PALETTES,
  FLYER_PALETTE_LABELS,
  FLYER_TEXT_LIMITS,
  type FlyerContent,
} from '@shared/flyers'
import { Button, Field, Input, Textarea } from '../ui'
import { CheckIcon, ImageIcon, TrashIcon } from '../ui/icons'
import type { ImageLibrary } from './assetLibrary'
import { ImageLibraryManager, ImagePicker } from './ImageLibrary'
import { PALETTE_COLORS } from './render'
import { FIELD_LABELS, TEMPLATES } from './templates'

type EditorPanelProps = {
  flyer: FlyerContent
  onChange: (changes: Partial<FlyerContent>) => void
  photoUrl: string | null
  onPhotoChange: (url: string | null) => void
  library: ImageLibrary
  onRemoveImage: (id: string) => void
}

/** Plantillas con escudo propio frente al del rival. */
const WITH_OPPONENT = new Set<FlyerContent['template']>(['partido', 'resultado'])

/** Edición manual: formato, paleta, logo, foto de fondo y los textos que usa la plantilla. */
export function EditorPanel({ flyer, onChange, photoUrl, onPhotoChange, library, onRemoveImage }: EditorPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-5">
      <Group label="Formato">
        <div className="grid grid-cols-3 gap-2">
          {FLYER_FORMATS.map((format) => {
            const size = FLYER_FORMAT_SIZES[format]
            const selected = flyer.format === format
            return (
              <OptionButton key={format} selected={selected} onClick={() => onChange({ format })}>
                <span
                  aria-hidden
                  className="rounded-[3px] border-2 border-current"
                  style={{ width: 14, height: Math.round((14 * size.height) / size.width) }}
                />
                {size.label}
              </OptionButton>
            )
          })}
        </div>
      </Group>

      <Group label="Colores">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {FLYER_PALETTES.map((palette) => {
            const colors = PALETTE_COLORS[palette]
            const selected = flyer.palette === palette
            return (
              <OptionButton key={palette} selected={selected} onClick={() => onChange({ palette })}>
                <span
                  aria-hidden
                  className="flex size-5 shrink-0 items-center justify-center rounded-full shadow-tape"
                  style={{ background: `linear-gradient(135deg, ${colors.background.join(', ')})` }}
                >
                  <span className="size-2 rounded-full" style={{ background: colors.title }} />
                </span>
                {FLYER_PALETTE_LABELS[palette]}
              </OptionButton>
            )
          })}
        </div>
      </Group>

      <Group label="Imagen">
        <div className="flex flex-wrap gap-2">
          <OptionButton selected={flyer.showLogo} onClick={() => onChange({ showLogo: !flyer.showLogo })}>
            <span
              aria-hidden
              className={[
                'flex size-5 items-center justify-center rounded-md shadow-tape',
                flyer.showLogo ? 'bg-ink text-club' : 'bg-line/40 text-ink shadow-tape',
              ].join(' ')}
            >
              {flyer.showLogo && <CheckIcon className="size-3.5" strokeWidth={2} />}
            </span>
            Mostrar logo
          </OptionButton>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onPhotoChange(URL.createObjectURL(file))
              event.target.value = ''
            }}
          />
          <Button onClick={() => fileRef.current?.click()} className="pr-4 pl-3.5">
            <ImageIcon className="size-4" />
            {photoUrl ? 'Cambiar foto' : 'Foto de fondo'}
          </Button>
          {photoUrl && (
            <Button variant="ghost" size="icon" onClick={() => onPhotoChange(null)} aria-label="Quitar foto de fondo">
              <TrashIcon className="size-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-ink-soft">La foto solo se usa en este navegador: no se sube ni se envía a la IA.</p>
      </Group>

      <Group label="Logos de otros equipos">
        <p className="text-xs text-ink-soft">
          Sube PNG con fondo transparente y ponles el nombre del equipo: así la IA sabe cuál usar. Se guardan en el
          bucket y las ve todo el equipo.
        </p>
        {library.images.length > 0 && (
          <>
            {WITH_OPPONENT.has(flyer.template) && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-ink">Rival (junto al escudo de Coyotes)</span>
                <ImagePicker
                  label="Logo del rival"
                  images={library.images}
                  selected={flyer.opponentLogo ? [flyer.opponentLogo] : []}
                  noneLabel="Ninguno"
                  onNone={() => onChange({ opponentLogo: '' })}
                  onToggle={(id) =>
                    onChange({
                      opponentLogo: flyer.opponentLogo === id ? '' : id,
                      logos: flyer.logos.filter((logo) => logo !== id),
                    })
                  }
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">
                Fila de logos
                <span className="ml-1.5 text-xs font-normal text-ink-soft">
                  Auspiciantes, liga… hasta {FLYER_MAX_LOGOS}
                </span>
              </span>
              <ImagePicker
                label="Fila de logos"
                images={library.images}
                selected={flyer.logos}
                disabledIds={library.images
                  .map((image) => image.id)
                  .filter(
                    (id) =>
                      (WITH_OPPONENT.has(flyer.template) && id === flyer.opponentLogo) ||
                      (flyer.logos.length >= FLYER_MAX_LOGOS && !flyer.logos.includes(id)),
                  )}
                onToggle={(id) =>
                  onChange({
                    logos: flyer.logos.includes(id) ? flyer.logos.filter((logo) => logo !== id) : [...flyer.logos, id],
                  })
                }
              />
            </div>
          </>
        )}
        <ImageLibraryManager library={library} onRemove={onRemoveImage} />
      </Group>

      <Group label="Textos">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {TEMPLATES[flyer.template].fields.map((field) => {
            const { label, placeholder } = FIELD_LABELS[field]
            const value = flyer[field]
            const limit = FLYER_TEXT_LIMITS[field]
            const wide = field === 'details' || field === 'title' || field === 'cta' || field === 'location'
            return (
              <Field
                key={field}
                label={label}
                hint={value.length > limit * 0.8 ? `${value.length}/${limit}` : undefined}
                className={wide ? 'sm:col-span-2 lg:col-span-1 xl:col-span-2' : ''}
              >
                {field === 'details' ? (
                  <Textarea
                    value={value}
                    maxLength={limit}
                    placeholder={placeholder}
                    onChange={(event) => onChange({ [field]: event.target.value })}
                  />
                ) : (
                  <Input
                    value={value}
                    maxLength={limit}
                    placeholder={placeholder}
                    onChange={(event) => onChange({ [field]: event.target.value })}
                  />
                )}
              </Field>
            )
          })}
        </div>
      </Group>
    </div>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2.5">
      <legend className="mb-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">{label}</legend>
      {children}
    </fieldset>
  )
}

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm font-medium select-none md:min-h-10',
        'transition-[background-color,color,box-shadow] duration-150 ease-out',
        selected
          ? 'bg-floor-deep text-ink shadow-tape-club'
          : 'bg-line/40 text-ink shadow-tape hover:shadow-tape-hover',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
