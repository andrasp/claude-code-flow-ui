import { Link } from 'react-router-dom'
import { ChevronRight, Clock } from 'lucide-react'
import type { Flow } from '@shared/types'
import { ProgressBar } from '@/components/common/ProgressBar'
import { FlowTypeIcon } from '@/components/common/FlowTypeIcon'
import { getPhaseLabel, getPhaseNumber, formatRelativeTime } from '@/lib/utils'

interface ActiveFlowsProps {
  flows: Flow[]
}

export function ActiveFlows({ flows }: ActiveFlowsProps): JSX.Element {
  return (
    <div className="bg-flow-surface border border-flow-border rounded-lg">
      <div className="p-4 border-b border-flow-border">
        <h2 className="font-medium">Active Flows</h2>
      </div>

      {flows.length === 0 ? (
        <div className="p-8 text-center text-flow-muted">
          <p>No active flows</p>
          <p className="text-sm mt-1">Start a new flow with /flow in Claude Code</p>
        </div>
      ) : (
        <div className="divide-y divide-flow-border">
          {flows.slice(0, 5).map((flow) => (
            <Link
              key={flow.id}
              to={`/flow/${encodeURIComponent(flow.path)}`}
              className="block p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FlowTypeIcon type={flow.type} size="sm" />
                    <span className="font-medium truncate">{flow.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-flow-muted">
                    <span>
                      Phase: {getPhaseLabel(flow.phase)} ({getPhaseNumber(flow.phase)}
                      /4)
                    </span>
                    {flow.tasksTotal > 0 && (
                      <span>
                        Tasks: {flow.tasksComplete}/{flow.tasksTotal}
                      </span>
                    )}
                  </div>

                  {flow.tasksTotal > 0 && (
                    <ProgressBar
                      value={flow.tasksComplete}
                      max={flow.tasksTotal}
                      className="mt-2"
                    />
                  )}

                  <div className="flex items-center gap-1 mt-2 text-xs text-flow-muted">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(new Date(flow.lastActivity))}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-flow-muted flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {flows.length > 5 && (
        <div className="p-3 border-t border-flow-border">
          <Link
            to="/history"
            className="text-sm text-flow-accent hover:underline"
          >
            View all {flows.length} flows
          </Link>
        </div>
      )}
    </div>
  )
}
