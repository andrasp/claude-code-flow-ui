import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/common/Sidebar'
import { Dashboard } from '@/components/Dashboard/Dashboard'
import { RoadmapBoard } from '@/components/Roadmap/RoadmapBoard'
import { MemoryBrowser } from '@/components/Memory/MemoryBrowser'
import { FlowDetail } from '@/components/FlowDetail/FlowDetail'
import { FlowHistory } from '@/components/History/FlowHistory'
import { FlowList } from '@/components/Flows/FlowList'
import { useProjectStore } from '@/stores/projectStore'
import { useFileWatcher } from '@/hooks/useFileWatcher'
import { useMenuEvents } from '@/hooks/useMenuEvents'

export default function App(): JSX.Element {
  const loadProject = useProjectStore((s) => s.loadProject)

  // Set up file watcher for real-time updates
  useFileWatcher()

  // Set up menu event handlers
  useMenuEvents()

  // Load project context on mount
  useEffect(() => {
    loadProject()
  }, [loadProject])

  return (
    <div className="flex flex-col h-full bg-flow-bg text-white">
      {/* Full-width drag region for window controls */}
      <div className="h-10 drag-region flex-shrink-0 bg-flow-surface border-b border-flow-border" />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/flows" element={<FlowList />} />
            <Route path="/roadmap" element={<RoadmapBoard />} />
            <Route path="/memory" element={<MemoryBrowser />} />
            <Route path="/history" element={<FlowHistory />} />
            <Route path="/flow/:path" element={<FlowDetail />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
