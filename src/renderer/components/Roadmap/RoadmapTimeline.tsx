import { useMemo, useState } from 'react'
import type { RoadmapItem } from '@shared/types'
import { cn } from '@/lib/utils'

interface RoadmapTimelineProps {
  items: RoadmapItem[]
  onSelectItem: (item: RoadmapItem) => void
  selectedItemId: string | null
}

const statusColors: Record<string, string> = {
  planned: 'bg-gray-500',
  'in-progress': 'bg-blue-500',
  blocked: 'bg-red-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-700',
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  P0: { bg: 'bg-red-500', text: 'text-white' },
  P1: { bg: 'bg-orange-500', text: 'text-white' },
  P2: { bg: 'bg-yellow-500', text: 'text-black' },
  P3: { bg: 'bg-gray-400', text: 'text-black' },
}

// Work type abbreviations and colors
const workTypeConfig: Record<string, { abbr: string; bg: string; text: string }> = {
  greenfield: { abbr: 'GREEN', bg: 'bg-emerald-600', text: 'text-white' },
  feature: { abbr: 'FEAT', bg: 'bg-blue-600', text: 'text-white' },
  integration: { abbr: 'INTG', bg: 'bg-purple-600', text: 'text-white' },
  refactor: { abbr: 'REFAC', bg: 'bg-cyan-600', text: 'text-white' },
  optimization: { abbr: 'OPT', bg: 'bg-amber-600', text: 'text-white' },
  perf: { abbr: 'OPT', bg: 'bg-amber-600', text: 'text-white' }, // alias
  bugfix: { abbr: 'BUG', bg: 'bg-rose-600', text: 'text-white' },
  custom: { abbr: 'CUST', bg: 'bg-slate-600', text: 'text-white' },
  security: { abbr: 'SEC', bg: 'bg-red-700', text: 'text-white' },
  enhancement: { abbr: 'ENH', bg: 'bg-indigo-600', text: 'text-white' },
}

const getWorkType = (category: string | null): { abbr: string; bg: string; text: string } => {
  if (!category) return { abbr: '?', bg: 'bg-slate-600', text: 'text-white' }
  return workTypeConfig[category.toLowerCase()] || { abbr: category.slice(0, 3).toUpperCase(), bg: 'bg-slate-600', text: 'text-white' }
}

// Effort to width in "units" (each unit = column width)
const effortToUnits: Record<string, number> = {
  XS: 1,
  S: 2,
  M: 3,
  L: 5,
  XL: 8,
}

interface ScheduledItem {
  item: RoadmapItem
  row: number
  startCol: number
  span: number
}

// Schedule items into rows, respecting dependencies
function scheduleItems(items: RoadmapItem[]): { scheduled: ScheduledItem[]; totalCols: number; totalRows: number } {
  const scheduled: ScheduledItem[] = []
  const itemPositions = new Map<string, { startCol: number; endCol: number; row: number }>()

  // Sort by dependency depth first (items with no deps first), then by priority (P0 first), then by ID
  // This ensures higher priority items get placed in earlier rows
  const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }

  // Calculate dependency depth for each item
  const depthMap = new Map<string, number>()
  const getDepth = (itemId: string, visited = new Set<string>()): number => {
    if (visited.has(itemId)) return 0 // Circular dependency protection
    if (depthMap.has(itemId)) return depthMap.get(itemId)!

    const item = items.find(i => i.id === itemId)
    if (!item || item.dependsOn.length === 0) {
      depthMap.set(itemId, 0)
      return 0
    }

    visited.add(itemId)
    const maxDepth = Math.max(...item.dependsOn.map(depId => getDepth(depId, visited) + 1))
    depthMap.set(itemId, maxDepth)
    return maxDepth
  }

  items.forEach(item => getDepth(item.id))

  const sorted = [...items].sort((a, b) => {
    // First by dependency depth (items that can start earlier first)
    const depthA = depthMap.get(a.id) || 0
    const depthB = depthMap.get(b.id) || 0
    if (depthA !== depthB) return depthA - depthB

    // Then by priority (P0 first = lower row number = appears higher)
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pDiff !== 0) return pDiff

    // Then by ID for stability
    return a.id.localeCompare(b.id)
  })

  // Track which columns are occupied in each row
  const rowOccupancy: Map<number, Set<number>> = new Map()

  const isColRangeAvailable = (row: number, startCol: number, endCol: number): boolean => {
    const occupied = rowOccupancy.get(row)
    if (!occupied) return true
    for (let col = startCol; col < endCol; col++) {
      if (occupied.has(col)) return false
    }
    return true
  }

  const occupyColRange = (row: number, startCol: number, endCol: number): void => {
    if (!rowOccupancy.has(row)) {
      rowOccupancy.set(row, new Set())
    }
    const occupied = rowOccupancy.get(row)!
    for (let col = startCol; col < endCol; col++) {
      occupied.add(col)
    }
  }

  for (const item of sorted) {
    const span = effortToUnits[item.effort || 'M']

    // Find earliest start column based on dependencies
    let earliestStart = 0
    for (const depId of item.dependsOn) {
      const depPos = itemPositions.get(depId)
      if (depPos) {
        earliestStart = Math.max(earliestStart, depPos.endCol)
      }
    }

    // Find a row where this item fits at exactly earliestStart
    // This allows parallel items (no dependencies) to stack vertically
    let placed = false
    for (let row = 0; row < 100 && !placed; row++) {
      // Only place at earliestStart - don't slide right, just try next row
      if (isColRangeAvailable(row, earliestStart, earliestStart + span)) {
        occupyColRange(row, earliestStart, earliestStart + span)
        itemPositions.set(item.id, { startCol: earliestStart, endCol: earliestStart + span, row })
        scheduled.push({ item, row, startCol: earliestStart, span })
        placed = true
      }
    }
  }

  const totalCols = Math.max(...scheduled.map(s => s.startCol + s.span), 1)
  const totalRows = Math.max(...scheduled.map(s => s.row), 0) + 1

  return { scheduled, totalCols, totalRows }
}

