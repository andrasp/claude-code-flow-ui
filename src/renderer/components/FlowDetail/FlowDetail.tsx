import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, ExternalLink, CheckCircle, Circle } from 'lucide-react'
import { useFlowStore } from '@/stores/flowStore'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ProgressBar } from '@/components/common/ProgressBar'
import { FlowTypeIcon } from '@/components/common/FlowTypeIcon'
import {
  getFlowTypeLabel,
  getPhaseLabel,
  formatDate,
  cn,
} from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const phases = ['understanding', 'planning', 'implementation', 'completion']
const docTypes = ['plan', 'research', 'tasks', 'outcome'] as const

export function FlowDetail(): JSX.Element {
  const { path } = useParams<{ path: string }>()
  const decodedPath = path ? decodeURIComponent(path) : ''

  const flow = useFlowStore((s) => s.selectedFlow)
  const selectFlow = useFlowStore((s) => s.selectFlow)

  const [activeDoc, setActiveDoc] = useState<(typeof docTypes)[number]>('plan')
  const [docContent, setDocContent] = useState<string | null>(null)

  useEffect(() => {
    if (decodedPath) {
      selectFlow(decodedPath)
    }
    return () => {
      selectFlow(null)
    }
  }, [decodedPath, selectFlow])

  useEffect(() => {
    if (flow) {
      const doc = flow.documents[activeDoc]
      setDocContent(doc?.content || null)
    }
  }, [flow, activeDoc])

  if (!flow) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-flow-muted">Loading flow...</p>
      </div>
    )
  }

  const currentPhaseIndex = phases.indexOf(flow.phase)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-flow-border p-4">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/flows"
            className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <FlowTypeIcon type={flow.type} size="lg" />
              <h1 className="text-xl font-semibold">{flow.name}</h1>
              <StatusBadge status={flow.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-flow-muted mt-1">
              <span>{getFlowTypeLabel(flow.type)}</span>
              {flow.date && <span>{formatDate(flow.date)}</span>}
              {flow.linkedRoadmapItem && (
                <Link
                  to={`/roadmap?item=${flow.linkedRoadmapItem}`}
                  className="text-flow-accent hover:underline"
                >
                  {flow.linkedRoadmapItem}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Phase progress */}
        <div className="flex items-center gap-2">
          {phases.map((phase, i) => {
            const isComplete = i < currentPhaseIndex
            const isCurrent = i === currentPhaseIndex

            return (
              <div key={phase} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                    isComplete
                      ? 'bg-green-500/20 text-green-400'
                      : isCurrent
                      ? 'bg-flow-accent/20 text-flow-accent'
                      : 'bg-flow-border text-flow-muted'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  {getPhaseLabel(phase)}
                </div>
                {i < phases.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5',
                      i < currentPhaseIndex ? 'bg-green-500' : 'bg-flow-border'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document sidebar */}
        <div className="w-48 border-r border-flow-border p-3 space-y-1">
          {docTypes.map((docType) => {
            const doc = flow.documents[docType]
            const exists = doc?.exists

            return (
              <button
                key={docType}
                onClick={() => setActiveDoc(docType)}
                disabled={!exists}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                  activeDoc === docType
                    ? 'bg-flow-accent/10 text-flow-accent'
                    : exists
                    ? 'hover:bg-white/5 text-white'
                    : 'text-flow-muted/50 cursor-not-allowed'
                )}
              >
                <FileText className="w-4 h-4" />
                <span>{docType}.md</span>
                {docType === 'tasks' && flow.tasksTotal > 0 && (
                  <span className="ml-auto text-xs">
                    {flow.tasksComplete}/{flow.tasksTotal}
                  </span>
                )}
              </button>
            )
          })}

          {/* Task progress */}
          {flow.tasksTotal > 0 && (
            <div className="pt-4 px-3">
              <p className="text-xs text-flow-muted mb-2">Task Progress</p>
              <ProgressBar
                value={flow.tasksComplete}
                max={flow.tasksTotal}
                showLabel
              />
            </div>
          )}

          {/* Open in editor */}
          <div className="pt-4">
            <button
              onClick={() =>
                window.flowAPI.openInEditor(`${flow.path}/${activeDoc}.md`)
              }
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-flow-muted hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Editor
            </button>
          </div>
        </div>

        {/* Document content */}
        <div className="flex-1 overflow-auto p-6">
          {docContent ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{docContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center text-flow-muted py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Document not found</p>
              <p className="text-sm mt-1">
                This document hasn't been created yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
