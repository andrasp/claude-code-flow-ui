/**
 * Regex-based markdown parser for Flow UI
 * Parses structured markdown files without AI - deterministic extraction
 */

import type {
  Flow,
  FlowType,
  FlowPhase,
  FlowStatus,
  RoadmapItem,
  RoadmapStatus,
  Priority,
  Effort,
  MemoryEntry,
  MemoryCategory,
} from './types'

// Helper to extract a section from markdown
function extractSection(content: string, heading: string): string | null {
  const regex = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'm')
  const match = content.match(regex)
  return match ? match[1].trim() : null
}

// Helper to extract metadata field: "- **Key**: value" or "**Key**: value"
function extractMetadata(content: string, key: string): string | null {
  const regex = new RegExp(`\\*\\*${key}\\*\\*:\\s*(.+)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : null
}

// Parse roadmap item from markdown
export function parseRoadmapItem(content: string, filePath: string): RoadmapItem | null {
  // Title from H1: "# RM-001: User Authentication"
  const idMatch = content.match(/^# (RM-\d+):/m)
  const titleMatch = content.match(/^# RM-\d+:\s*(.+)/m)

  if (!idMatch || !titleMatch) {
    return null
  }

  // Extract metadata
  const statusRaw = extractMetadata(content, 'Status')?.toLowerCase()
  const priorityRaw = extractMetadata(content, 'Priority')
  const effortRaw = extractMetadata(content, 'Effort')
  const category = extractMetadata(content, 'Category')
  const createdAt = extractMetadata(content, 'Created')
  const updatedAt = extractMetadata(content, 'Updated')

  // Parse status
  let status: RoadmapStatus = 'planned'
  if (statusRaw) {
    if (statusRaw.includes('in-progress') || statusRaw.includes('in progress')) {
      status = 'in-progress'
    } else if (statusRaw.includes('blocked')) {
      status = 'blocked'
    } else if (statusRaw.includes('completed') || statusRaw.includes('done')) {
      status = 'completed'
    } else if (statusRaw.includes('cancelled') || statusRaw.includes('canceled')) {
      status = 'cancelled'
    }
  }

  // Parse priority
  let priority: Priority = 'P2'
  if (priorityRaw) {
    const pMatch = priorityRaw.match(/P([0-3])/i)
    if (pMatch) {
      priority = `P${pMatch[1]}` as Priority
    }
  }

  // Parse effort
  let effort: Effort | null = null
  if (effortRaw) {
    const effortUpper = effortRaw.toUpperCase()
    if (['XS', 'S', 'M', 'L', 'XL'].includes(effortUpper)) {
      effort = effortUpper as Effort
    }
  }

  // Parse depends on: "- **Depends on**: RM-001, RM-002" (also supports legacy "Blocked by")
  const dependsOnRaw = extractMetadata(content, 'Depends on') || extractMetadata(content, 'Blocked by')
  const dependsOn = dependsOnRaw
    ? dependsOnRaw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.match(/^RM-\d+$/))
    : []

  // Parse enables: "- **Enables**: RM-003, RM-004" (also supports legacy "Blocks")
  const enablesRaw = extractMetadata(content, 'Enables') || extractMetadata(content, 'Blocks')
  const enables = enablesRaw
    ? enablesRaw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.match(/^RM-\d+$/))
    : []

  // Parse acceptance criteria section
  const criteriaSection = extractSection(content, 'Acceptance Criteria')
  const acceptanceCriteria: { text: string; completed: boolean }[] = []
  if (criteriaSection) {
    const criteriaMatches = criteriaSection.matchAll(/^- \[([ x])\]\s*(.+)$/gm)
    for (const match of criteriaMatches) {
      acceptanceCriteria.push({
        completed: match[1] === 'x',
        text: match[2].trim(),
      })
    }
  }

  // Parse linked flows: "- feature/2025-01-08_auth (completed)"
  const flowsSection = extractSection(content, 'Linked Flows')
  const linkedFlows: { path: string; status: string }[] = []
  if (flowsSection) {
    const flowMatches = flowsSection.matchAll(/^- ([\w\/-]+)\s*\((\w+)\)/gm)
    for (const match of flowMatches) {
      linkedFlows.push({
        path: match[1],
        status: match[2],
      })
    }
  }

  // Extract description (text after metadata, before first ## section)
  const descMatch = content.match(/^# .+\n\n([\s\S]*?)(?=\n## |\n- \*\*)/m)
  const description = descMatch ? descMatch[1].trim() : ''

  return {
    id: idMatch[1],
    title: titleMatch[1].trim(),
    description,
    status,
    priority,
    effort,
    category,
    dependsOn,
    enables,
    acceptanceCriteria,
    linkedFlows,
    createdAt,
    updatedAt,
    filePath,
  }
}

// Parse flow from its directory
export function parseFlowFromPath(flowPath: string): Partial<Flow> {
  // Extract type and name from path: "docs/context/feature/2025-01-08_user-auth"
  const pathMatch = flowPath.match(
    /docs\/context\/(feature|bugfix|refactor|optimization|integration|greenfield|custom)\/(\d{4}-\d{2}-\d{2})_(.+)$/
  )

  if (!pathMatch) {
    // Try without date prefix
    const simpleMatch = flowPath.match(
      /docs\/context\/(feature|bugfix|refactor|optimization|integration|greenfield|custom)\/(.+)$/
    )
    if (simpleMatch) {
      return {
        type: simpleMatch[1] as FlowType,
        name: simpleMatch[2].replace(/-/g, ' '),
        date: '',
      }
    }
    return {}
  }

  return {
    type: pathMatch[1] as FlowType,
    date: pathMatch[2],
    name: pathMatch[3].replace(/-/g, ' '),
  }
}

// Determine flow phase from documents
export function determineFlowPhase(docs: {
  plan: string | null
  research: string | null
  tasks: string | null
  outcome: string | null
}): FlowPhase {
  // Check outcome for completion
  if (docs.outcome) {
    if (docs.outcome.includes('✅ Complete') || docs.outcome.includes('## Results')) {
      return 'completion'
    }
  }

  // Check tasks for implementation
  if (docs.tasks) {
    const totalTasks = (docs.tasks.match(/^- \[[ x]\]/gm) || []).length
    const completedTasks = (docs.tasks.match(/^- \[x\]/gm) || []).length
    if (totalTasks > 0 && completedTasks > 0) {
      return 'implementation'
    }
  }

  // Check plan for planning phase
  if (docs.plan && docs.plan.includes('## ')) {
    return 'planning'
  }

  // Default to understanding
  return 'understanding'
}

// Determine flow status
export function determineFlowStatus(docs: {
  outcome: string | null
}): FlowStatus {
  if (docs.outcome) {
    if (docs.outcome.includes('✅ Complete') || docs.outcome.includes('## Results')) {
      return 'completed'
    }
    if (docs.outcome.includes('❌ Abandoned') || docs.outcome.includes('## Abandoned')) {
      return 'abandoned'
    }
  }
  return 'active'
}

// Count tasks in tasks.md
export function countTasks(tasksContent: string | null): { total: number; complete: number } {
  if (!tasksContent) {
    return { total: 0, complete: 0 }
  }

  const total = (tasksContent.match(/^- \[[ x]\]/gm) || []).length
  const complete = (tasksContent.match(/^- \[x\]/gm) || []).length

  return { total, complete }
}

// Extract linked roadmap item from plan.md
export function extractLinkedRoadmapItem(planContent: string | null): string | null {
  if (!planContent) return null

  // Look for "Roadmap: RM-XXX" or "**Roadmap**: RM-XXX"
  const match = planContent.match(/\*?\*?Roadmap\*?\*?:\s*(RM-\d+)/i)
  return match ? match[1] : null
}

// Parse memory entries from a memory file
export function parseMemoryEntries(
  content: string,
  category: MemoryCategory
): MemoryEntry[] {
  const entries: MemoryEntry[] = []

  // Match ### headings as entry titles (individual entries within ## sections)
  const entryRegex = /^### (.+)$/gm
  const matches = [...content.matchAll(entryRegex)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const title = match[1].trim()
    const startIndex = match.index! + match[0].length

    // Find end of this entry (next ### or next --- or next ## or end)
    const nextMatch = matches[i + 1]
    const nextSeparator = content.indexOf('\n---', startIndex)
    const nextSection = content.indexOf('\n## ', startIndex)

    let endIndex = content.length
    if (nextMatch && nextMatch.index !== undefined) {
      endIndex = Math.min(endIndex, nextMatch.index)
    }
    if (nextSeparator !== -1 && nextSeparator < endIndex) {
      endIndex = nextSeparator
    }
    if (nextSection !== -1 && nextSection < endIndex) {
      endIndex = nextSection
    }

    const block = content.slice(startIndex, endIndex).trim()

    // Extract metadata from block
    const confidence = extractMetadata(block, 'Confidence')?.toLowerCase() as
      | 'high'
      | 'medium'
      | 'low'
      | null
    const severity = extractMetadata(block, 'Severity')?.toLowerCase() as
      | 'high'
      | 'medium'
      | 'low'
      | null
    const impact = extractMetadata(block, 'Impact')?.toLowerCase() as
      | 'high'
      | 'medium'
      | 'low'
      | null
    const source = extractMetadata(block, 'Source')
    const discovered = extractMetadata(block, 'Discovered')

    // Extract actual content - skip metadata lines at the start
    const lines = block.split('\n')
    const contentLines: string[] = []
    let pastMetadata = false

    for (const line of lines) {
      // Skip metadata lines (lines starting with **Key**:)
      if (line.match(/^\*\*\w+\*\*:/)) {
        continue
      }
      // Skip empty lines before content
      if (!pastMetadata && line.trim() === '') {
        continue
      }
      pastMetadata = true
      contentLines.push(line)
    }

    const entryContent = contentLines.join('\n').trim()

    entries.push({
      id: `${category}-${title.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`,
      category,
      title,
      content: entryContent || 'No content',
      confidence,
      severity: severity || impact,
      source,
      discovered,
    })
  }

  return entries
}

// Extract summary from outcome.md
export function parseOutcomeSummary(content: string): {
  status: 'complete' | 'in-progress' | 'abandoned'
  summary: string | null
  changesCount: number
} {
  let status: 'complete' | 'in-progress' | 'abandoned' = 'in-progress'

  if (content.includes('✅ Complete')) {
    status = 'complete'
  } else if (content.includes('❌ Abandoned')) {
    status = 'abandoned'
  }

  const summary = extractSection(content, 'Summary') || extractSection(content, 'Overview')

  // Count file changes (lines starting with "- `")
  const changesCount = (content.match(/^- `/gm) || []).length

  return { status, summary, changesCount }
}
