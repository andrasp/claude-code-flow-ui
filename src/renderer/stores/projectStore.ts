import { create } from 'zustand'
import type { ProjectContext } from '@shared/types'

interface ProjectState {
  project: ProjectContext | null
  isLoading: boolean
  error: string | null

  // Actions
  setProject: (project: ProjectContext | null) => void
  loadProject: () => Promise<void>
  selectProject: () => Promise<void>
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  isLoading: true,
  error: null,

  setProject: (project) => set({ project, error: null }),

  loadProject: async () => {
    set({ isLoading: true, error: null })
    try {
      // Check if launched from CLI with a project path
      const initialPath = await window.flowAPI.getInitialProjectPath()
      if (initialPath) {
        const project = await window.flowAPI.setProjectPath(initialPath)
        set({ project, isLoading: false })
        return
      }

      // Otherwise check for existing project context
      const project = await window.flowAPI.getProjectContext()
      set({ project, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  selectProject: async () => {
    set({ isLoading: true, error: null })
    try {
      const path = await window.flowAPI.selectProject()
      if (path) {
        const project = await window.flowAPI.getProjectContext()
        set({ project, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },
}))
