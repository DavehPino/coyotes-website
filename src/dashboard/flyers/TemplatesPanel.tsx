import { useMemo } from 'react'
import { FLYER_TEMPLATES, type FlyerContent } from '@shared/flyers'
import { FlyerCanvas, useFlyerAssets } from './FlyerCanvas'
import { applyTemplate, TEMPLATES } from './templates'

type TemplatesPanelProps = {
  flyer: FlyerContent
  onApply: (flyer: FlyerContent) => void
}

/** Miniaturas de las plantillas con sus textos de ejemplo; al elegir una se carga en el editor. */
export function TemplatesPanel({ flyer, onApply }: TemplatesPanelProps) {
  const { assets, ready } = useFlyerAssets(null)
  const { format, showLogo } = flyer
  // Las miniaturas solo dependen del formato y del logo: no se redibujan mientras se editan textos.
  const samples = useMemo(
    () => FLYER_TEMPLATES.map((template) => applyTemplate({ format, showLogo }, template)),
    [format, showLogo],
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        Elige un punto de partida. Se cargan textos de ejemplo que luego puedes editar o pedirle a la IA que adapte.
      </p>
      <ul className="grid grid-cols-2 gap-3">
        {samples.map((sample) => {
          const template = sample.template
          const info = TEMPLATES[template]
          const selected = flyer.template === template
          return (
            <li key={template}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onApply(sample)}
                className={[
                  'flex w-full flex-col gap-2 rounded-md bg-line p-2 text-left select-none',
                  'transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.98]',
                  selected ? 'shadow-tape-club-strong' : 'shadow-tape hover:shadow-tape-hover',
                ].join(' ')}
              >
                <FlyerCanvas
                  flyer={sample}
                  assets={assets}
                  ready={ready}
                  pixelRatio={0.3}
                  label={`Plantilla ${info.label}`}
                  className="block h-auto w-full rounded-sm"
                />
                <span className="flex flex-col px-1 pb-1">
                  <span className="text-sm font-medium text-ink">{info.label}</span>
                  <span className="text-xs text-ink-soft">{info.description}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
