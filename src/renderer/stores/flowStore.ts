import { create } from 'zustand'
import type { Flow } from '@shared/types'

interface FlowState {
  flows: Flow[]
  selectedFlow: Flow | null
  isLoading: boolean
  error: string | null

  // Actions
  loadFlows: () => Promise<void>
  selectFlow: (path: string | null) => Promise<void>
  refreshFlow: (path: string) => Promise<void>
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  selectedFlow: null,
  isLoading: false,
  error: null,

  loadFlows: async () => {
    set({ isLoading: true, error: null })
    try {
      const flows = await window.flowAPI.listFlows()
      set({ flows, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  selectFlow: async (path) => {
    if (!path) {
      set({ selectedFlow: null })
      return
    }

    try {
      const flow = await window.flowAPI.getFlow(path)
      set({ selectedFlow: flow })
    } catch (err) {
      set({ error: String(err) })
    }
  },

  refreshFlow: async (path) => {
    const { selectedFlow, flows } = get()

    // Refresh flows list
    const updatedFlows = await window.flowAPI.listFlows()
    set({ flows: updatedFlows })

    // Refresh selected flow if it matches
    if (selectedFlow && path.includes(selectedFlow.path)) {
      const updatedFlow = await window.flowAPI.getFlow(selectedFlow.path)
      set({ selectedFlow: updatedFlow })
    }
  },
}))
