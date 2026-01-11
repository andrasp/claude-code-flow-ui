/**
 * IPC handlers for main process
 * Handles all communication between renderer and main process
 */

import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { glob } from 'glob'
import {
  parseRoadmapItem,
  parseFlowFromPath,
  determineFlowPhase,
  determineFlowStatus,
  countTasks,
  extractLinkedRoadmapItem,
  parseMemoryEntries,
} from './parser'
import { setupWatcher, stopWatcher } from './watcher'
import type {
  Flow,
  FlowDocument,
  RoadmapItem,
  RoadmapStatus,
  MemoryEntry,
  MemoryCategory,
  ProjectContext,
} from './types'

let currentProjectPath: string | null = null

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

async function getFileStat(filePath: string): Promise<Date | null> {
  try {
    const stat = await fs.stat(filePath)
    return stat.mtime
  } catch {
    return null
  }
}

async function loadFlowDocument(
  flowPath: string,
  docName: string
): Promise<FlowDocument | null> {
  const docPath = path.join(flowPath, `${docName}.md`)
  const content = await readFileIfExists(docPath)
  const mtime = await getFileStat(docPath)

  if (content === null) {
    return null
  }

  return {
    exists: true,
    path: docPath,
    content,
    lastModified: mtime || new Date(),
  }
}

