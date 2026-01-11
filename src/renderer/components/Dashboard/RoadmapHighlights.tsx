import { Link } from 'react-router-dom'
import { ChevronRight, AlertCircle } from 'lucide-react'
import type { RoadmapItem } from '@shared/types'
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge'

interface RoadmapHighlightsProps {
  items: RoadmapItem[]
}

export function RoadmapHighlights({ items }: RoadmapHighlightsProps): JSX.Element {
  // Show high priority items that aren't completed
  const highlights = items
    .filter((item) => item.status !== 'completed' && item.status !== 'cancelled')
    .slice(0, 5)

  const blockedCount = items.filter((i) => i.status === 'blocked').length

  return (
    <div className="bg-flow-surface border border-flow-border rounded-lg">
      <div className="p-4 border-b border-flow-border flex items-center justify-between">
        <h2 className="font-medium">Roadmap Highlights</h2>
        {blockedCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{blockedCount} blocked</span>
          </div>
        )}
      </div>

      {highlights.length === 0 ? (
        <div className="p-8 text-center text-flow-muted">
          <p>No roadmap items</p>
          <p className="text-sm mt-1">Add items with /flow-roadmap add</p>
        </div>
      ) : (
        <div className="divide-y divide-flow-border">
          {highlights.map((item) => (
            <Link
              key={item.id}
              to={`/roadmap?item=${item.id}`}
              className="block p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={item.priority} />
                    <span className="text-sm text-flow-muted font-mono">
                      {item.id}
                    </span>
                  </div>

                  <p className="font-medium truncate">{item.title}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={item.status} />
                    {item.dependsOn.length > 0 && (
                      <span className="text-xs text-flow-muted">
                        Depends on: {item.dependsOn.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-flow-muted flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {items.length > 5 && (
        <div className="p-3 border-t border-flow-border">
          <Link to="/roadmap" className="text-sm text-flow-accent hover:underline">
            View full roadmap ({items.length} items)
          </Link>
        </div>
      )}
    </div>
  )
}
