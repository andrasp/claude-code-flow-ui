import { useEffect } from 'react'
import { useFlowStore } from '@/stores/flowStore'
import { useRoadmapStore } from '@/stores/roadmapStore'
import { useMemoryStore } from '@/stores/memoryStore'

export function useFileWatcher(): void {
  const refreshFlow = useFlowStore((s) => s.refreshFlow)
  const refreshRoadmap = useRoadmapStore((s) => s.refreshItems)
  const refreshMemory = useMemoryStore((s) => s.refreshEntries)

  useEffect(() => {
    const unsubscribe = window.flowAPI.onFileChange((event) => {
      const { path, type } = event

      // Determine what to refresh based on file path
      if (path.includes('/roadmap/')) {
        refreshRoadmap()
      } else if (path.includes('/.memory/')) {
        refreshMemory()
      } else if (
        path.includes('/feature/') ||
        path.includes('/bugfix/') ||
        path.includes('/refactor/') ||
        path.includes('/optimization/') ||
        path.includes('/integration/') ||
        path.includes('/greenfield/') ||
        path.includes('/custom/')
      ) {
        refreshFlow(path)
      }

      console.log(`File ${type}: ${path}`)
    })

    return () => {
      unsubscribe()
    }
  }, [refreshFlow, refreshRoadmap, refreshMemory])
}
