import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRoadmapStore } from '@/stores/roadmapStore'
import { useProjectStore } from '@/stores/projectStore'
import { StatusBadge, PriorityBadge, EffortBadge } from '@/components/common/StatusBadge'
import { ProgressBar } from '@/components/common/ProgressBar'
import { EmptyState } from '@/components/common/EmptyState'
import { RoadmapTimeline } from './RoadmapTimeline'
import { Map, ChevronRight, Link as LinkIcon, LayoutGrid, GitBranch, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { RoadmapItem, RoadmapStatus } from '@shared/types'
import { cn } from '@/lib/utils'

type ViewMode = 'board' | 'timeline'

const columns: { status: RoadmapStatus; label: string }[] = [
  { status: 'planned', label: 'Planned' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'completed', label: 'Completed' },
]

export function RoadmapBoard(): JSX.Element {
  const [searchParams] = useSearchParams()
  const selectedItemId = searchParams.get('item')

  const project = useProjectStore((s) => s.project)
  const items = useRoadmapStore((s) => s.items)
  const loadItems = useRoadmapStore((s) => s.loadItems)
  const updateStatus = useRoadmapStore((s) => s.updateStatus)
  const [detailItem, setDetailItem] = useState<RoadmapItem | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('board')

  useEffect(() => {
    if (project) {
      loadItems()
    }
  }, [project, loadItems])

  useEffect(() => {
    if (selectedItemId) {
      const item = items.find((i) => i.id === selectedItemId)
      if (item) {
        setDetailItem(item)
      }
    }
  }, [selectedItemId, items])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Map}
          title="No Project Open"
          description="Open a project to view its roadmap"
        />
      </div>
    )
  }

  const getItemsByStatus = (status: RoadmapStatus): RoadmapItem[] => {
    return items.filter((item) => item.status === status)
  }

  // Check if all dependencies of an item are completed
  const areDependenciesMet = (item: RoadmapItem): boolean => {
    if (item.dependsOn.length === 0) return true
    return item.dependsOn.every((depId) => {
      const dep = items.find((i) => i.id === depId)
      return dep?.status === 'completed'
    })
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with view toggle */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h1 className="text-2xl font-semibold">Roadmap</h1>
          <div className="flex items-center gap-1 bg-flow-surface border border-flow-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors',
                viewMode === 'board'
                  ? 'bg-flow-accent/20 text-flow-accent'
                  : 'text-flow-muted hover:text-white'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors',
                viewMode === 'timeline'
                  ? 'bg-flow-accent/20 text-flow-accent'
                  : 'text-flow-muted hover:text-white'
              )}
            >
              <GitBranch className="w-4 h-4" />
              Dependencies
            </button>
          </div>
        </div>

        {/* View content */}
        {viewMode === 'timeline' ? (
          <RoadmapTimeline
            items={items}
            onSelectItem={setDetailItem}
            selectedItemId={detailItem?.id || null}
          />
        ) : (
          <div className="flex-1 overflow-auto px-6 pb-6">
            <div className="flex gap-4 min-w-max pb-6">
          {columns.map((column) => {
            const columnItems = getItemsByStatus(column.status)
            return (
              <div
                key={column.status}
                className="w-72 flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">{column.label}</h3>
                  <span className="text-xs text-flow-muted bg-flow-border px-2 py-0.5 rounded-full">
                    {columnItems.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDetailItem(item)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-colors',
                        'bg-flow-surface hover:border-flow-accent/50',
                        detailItem?.id === item.id
                          ? 'border-flow-accent'
                          : 'border-flow-border'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={item.priority} />
                        <span className="text-xs text-flow-muted font-mono">
                          {item.id}
                        </span>
                        {item.effort && <EffortBadge effort={item.effort} />}
                        {/* Show "Ready" for planned items with all deps met */}
                        {item.status === 'planned' && item.dependsOn.length > 0 && areDependenciesMet(item) && (
                          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready
                          </span>
                        )}
                        {/* Show warning for in-progress items with unmet deps */}
                        {item.status === 'in-progress' && !areDependenciesMet(item) && (
                          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Waiting
                          </span>
                        )}
                      </div>

                      <p className="font-medium text-sm mb-2">{item.title}</p>

                      {item.acceptanceCriteria.length > 0 && (
                        <ProgressBar
                          value={item.acceptanceCriteria.filter((c) => c.completed).length}
                          max={item.acceptanceCriteria.length}
                          showLabel
                          className="mb-2"
                        />
                      )}

                      {item.dependsOn.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <LinkIcon className={cn(
                            'w-3 h-3',
                            areDependenciesMet(item) ? 'text-green-400' : 'text-amber-400'
                          )} />
                          <span className="text-flow-muted">Depends on </span>
                          {item.dependsOn.map((depId, idx) => {
                            const dep = items.find((i) => i.id === depId)
                            const isComplete = dep?.status === 'completed'
                            return (
                              <span key={depId}>
                                <span className={isComplete ? 'text-green-400' : 'text-amber-400'}>
                                  {depId}
                                </span>
                                {idx < item.dependsOn.length - 1 && <span className="text-flow-muted">, </span>}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </button>
                  ))}

                  {columnItems.length === 0 && (
                    <div className="p-4 text-center text-sm text-flow-muted border border-dashed border-flow-border rounded-lg">
                      No items
                    </div>
                  )}
                </div>
              </div>
            )
          })}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {detailItem && (
        <div className="w-96 border-l border-flow-border bg-flow-surface overflow-auto">
          <div className="p-4 border-b border-flow-border flex items-center justify-between">
            <h2 className="font-medium">{detailItem.id}</h2>
            <button
              onClick={() => setDetailItem(null)}
              className="text-flow-muted hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-medium">{detailItem.title}</h3>
              {detailItem.description && (
                <p className="text-sm text-flow-muted mt-1">{detailItem.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={detailItem.priority} size="md" />
              <StatusBadge status={detailItem.status} size="md" />
              {detailItem.effort && <EffortBadge effort={detailItem.effort} />}
              {detailItem.category && (
                <span className="px-2 py-1 text-sm bg-flow-border rounded">
                  {detailItem.category}
                </span>
              )}
            </div>

            {/* Status actions */}
            <div>
              <label className="text-sm text-flow-muted block mb-2">
                Update Status
              </label>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <button
                    key={col.status}
                    onClick={() => updateStatus(detailItem.id, col.status)}
                    disabled={detailItem.status === col.status}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      detailItem.status === col.status
                        ? 'bg-flow-accent/20 border-flow-accent text-flow-accent'
                        : 'border-flow-border hover:border-flow-accent/50'
                    )}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dependencies */}
            {(detailItem.dependsOn.length > 0 || detailItem.enables.length > 0) && (
              <div>
                <label className="text-sm text-flow-muted block mb-2">
                  Dependencies
                </label>
                {detailItem.dependsOn.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-flow-muted">Depends on: </span>
                    {detailItem.dependsOn.map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          const item = items.find((i) => i.id === id)
                          if (item) setDetailItem(item)
                        }}
                        className="text-sm text-flow-accent hover:underline mr-2"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                )}
                {detailItem.enables.length > 0 && (
                  <div>
                    <span className="text-xs text-flow-muted">Enables: </span>
                    {detailItem.enables.map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          const item = items.find((i) => i.id === id)
                          if (item) setDetailItem(item)
                        }}
                        className="text-sm text-flow-accent hover:underline mr-2"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Acceptance Criteria */}
            {detailItem.acceptanceCriteria.length > 0 && (
              <div>
                <label className="text-sm text-flow-muted block mb-2">
                  Acceptance Criteria
                </label>
                <div className="space-y-2">
                  {detailItem.acceptanceCriteria.map((criteria, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={criteria.completed ? 'text-green-400' : 'text-flow-muted'}>
                        {criteria.completed ? '✓' : '○'}
                      </span>
                      <span className={criteria.completed ? 'line-through text-flow-muted' : ''}>
                        {criteria.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Flows */}
            {detailItem.linkedFlows.length > 0 && (
              <div>
                <label className="text-sm text-flow-muted block mb-2">
                  Linked Flows
                </label>
                <div className="space-y-1">
                  {detailItem.linkedFlows.map((flow, i) => (
                    <div
                      key={i}
                      className="text-sm flex items-center justify-between"
                    >
                      <span className="font-mono">{flow.path}</span>
                      <StatusBadge status={flow.status as any} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
