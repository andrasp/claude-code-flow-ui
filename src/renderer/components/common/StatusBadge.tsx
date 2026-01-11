import { cn } from '@/lib/utils'
import type { RoadmapStatus, FlowStatus, Priority } from '@shared/types'

interface StatusBadgeProps {
  status: RoadmapStatus | FlowStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  planned: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Planned' },
  'in-progress': { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'In Progress' },
  blocked: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Blocked' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Completed' },
  cancelled: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Cancelled' },
  active: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Active' },
  abandoned: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Abandoned' },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps): JSX.Element {
  const config = statusConfig[status] || statusConfig.planned

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: Priority
  size?: 'sm' | 'md'
}

const priorityConfig: Record<Priority, { bg: string; text: string }> = {
  P0: { bg: 'bg-red-500/20', text: 'text-red-400' },
  P1: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  P2: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  P3: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps): JSX.Element {
  const config = priorityConfig[priority]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-mono font-bold',
        config.bg,
        config.text,
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
      )}
    >
      {priority}
    </span>
  )
}

interface EffortBadgeProps {
  effort: string
}

export function EffortBadge({ effort }: EffortBadgeProps): JSX.Element {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-flow-border text-flow-muted">
      {effort}
    </span>
  )
}
