// Flow types
export type FlowType =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'optimization'
  | 'integration'
  | 'greenfield'
  | 'custom'

export type FlowPhase = 'understanding' | 'planning' | 'implementation' | 'completion'

export type FlowStatus = 'active' | 'completed' | 'abandoned'

export interface FlowDocument {
  exists: boolean
  path: string
  content: string
  lastModified: Date
}

export interface Flow {
  id: string
  path: string
  type: FlowType
  name: string
  date: string
  status: FlowStatus
  phase: FlowPhase
  documents: {
    plan: FlowDocument | null
    research: FlowDocument | null
    tasks: FlowDocument | null
    outcome: FlowDocument | null
  }
  tasksTotal: number
  tasksComplete: number
  linkedRoadmapItem: string | null
  lastActivity: Date
}

// Roadmap types
export type RoadmapStatus = 'planned' | 'in-progress' | 'blocked' | 'completed' | 'cancelled'
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'
export type Effort = 'XS' | 'S' | 'M' | 'L' | 'XL'

export interface RoadmapItem {
  id: string
  title: string
  description: string
  status: RoadmapStatus
  priority: Priority
  effort: Effort | null
  category: string | null
  dependsOn: string[]
  enables: string[]
  acceptanceCriteria: { text: string; completed: boolean }[]
  linkedFlows: { path: string; status: string }[]
  createdAt: string | null
  updatedAt: string | null
  filePath: string
}

// Memory types
export type MemoryCategory = 'patterns' | 'lessons' | 'gotchas' | 'architecture' | 'conventions'

export interface MemoryEntry {
  id: string
  category: MemoryCategory
  title: string
  content: string
  confidence: 'high' | 'medium' | 'low' | null
  severity: 'high' | 'medium' | 'low' | null
  source: string | null
  discovered: string | null
}

// Validation types
export type ValidationSeverity = 'critical' | 'high' | 'medium' | 'low'
export type ValidationCategory =
  | 'security'
  | 'architecture'
  | 'quality'
  | 'performance'
  | 'scalability'
  | 'testing'
  | 'error-handling'

export interface ValidationFinding {
  severity: ValidationSeverity
  category: ValidationCategory
  title: string
  description: string
  file: string
  line: number | null
  suggestedFix: string | null
}

export interface ValidationReport {
  flowPath: string
  timestamp: Date
  findings: ValidationFinding[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

// IPC Event types
export interface FileChangeEvent {
  type: 'added' | 'changed' | 'deleted'
  path: string
}

// Project context
export interface ProjectContext {
  path: string
  name: string
  hasFlowContext: boolean
}

// API interface exposed to renderer
export interface FlowAPI {
  // Project
  selectProject: () => Promise<string | null>
  getProjectContext: () => Promise<ProjectContext | null>

  // Flows
  listFlows: () => Promise<Flow[]>
  getFlow: (path: string) => Promise<Flow | null>
  getFlowDocument: (flowPath: string, docType: string) => Promise<string | null>

  // Roadmap
  listRoadmapItems: () => Promise<RoadmapItem[]>
  getRoadmapItem: (id: string) => Promise<RoadmapItem | null>
  updateRoadmapStatus: (id: string, status: RoadmapStatus) => Promise<void>

  // Memory
  listMemoryEntries: () => Promise<MemoryEntry[]>
  searchMemory: (query: string) => Promise<MemoryEntry[]>

  // File watching
  onFileChange: (callback: (event: FileChangeEvent) => void) => () => void

  // Shell
  openInEditor: (path: string) => Promise<void>
  openInTerminal: (path: string) => Promise<void>
}
