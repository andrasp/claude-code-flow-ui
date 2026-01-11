import { useEffect } from 'react'
import { useFlowStore } from '@/stores/flowStore'
import { useRoadmapStore } from '@/stores/roadmapStore'
import { useMemoryStore } from '@/stores/memoryStore'
import { useProjectStore } from '@/stores/projectStore'
import { ActiveFlows } from './ActiveFlows'
import { RoadmapHighlights } from './RoadmapHighlights'
import { StatsCards } from './StatsCards'
import { EmptyState } from '@/components/common/EmptyState'
import { FolderOpen } from 'lucide-react'

export function Dashboard(): JSX.Element {
  const project = useProjectStore((s) => s.project)
  const selectProject = useProjectStore((s) => s.selectProject)

  const flows = useFlowStore((s) => s.flows)
  const loadFlows = useFlowStore((s) => s.loadFlows)

  const roadmapItems = useRoadmapStore((s) => s.items)
  const loadRoadmap = useRoadmapStore((s) => s.loadItems)

  const memoryEntries = useMemoryStore((s) => s.entries)
  const loadMemory = useMemoryStore((s) => s.loadEntries)

  useEffect(() => {
    if (project) {
      loadFlows()
      loadRoadmap()
      loadMemory()
    }
  }, [project, loadFlows, loadRoadmap, loadMemory])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={FolderOpen}
          title="No Project Open"
          description="Open a claude-code-flow project to get started"
          action={{
            label: 'Open Project',
            onClick: selectProject,
          }}
        />
      </div>
    )
  }

  const activeFlows = flows.filter((f) => f.status === 'active')
  const completedFlows = flows.filter((f) => f.status === 'completed')

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
          <p className="text-flow-muted">{project.name}</p>
        </div>

        {/* Stats */}
        <StatsCards
          activeFlows={activeFlows.length}
          completedFlows={completedFlows.length}
          roadmapItems={roadmapItems.length}
          memoryEntries={memoryEntries.length}
        />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ActiveFlows flows={activeFlows} />
          <RoadmapHighlights items={roadmapItems} />
        </div>
      </div>
    </div>
  )
}