// Layout constants - single source of truth
const LAYOUT = {
  colWidth: 120,
  rowHeight: 56,
  barPaddingX: 10,  // horizontal padding on each side
  barPaddingY: 8,   // vertical padding on top/bottom
  svgPadding: 20,   // padding around the SVG content
}

// Calculate bar geometry for a scheduled item
function getBarGeometry(row: number, startCol: number, span: number) {
  const left = startCol * LAYOUT.colWidth + LAYOUT.barPaddingX
  const top = row * LAYOUT.rowHeight + LAYOUT.barPaddingY
  const width = span * LAYOUT.colWidth - 2 * LAYOUT.barPaddingX
  const height = LAYOUT.rowHeight - 2 * LAYOUT.barPaddingY
  return { left, top, width, height }
}

export function RoadmapTimeline({
  items,
  onSelectItem,
  selectedItemId,
}: RoadmapTimelineProps): JSX.Element {
  const { scheduled, totalCols, totalRows } = useMemo(() => scheduleItems(items), [items])

  // Build dependency lines using bar geometry
  const dependencyLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
    const itemPositions = new Map<string, ScheduledItem>()
    for (const s of scheduled) {
      itemPositions.set(s.item.id, s)
    }

    for (const s of scheduled) {
      for (const depId of s.item.dependsOn) {
        const dep = itemPositions.get(depId)
        if (dep) {
          const sourceBar = getBarGeometry(dep.row, dep.startCol, dep.span)
          const destBar = getBarGeometry(s.row, s.startCol, s.span)

          lines.push({
            x1: sourceBar.left + sourceBar.width,  // right edge of source
            y1: sourceBar.top + sourceBar.height / 2,  // vertical center
            x2: destBar.left,  // left edge of dest
            y2: destBar.top + destBar.height / 2,  // vertical center
          })
        }
      }
    }
    return lines
  }, [scheduled])

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ item: RoadmapItem; x: number; y: number } | null>(null)

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 text-xs">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-flow-surface rounded border border-flow-border">
          <span className="text-flow-muted font-medium">Status:</span>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-gray-500" /><span className="text-flow-muted">Plan</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-blue-500" /><span className="text-flow-muted">WIP</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-500" /><span className="text-flow-muted">Block</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-green-500" /><span className="text-flow-muted">Done</span></div>
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 bg-flow-surface rounded border border-flow-border">
          <span className="text-flow-muted font-medium">Priority:</span>
          <div className="flex items-center gap-1"><span className="px-1 rounded font-bold bg-red-500 text-white">P0</span><span className="text-flow-muted">Crit</span></div>
          <div className="flex items-center gap-1"><span className="px-1 rounded font-bold bg-orange-500 text-white">P1</span><span className="text-flow-muted">High</span></div>
          <div className="flex items-center gap-1"><span className="px-1 rounded font-bold bg-yellow-500 text-black">P2</span><span className="text-flow-muted">Med</span></div>
          <div className="flex items-center gap-1"><span className="px-1 rounded font-bold bg-gray-400 text-black">P3</span><span className="text-flow-muted">Low</span></div>
        </div>
        <div className="px-3 py-1.5 bg-flow-surface rounded border border-flow-border text-flow-muted">
          Width = effort (XS→XL)
        </div>
      </div>

      {/* Gantt chart */}
      <div
        className="relative"
        style={{
          width: totalCols * LAYOUT.colWidth + 2 * LAYOUT.svgPadding,
          height: totalRows * LAYOUT.rowHeight + 2 * LAYOUT.svgPadding,
          minWidth: '100%',
        }}
      >
        {/* Grid lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: totalCols * LAYOUT.colWidth + 2 * LAYOUT.svgPadding,
            height: totalRows * LAYOUT.rowHeight + 2 * LAYOUT.svgPadding,
          }}
        >
          {/* Vertical grid lines */}
          {Array.from({ length: totalCols + 1 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * LAYOUT.colWidth + LAYOUT.svgPadding}
              y1={0}
              x2={i * LAYOUT.colWidth + LAYOUT.svgPadding}
              y2={totalRows * LAYOUT.rowHeight + LAYOUT.svgPadding}
              stroke="#2a2a2a"
              strokeWidth={1}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: totalRows + 1 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * LAYOUT.rowHeight + LAYOUT.svgPadding}
              x2={totalCols * LAYOUT.colWidth + LAYOUT.svgPadding}
              y2={i * LAYOUT.rowHeight + LAYOUT.svgPadding}
              stroke="#2a2a2a"
              strokeWidth={1}
            />
          ))}

          {/* Dependency lines */}
          {dependencyLines.map((line, i) => {
            // Add SVG padding offset to all coordinates
            const x1 = line.x1 + LAYOUT.svgPadding
            const y1 = line.y1 + LAYOUT.svgPadding
            const x2 = line.x2 + LAYOUT.svgPadding
            const y2 = line.y2 + LAYOUT.svgPadding
            // Control points for bezier curve
            const midX = (x1 + x2) / 2
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#666"
                strokeWidth={2}
              />
            )
          })}
        </svg>

        {/* Items */}
        {scheduled.map(({ item, row, startCol, span }) => {
          const workType = getWorkType(item.category)
          const priority = priorityColors[item.priority] || priorityColors.P3
          const bar = getBarGeometry(row, startCol, span)
          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              onMouseEnter={() => setTooltip({
                item,
                x: bar.left + LAYOUT.svgPadding + bar.width / 2,
                y: bar.top + LAYOUT.svgPadding,
              })}
              onMouseLeave={() => setTooltip(null)}
              className={cn(
                'absolute flex items-center gap-0 rounded overflow-hidden transition-all',
                'hover:ring-2 hover:ring-flow-accent/50',
                selectedItemId === item.id && 'ring-2 ring-flow-accent'
              )}
              style={{
                left: bar.left + LAYOUT.svgPadding,
                top: bar.top + LAYOUT.svgPadding,
                width: bar.width,
                height: bar.height,
              }}
            >
              {/* Work type badge - left section */}
              <div className={cn(
                'h-full flex items-center justify-center px-2 flex-shrink-0',
                workType.bg, workType.text
              )}>
                <span className="text-xs font-bold whitespace-nowrap">{workType.abbr}</span>
              </div>
              {/* Main content - status colored */}
              <div className={cn(
                'h-full flex-1 flex items-center gap-2 px-2 min-w-0',
                statusColors[item.status]
              )}>
                <span className="text-xs font-mono text-white/70 flex-shrink-0">{item.id}</span>
                <span className="text-sm font-medium text-white truncate flex-1">
                  {item.title}
                </span>
              </div>
              {/* Priority badge - right section */}
              <div className={cn(
                'h-full flex items-center justify-center px-2 flex-shrink-0',
                priority.bg, priority.text
              )}>
                <span className="text-xs font-bold">{item.priority}</span>
              </div>
            </button>
          )
        })}

        {/* Instant tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 px-3 py-2 bg-flow-surface border border-flow-border rounded shadow-lg pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 8,
              transform: 'translate(-50%, -100%)',
              maxWidth: 300,
            }}
          >
            <div className="font-medium text-sm">{tooltip.item.title}</div>
            <div className="text-xs text-flow-muted mt-1">
              {tooltip.item.id} · {tooltip.item.effort || 'M'} · {tooltip.item.category || 'unknown'}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center text-flow-muted py-12">
          No roadmap items
        </div>
      )}
    </div>
  )
}
