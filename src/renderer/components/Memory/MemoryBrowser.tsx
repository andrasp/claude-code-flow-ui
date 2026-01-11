import { useEffect } from 'react'
import { Search, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useMemoryStore } from '@/stores/memoryStore'
import { useProjectStore } from '@/stores/projectStore'
import { EmptyState } from '@/components/common/EmptyState'
import { getMemoryCategoryIcon, getMemoryCategoryLabel, cn } from '@/lib/utils'
import type { MemoryCategory } from '@shared/types'

const categories: (MemoryCategory | null)[] = [
  null, // All
  'patterns',
  'lessons',
  'gotchas',
  'architecture',
  'conventions',
]

export function MemoryBrowser(): JSX.Element {
  const project = useProjectStore((s) => s.project)

  const entries = useMemoryStore((s) => s.entries)
  const filteredEntries = useMemoryStore((s) => s.filteredEntries)
  const selectedCategory = useMemoryStore((s) => s.selectedCategory)
  const searchQuery = useMemoryStore((s) => s.searchQuery)
  const loadEntries = useMemoryStore((s) => s.loadEntries)
  const setCategory = useMemoryStore((s) => s.setCategory)
  const search = useMemoryStore((s) => s.search)

  useEffect(() => {
    if (project) {
      loadEntries()
    }
  }, [project, loadEntries])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Brain}
          title="No Project Open"
          description="Open a project to browse its memory"
        />
      </div>
    )
  }

  // Count by category
  const getCategoryCount = (cat: MemoryCategory | null): number => {
    if (!cat) return entries.length
    return entries.filter((e) => e.category === cat).length
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar with categories */}
      <div className="w-56 border-r border-flow-border bg-flow-surface p-4">
        <h2 className="font-medium mb-4">Categories</h2>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat || 'all'}
              onClick={() => setCategory(cat)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                selectedCategory === cat
                  ? 'bg-flow-accent/10 text-flow-accent'
                  : 'text-flow-muted hover:text-white hover:bg-white/5'
              )}
            >
              <span className="flex items-center gap-2">
                {cat ? (
                  <>
                    <span>{getMemoryCategoryIcon(cat)}</span>
                    <span>{getMemoryCategoryLabel(cat)}</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>All</span>
                  </>
                )}
              </span>
              <span className="text-xs bg-flow-border px-2 py-0.5 rounded-full">
                {getCategoryCount(cat)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header with search */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Memory</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flow-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => search(e.target.value)}
                placeholder="Search memory..."
                className="pl-9 pr-4 py-2 bg-flow-surface border border-flow-border rounded-lg text-sm focus:outline-none focus:border-flow-accent w-64"
              />
            </div>
          </div>

          {/* Entries */}
          {filteredEntries.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="No Entries Found"
              description={
                searchQuery
                  ? 'Try a different search term'
                  : 'Memory will be populated as you complete flows'
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-flow-surface border border-flow-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span>{getMemoryCategoryIcon(entry.category)}</span>
                      <h3 className="font-medium">{entry.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {entry.confidence && (
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            entry.confidence === 'high'
                              ? 'bg-green-500/20 text-green-400'
                              : entry.confidence === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-500/20 text-gray-400'
                          )}
                        >
                          {entry.confidence} confidence
                        </span>
                      )}
                      {entry.severity && (
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            entry.severity === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : entry.severity === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-500/20 text-gray-400'
                          )}
                        >
                          {entry.severity} severity
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-flow-muted prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
                  </div>

                  {(entry.source || entry.discovered) && (
                    <div className="mt-3 pt-3 border-t border-flow-border flex items-center gap-4 text-xs text-flow-muted">
                      {entry.source && <span>Source: {entry.source}</span>}
                      {entry.discovered && <span>Discovered: {entry.discovered}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