export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  // Project selection
  ipcMain.handle('project:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const projectPath = result.filePaths[0]
    const contextPath = path.join(projectPath, 'docs', 'context')
    const hasContext = await fileExists(contextPath)

    if (!hasContext) {
      const confirm = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'No Flow Context',
        message: 'This project does not have a docs/context directory.',
        detail: 'Flow UI requires a claude-code-flow project with docs/context.',
        buttons: ['Select Different Project', 'Open Anyway'],
      })

      if (confirm.response === 0) {
        return null
      }
    }

    currentProjectPath = projectPath
    setupWatcher(mainWindow, projectPath)

    return projectPath
  })

  // Get current project context
  ipcMain.handle('project:getContext', async (): Promise<ProjectContext | null> => {
    if (!currentProjectPath) {
      return null
    }

    const contextPath = path.join(currentProjectPath, 'docs', 'context')
    const hasContext = await fileExists(contextPath)

    return {
      path: currentProjectPath,
      name: path.basename(currentProjectPath),
      hasFlowContext: hasContext,
    }
  })

  // Get initial project path from CLI environment variable or default to cwd
  ipcMain.handle('project:getInitialPath', () => {
    return process.env.FLOW_UI_PROJECT_PATH || process.cwd()
  })

  // Set project path directly (for CLI launch)
  ipcMain.handle('project:setPath', async (_, projectPath: string) => {
    const contextPath = path.join(projectPath, 'docs', 'context')
    const hasContext = await fileExists(contextPath)

    currentProjectPath = projectPath
    setupWatcher(mainWindow, projectPath)

    return {
      path: projectPath,
      name: path.basename(projectPath),
      hasFlowContext: hasContext,
    }
  })

  // List all flows
  ipcMain.handle('flows:list', async (): Promise<Flow[]> => {
    if (!currentProjectPath) return []

    const contextPath = path.join(currentProjectPath, 'docs', 'context')
    const flowTypes = [
      'feature',
      'bugfix',
      'refactor',
      'optimization',
      'integration',
      'greenfield',
      'custom',
    ]

    const flows: Flow[] = []

    for (const type of flowTypes) {
      const typePath = path.join(contextPath, type)
      if (!(await fileExists(typePath))) continue

      const entries = await fs.readdir(typePath, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isDirectory()) continue

        const flowPath = path.join(typePath, entry.name)
        const relativePath = path.relative(currentProjectPath, flowPath)

        // Load documents
        const [plan, research, tasks, outcome] = await Promise.all([
          loadFlowDocument(flowPath, 'plan'),
          loadFlowDocument(flowPath, 'research'),
          loadFlowDocument(flowPath, 'tasks'),
          loadFlowDocument(flowPath, 'outcome'),
        ])

        const flowInfo = parseFlowFromPath(relativePath)
        const phase = determineFlowPhase({
          plan: plan?.content || null,
          research: research?.content || null,
          tasks: tasks?.content || null,
          outcome: outcome?.content || null,
        })
        const status = determineFlowStatus({ outcome: outcome?.content || null })
        const taskCounts = countTasks(tasks?.content || null)
        const linkedItem = extractLinkedRoadmapItem(plan?.content || null)

        // Get last activity from most recent document modification
        const docDates = [plan, research, tasks, outcome]
          .filter((d) => d?.lastModified)
          .map((d) => d!.lastModified)
        const lastActivity =
          docDates.length > 0
            ? new Date(Math.max(...docDates.map((d) => d.getTime())))
            : new Date()

        flows.push({
          id: entry.name,
          path: relativePath,
          type: flowInfo.type || 'custom',
          name: flowInfo.name || entry.name,
          date: flowInfo.date || '',
          status,
          phase,
          documents: { plan, research, tasks, outcome },
          tasksTotal: taskCounts.total,
          tasksComplete: taskCounts.complete,
          linkedRoadmapItem: linkedItem,
          lastActivity,
        })
      }
    }

    // Sort by last activity, most recent first
    flows.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())

    return flows
  })

  // Get single flow
  ipcMain.handle('flows:get', async (_, flowPath: string): Promise<Flow | null> => {
    if (!currentProjectPath) return null

    const fullPath = path.join(currentProjectPath, flowPath)
    if (!(await fileExists(fullPath))) return null

    const [plan, research, tasks, outcome] = await Promise.all([
      loadFlowDocument(fullPath, 'plan'),
      loadFlowDocument(fullPath, 'research'),
      loadFlowDocument(fullPath, 'tasks'),
      loadFlowDocument(fullPath, 'outcome'),
    ])

    const flowInfo = parseFlowFromPath(flowPath)
    const phase = determineFlowPhase({
      plan: plan?.content || null,
      research: research?.content || null,
      tasks: tasks?.content || null,
      outcome: outcome?.content || null,
    })
    const status = determineFlowStatus({ outcome: outcome?.content || null })
    const taskCounts = countTasks(tasks?.content || null)
    const linkedItem = extractLinkedRoadmapItem(plan?.content || null)

    const docDates = [plan, research, tasks, outcome]
      .filter((d) => d?.lastModified)
      .map((d) => d!.lastModified)
    const lastActivity =
      docDates.length > 0
        ? new Date(Math.max(...docDates.map((d) => d.getTime())))
        : new Date()

    return {
      id: path.basename(flowPath),
      path: flowPath,
      type: flowInfo.type || 'custom',
      name: flowInfo.name || path.basename(flowPath),
      date: flowInfo.date || '',
      status,
      phase,
      documents: { plan, research, tasks, outcome },
      tasksTotal: taskCounts.total,
      tasksComplete: taskCounts.complete,
      linkedRoadmapItem: linkedItem,
      lastActivity,
    }
  })

  // Get flow document content
  ipcMain.handle(
    'flows:getDocument',
    async (_, flowPath: string, docType: string): Promise<string | null> => {
      if (!currentProjectPath) return null
      const docPath = path.join(currentProjectPath, flowPath, `${docType}.md`)
      return readFileIfExists(docPath)
    }
  )

  // List roadmap items
  ipcMain.handle('roadmap:list', async (): Promise<RoadmapItem[]> => {
    if (!currentProjectPath) return []

    const itemsPath = path.join(currentProjectPath, 'docs', 'context', 'roadmap', 'items')
    if (!(await fileExists(itemsPath))) return []

    const files = await glob('*.md', { cwd: itemsPath })
    const items: RoadmapItem[] = []

    for (const file of files) {
      const filePath = path.join(itemsPath, file)
      const content = await readFileIfExists(filePath)
      if (!content) continue

      const item = parseRoadmapItem(content, filePath)
      if (item) {
        items.push(item)
      }
    }

    // Sort by priority, then by ID
    items.sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 }
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (pDiff !== 0) return pDiff
      return a.id.localeCompare(b.id)
    })

    return items
  })

  // Get single roadmap item
  ipcMain.handle('roadmap:get', async (_, id: string): Promise<RoadmapItem | null> => {
    if (!currentProjectPath) return null

    const itemsPath = path.join(currentProjectPath, 'docs', 'context', 'roadmap', 'items')
    const files = await glob('*.md', { cwd: itemsPath })

    for (const file of files) {
      const filePath = path.join(itemsPath, file)
      const content = await readFileIfExists(filePath)
      if (!content) continue

      const item = parseRoadmapItem(content, filePath)
      if (item && item.id === id) {
        return item
      }
    }

    return null
  })

  // Update roadmap item status
  ipcMain.handle(
    'roadmap:updateStatus',
    async (_, id: string, status: RoadmapStatus): Promise<void> => {
      if (!currentProjectPath) return

      const itemsPath = path.join(currentProjectPath, 'docs', 'context', 'roadmap', 'items')
      const files = await glob('*.md', { cwd: itemsPath })

      for (const file of files) {
        const filePath = path.join(itemsPath, file)
        const content = await readFileIfExists(filePath)
        if (!content) continue

        if (content.includes(`# ${id}:`)) {
          const updated = content.replace(
            /\*\*Status\*\*:\s*.+/,
            `**Status**: ${status}`
          )
          await fs.writeFile(filePath, updated, 'utf-8')
          return
        }
      }
    }
  )

  // List memory entries
  ipcMain.handle('memory:list', async (): Promise<MemoryEntry[]> => {
    if (!currentProjectPath) return []

    const memoryPath = path.join(currentProjectPath, 'docs', 'context', '.memory')
    if (!(await fileExists(memoryPath))) return []

    const categories: MemoryCategory[] = [
      'patterns',
      'lessons',
      'gotchas',
      'architecture',
      'conventions',
    ]
    const entries: MemoryEntry[] = []

    for (const category of categories) {
      const filePath = path.join(memoryPath, `${category}.md`)
      const content = await readFileIfExists(filePath)
      if (content) {
        entries.push(...parseMemoryEntries(content, category))
      }
    }

    return entries
  })

  // Search memory
  ipcMain.handle('memory:search', async (_, query: string): Promise<MemoryEntry[]> => {
    if (!currentProjectPath) return []

    const memoryPath = path.join(currentProjectPath, 'docs', 'context', '.memory')
    if (!(await fileExists(memoryPath))) return []

    const categories: MemoryCategory[] = [
      'patterns',
      'lessons',
      'gotchas',
      'architecture',
      'conventions',
    ]
    const entries: MemoryEntry[] = []

    for (const category of categories) {
      const filePath = path.join(memoryPath, `${category}.md`)
      const content = await readFileIfExists(filePath)
      if (content) {
        entries.push(...parseMemoryEntries(content, category))
      }
    }

    const lowerQuery = query.toLowerCase()
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.content.toLowerCase().includes(lowerQuery)
    )
  })

  // Open file in default editor
  ipcMain.handle('shell:openInEditor', async (_, filePath: string): Promise<void> => {
    const fullPath = currentProjectPath
      ? path.join(currentProjectPath, filePath)
      : filePath
    await shell.openPath(fullPath)
  })

  // Open terminal at path
  ipcMain.handle('shell:openTerminal', async (_, dirPath: string): Promise<void> => {
    const fullPath = currentProjectPath
      ? path.join(currentProjectPath, dirPath)
      : dirPath

    // macOS specific - open Terminal.app
    if (process.platform === 'darwin') {
      const { exec } = await import('child_process')
      exec(`open -a Terminal "${fullPath}"`)
    }
    // Add Windows/Linux support as needed
  })
}

export function cleanup(): void {
  stopWatcher()
  ipcMain.removeAllListeners()
}
