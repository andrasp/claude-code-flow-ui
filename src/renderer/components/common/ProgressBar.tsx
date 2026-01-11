import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  size?: 'sm' | 'md'
  className?: string
  showLabel?: boolean
}

export function ProgressBar({
  value,
  max,
  size = 'sm',
  className,
  showLabel = false,
}: ProgressBarProps): JSX.Element {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex-1 bg-flow-border rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            percent === 100 ? 'bg-green-500' : 'bg-flow-accent'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-flow-muted tabular-nums">
          {value}/{max}
        </span>
      )}
    </div>
  )
}
