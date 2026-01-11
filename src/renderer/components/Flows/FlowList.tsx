import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GitBranch, ChevronRight, Clock, Filter } from 'lucide-react'
import { useFlowStore } from '@/stores/flowStore'
import { useProjectStore } from '@/stores/projectStore'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ProgressBar } from '@/components/common/ProgressBar'
import { FlowTypeIcon } from '@/components/common/FlowTypeIcon'
import { getFlowTypeLabel, getPhaseLabel, formatRelativeTime, cn } from '@/lib/utils'
import type { FlowStatus } from '@shared/types'

const statusFilters: { value: FlowStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
]

export function FlowList(): JSX.Element {
  const project = useProjectStore((s) => s.project)
  const flows = useFlowStore((s) => s.flows)
  const loadFlows = useFlowStore((s) => s.loadFlows)

  const [statusFilter, setStatusFilter] = useState<FlowStatus | 'all'>('all')

  useEffect(() => {
    if (project) {
      loadFlows()
    }
  }, [project, loadFlows])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={GitBranch}
          title="No Project Open"
          description="Open a project to view flows"
        />
      </div>
    )
  }

  // Filter and group flows
  let filteredFlows = flows
  if (statusFilter !== 'all') {
    filteredFlows = filteredFlows.filter((f) => f.status === statusFilter)
  }

  // Separate active from others, sort by last activity
  const activeFlows = filteredFlows
    .filter((f) => f.status === 'active')
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

  const otherFlows = filteredFlows
    .filter((f) => f.status !== 'active')
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

  const showActiveSection = statusFilter === 'all' || statusFilter === 'active'
  const showOtherSection = statusFilter === 'all' || statusFilter !== 'active'

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Flows</h1>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-flow-muted" />
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  statusFilter === filter.value
                    ? 'bg-flow-accent/20 text-flow-accent'
                    : 'bg-flow-surface border border-flow-border hover:border-flow-accent/50'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {filteredFlows.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No Flows Found"
            description="Start a new flow with /flow in Claude Code"
          />
        ) : (
          <div className="space-y-8">
            {/* Active flows */}
            {showActiveSection && activeFlows.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-flow-muted mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Active Flows
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeFlows.map((flow) => (
                    <Link
                      key={flow.id}
                      to={`/flow/${encodeURIComponent(flow.path)}`}
                      className="bg-flow-surface border border-flow-border rounded-lg p-4 hover:border-flow-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <FlowTypeIcon type={flow.type} size="md" />
                          <div>
                            <p className="font-medium">{flow.name}</p>
                            <p className="text-xs text-flow-muted">{getFlowTypeLabel(flow.type)}</p>
                          </div>
                        </div>
                        <StatusBadge status={flow.status} />
                      </div>

                      {/* Phase indicator */}
                      <div className="flex items-center gap-1 mb-3">
                        {['understanding', 'planning', 'implementation', 'completion'].map(
                          (phase, i) => {
                            const phases = [
                              'understanding',
                              'planning',
                              'implementation',
                              'completion',
                            ]
                            const currentIndex = phases.indexOf(flow.phase)
                            const isComplete = i < currentIndex
                            const isCurrent = i === currentIndex

                            return (
                              <div key={phase} className="flex items-center gap-1">
                                <div
                                  className={cn(
                                    'h-1.5 rounded-full flex-1',
                                    isComplete
                                      ? 'bg-green-500'
                                      : isCurrent
                                        ? 'bg-flow-accent'
                                        : 'bg-flow-border'
                                  )}
                                  style={{ width: 32 }}
                                />
                              </div>
                            )
                          }
                        )}
                        <span className="text-xs text-flow-muted ml-2">
                          {getPhaseLabel(flow.phase)}
                        </span>
                      </div>

                      {/* Task progress */}
                      {flow.tasksTotal > 0 && (
                        <ProgressBar
                          value={flow.tasksComplete}
                          max={flow.tasksTotal}
                          showLabel
                          className="mb-3"
                        />
                      )}

                      <div className="flex items-center justify-between text-xs text-flow-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(new Date(flow.lastActivity))}</span>
                        </div>
                        {flow.linkedRoadmapItem && (
                          <span className="text-flow-accent">{flow.linkedRoadmapItem}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Other flows */}
            {showOtherSection && otherFlows.length > 0 && (
              <div>
                {showActiveSection && activeFlows.length > 0 && (
                  <h2 className="text-sm font-medium text-flow-muted mb-4">Recent Flows</h2>
                )}
                <div className="space-y-2">
                  {otherFlows.map((flow) => (
                    <Link
                      key={flow.id}
                      to={`/flow/${encodeURIComponent(flow.path)}`}
                      className="flex items-center gap-4 bg-flow-surface border border-flow-border rounded-lg p-3 hover:border-flow-accent/50 transition-colors"
                    >
                      <FlowTypeIcon type={flow.type} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{flow.name}</span>
                          <StatusBadge status={flow.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-flow-muted">
                          <span>{getFlowTypeLabel(flow.type)}</span>
                          {flow.tasksTotal > 0 && (
                            <span>
                              {flow.tasksComplete}/{flow.tasksTotal} tasks
                            </span>
                          )}
                          <span>{formatRelativeTime(new Date(flow.lastActivity))}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-flow-muted flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
