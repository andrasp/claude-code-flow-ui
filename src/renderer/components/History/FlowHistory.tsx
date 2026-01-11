import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Search, ChevronRight, Clock } from 'lucide-react'
import { useFlowStore } from '@/stores/flowStore'
import { useProjectStore } from '@/stores/projectStore'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ProgressBar } from '@/components/common/ProgressBar'
import { FlowTypeIcon } from '@/components/common/FlowTypeIcon'
import {
  getFlowTypeLabel,
  formatRelativeTime,
  formatDate,
  cn,
} from '@/lib/utils'
import type { FlowType } from '@shared/types'

const flowTypes: (FlowType | null)[] = [
  null, // All
  'feature',
  'bugfix',
  'refactor',
  'optimization',
  'integration',
  'greenfield',
  'custom',
]

export function FlowHistory(): JSX.Element {
  const project = useProjectStore((s) => s.project)
  const flows = useFlowStore((s) => s.flows)
  const loadFlows = useFlowStore((s) => s.loadFlows)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<FlowType | null>(null)
  const [showCompleted, setShowCompleted] = useState(true)

  useEffect(() => {
    if (project) {
      loadFlows()
    }
  }, [project, loadFlows])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={History}
          title="No Project Open"
          description="Open a project to view flow history"
        />
      </div>
    )
  }

  // Filter flows
  let filteredFlows = flows

  if (selectedType) {
    filteredFlows = filteredFlows.filter((f) => f.type === selectedType)
  }

  if (!showCompleted) {
    filteredFlows = filteredFlows.filter((f) => f.status !== 'completed')
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredFlows = filteredFlows.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.path.toLowerCase().includes(query)
    )
  }

  // Group by date
  const groupedFlows: { date: string; flows: typeof flows }[] = []
  let currentDate = ''

  for (const flow of filteredFlows) {
    const flowDate = flow.date || 'Unknown'
    if (flowDate !== currentDate) {
      currentDate = flowDate
      groupedFlows.push({ date: flowDate, flows: [] })
    }
    groupedFlows[groupedFlows.length - 1].flows.push(flow)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Flow History</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flow-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flows..."
                className="pl-9 pr-4 py-2 bg-flow-surface border border-flow-border rounded-lg text-sm focus:outline-none focus:border-flow-accent w-64"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            {flowTypes.map((type) => (
              <button
                key={type || 'all'}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  selectedType === type
                    ? 'bg-flow-accent/20 text-flow-accent'
                    : 'bg-flow-surface border border-flow-border hover:border-flow-accent/50'
                )}
              >
                {type ? (
                  <span className="flex items-center gap-1.5">
                    <FlowTypeIcon type={type} size="sm" />
                    <span>{getFlowTypeLabel(type)}</span>
                  </span>
                ) : (
                  'All'
                )}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-flow-border"
            />
            <span className="text-flow-muted">Show completed</span>
          </label>
        </div>

        {/* Flow list */}
        {filteredFlows.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Flows Found"
            description={
              searchQuery || selectedType
                ? 'Try different filters'
                : 'Start a new flow with /flow in Claude Code'
            }
          />
        ) : (
          <div className="space-y-8">
            {groupedFlows.map((group) => (
              <div key={group.date}>
                <h3 className="text-sm font-medium text-flow-muted mb-3">
                  {formatDate(group.date)}
                </h3>
                <div className="space-y-2">
                  {group.flows.map((flow) => (
                    <Link
                      key={flow.id}
                      to={`/flow/${encodeURIComponent(flow.path)}`}
                      className="block bg-flow-surface border border-flow-border rounded-lg p-4 hover:border-flow-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FlowTypeIcon type={flow.type} size="sm" />
                            <span className="font-medium">{flow.name}</span>
                            <StatusBadge status={flow.status} />
                          </div>

                          <div className="flex items-center gap-4 text-sm text-flow-muted">
                            <span>{getFlowTypeLabel(flow.type)}</span>
                            {flow.linkedRoadmapItem && (
                              <span className="text-flow-accent">
                                {flow.linkedRoadmapItem}
                              </span>
                            )}
                            {flow.tasksTotal > 0 && (
                              <span>
                                {flow.tasksComplete}/{flow.tasksTotal} tasks
                              </span>
                            )}
                          </div>

                          {flow.tasksTotal > 0 && (
                            <ProgressBar
                              value={flow.tasksComplete}
                              max={flow.tasksTotal}
                              className="mt-2 max-w-xs"
                            />
                          )}

                          <div className="flex items-center gap-1 mt-2 text-xs text-flow-muted">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatRelativeTime(new Date(flow.lastActivity))}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-flow-muted flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
