import { create } from 'zustand'
import type { RoadmapItem, RoadmapStatus } from '@shared/types'

interface RoadmapState {
  items: RoadmapItem[]
  selectedItem: RoadmapItem | null
  isLoading: boolean
  error: string | null

  // Actions
  loadItems: () => Promise<void>
  selectItem: (id: string | null) => void
  updateStatus: (id: string, status: RoadmapStatus) => Promise<void>
  refreshItems: () => Promise<void>
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,

  loadItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await window.flowAPI.listRoadmapItems()
      set({ items, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  selectItem: (id) => {
    const { items } = get()
    const item = id ? items.find((i) => i.id === id) : null
    set({ selectedItem: item || null })
  },

  updateStatus: async (id, status) => {
    try {
      await window.flowAPI.updateRoadmapStatus(id, status)
      // Refresh items after update
      await get().refreshItems()
    } catch (err) {
      set({ error: String(err) })
    }
  },

  refreshItems: async () => {
    const items = await window.flowAPI.listRoadmapItems()
    const { selectedItem } = get()

    set({ items })

    // Update selected item if it was refreshed
    if (selectedItem) {
      const updated = items.find((i) => i.id === selectedItem.id)
      if (updated) {
        set({ selectedItem: updated })
      }
    }
  },
}))
