import { create } from 'zustand'
import type { MemoryEntry, MemoryCategory } from '@shared/types'

interface MemoryState {
  entries: MemoryEntry[]
  filteredEntries: MemoryEntry[]
  selectedCategory: MemoryCategory | null
  searchQuery: string
  isLoading: boolean
  error: string | null

  // Actions
  loadEntries: () => Promise<void>
  setCategory: (category: MemoryCategory | null) => void
  search: (query: string) => Promise<void>
  refreshEntries: () => Promise<void>
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  entries: [],
  filteredEntries: [],
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null })
    try {
      const entries = await window.flowAPI.listMemoryEntries()
      set({ entries, filteredEntries: entries, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  setCategory: (category) => {
    const { entries, searchQuery } = get()
    let filtered = entries

    if (category) {
      filtered = filtered.filter((e) => e.category === category)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.content.toLowerCase().includes(query)
      )
    }

    set({ selectedCategory: category, filteredEntries: filtered })
  },

  search: async (query) => {
    set({ searchQuery: query })

    const { entries, selectedCategory } = get()
    let filtered = entries

    if (selectedCategory) {
      filtered = filtered.filter((e) => e.category === selectedCategory)
    }

    if (query) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(lowerQuery) ||
          e.content.toLowerCase().includes(lowerQuery)
      )
    }

    set({ filteredEntries: filtered })
  },

  refreshEntries: async () => {
    const entries = await window.flowAPI.listMemoryEntries()
    const { selectedCategory, searchQuery } = get()

    let filtered = entries

    if (selectedCategory) {
      filtered = filtered.filter((e) => e.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.content.toLowerCase().includes(query)
      )
    }

    set({ entries, filteredEntries: filtered })
  },
}))
