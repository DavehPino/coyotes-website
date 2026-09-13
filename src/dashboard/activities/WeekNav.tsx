import { addDays } from '@shared/dates'
import { formatWeekRange } from '@/lib/dates'
import { Button } from '../ui'
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons'

type WeekNavProps = {
  weekStart: string
  isCurrentWeek: boolean
  onChange: (weekStart: string) => void
  onReset: () => void
}

export function WeekNav({ weekStart, isCurrentWeek, onChange, onReset }: WeekNavProps) {
  const label = formatWeekRange(weekStart, addDays(weekStart, 6))

  return (
    <nav aria-label="Semana" className="flex w-full flex-wrap items-center gap-2 md:w-auto">
      <div className="flex flex-1 items-center justify-between gap-1 rounded-xl bg-coyote-night p-1 shadow-border md:flex-none">
        <Button variant="ghost" size="icon" static onClick={() => onChange(addDays(weekStart, -7))} aria-label="Semana anterior">
          <ChevronLeftIcon strokeWidth={2} />
        </Button>
        <p aria-live="polite" className="min-w-[10rem] px-2 text-center text-sm font-medium text-coyote-silver tabular-nums">
          {label}
        </p>
        <Button variant="ghost" size="icon" static onClick={() => onChange(addDays(weekStart, 7))} aria-label="Semana siguiente">
          <ChevronRightIcon strokeWidth={2} />
        </Button>
      </div>
      <Button variant={isCurrentWeek ? 'secondary' : 'primary'} size="sm" onClick={onReset} disabled={isCurrentWeek}>
        Esta semana
      </Button>
    </nav>
  )
}
