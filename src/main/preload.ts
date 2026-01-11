/**
 * Preload script - exposes safe APIs to renderer
 */

import { contextBridge, ipcRenderer } from 'electron'
import type { FileChangeEvent, ProjectContext, Flow, RoadmapItem, RoadmapStatus, MemoryEntry } from './types'

// Expose API to renderer
contextBridge.exposeInMainWorld('flowAPI', {
  // Project
  selectProject: (): Promise<string | null> => ipcRenderer.invoke('project:select'),
  getProjectContext: (): Promise<ProjectContext | null> => ipcRenderer.invoke('project:getContext'),
  setProjectPath: (path: string): Promise<ProjectContext> => ipcRenderer.invoke('project:setPath', path),
  getInitialProjectPath: (): Promise<string | null> => ipcRenderer.invoke('project:getInitialPath'),

  // Flows
  listFlows: (): Promise<Flow[]> => ipcRenderer.invoke('flows:list'),
  getFlow: (path: string): Promise<Flow | null> => ipcRenderer.invoke('flows:get', path),
  getFlowDocument: (flowPath: string, docType: string): Promise<string | null> =>
    ipcRenderer.invoke('flows:getDocument', flowPath, docType),

  // Roadmap
  listRoadmapItems: (): Promise<RoadmapItem[]> => ipcRenderer.invoke('roadmap:list'),
  getRoadmapItem: (id: string): Promise<RoadmapItem | null> => ipcRenderer.invoke('roadmap:get', id),
  updateRoadmapStatus: (id: string, status: RoadmapStatus): Promise<void> =>
    ipcRenderer.invoke('roadmap:updateStatus', id, status),

  // Memory
  listMemoryEntries: (): Promise<MemoryEntry[]> => ipcRenderer.invoke('memory:list'),
  searchMemory: (query: string): Promise<MemoryEntry[]> => ipcRenderer.invoke('memory:search', query),

  // File watching
  onFileChange: (callback: (event: FileChangeEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: FileChangeEvent): void => {
      callback(event)
    }
    ipcRenderer.on('file:changed', handler)
    return () => {
      ipcRenderer.removeListener('file:changed', handler)
    }
  },

  // Menu events
  onMenuOpenProject: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('menu:openProject', handler)
    return () => {
      ipcRenderer.removeListener('menu:openProject', handler)
    }
  },

  onMenuNavigate: (callback: (path: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, path: string): void => callback(path)
    ipcRenderer.on('menu:navigate', handler)
    return () => {
      ipcRenderer.removeListener('menu:navigate', handler)
    }
  },

  // Shell
  openInEditor: (path: string): Promise<void> => ipcRenderer.invoke('shell:openInEditor', path),
  openInTerminal: (path: string): Promise<void> => ipcRenderer.invoke('shell:openTerminal', path),
})

// Type declaration for window
declare global {
  interface Window {
    flowAPI: {
      selectProject: () => Promise<string | null>
      getProjectContext: () => Promise<ProjectContext | null>
      setProjectPath: (path: string) => Promise<ProjectContext>
      getInitialProjectPath: () => Promise<string | null>
      listFlows: () => Promise<Flow[]>
      getFlow: (path: string) => Promise<Flow | null>
      getFlowDocument: (flowPath: string, docType: string) => Promise<string | null>
      listRoadmapItems: () => Promise<RoadmapItem[]>
      getRoadmapItem: (id: string) => Promise<RoadmapItem | null>
      updateRoadmapStatus: (id: string, status: RoadmapStatus) => Promise<void>
      listMemoryEntries: () => Promise<MemoryEntry[]>
      searchMemory: (query: string) => Promise<MemoryEntry[]>
      onFileChange: (callback: (event: FileChangeEvent) => void) => () => void
      onMenuOpenProject: (callback: () => void) => () => void
      onMenuNavigate: (callback: (path: string) => void) => () => void
      openInEditor: (path: string) => Promise<void>
      openInTerminal: (path: string) => Promise<void>
    }
  }
}
