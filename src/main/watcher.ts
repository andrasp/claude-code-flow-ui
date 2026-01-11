/**
 * File system watcher for docs/context directory
 * Uses chokidar for cross-platform file watching
 */

import { watch, type FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'
import path from 'path'

let watcher: FSWatcher | null = null

export function setupWatcher(
  mainWindow: BrowserWindow,
  projectPath: string
): FSWatcher {
  // Clean up existing watcher
  if (watcher) {
    watcher.close()
  }

  const contextPath = path.join(projectPath, 'docs', 'context')

  watcher = watch(`${contextPath}/**/*.md`, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  })

  watcher.on('change', (filePath) => {
    const relativePath = path.relative(projectPath, filePath)
    mainWindow.webContents.send('file:changed', {
      type: 'changed',
      path: relativePath,
    })
  })

  watcher.on('add', (filePath) => {
    const relativePath = path.relative(projectPath, filePath)
    mainWindow.webContents.send('file:changed', {
      type: 'added',
      path: relativePath,
    })
  })

  watcher.on('unlink', (filePath) => {
    const relativePath = path.relative(projectPath, filePath)
    mainWindow.webContents.send('file:changed', {
      type: 'deleted',
      path: relativePath,
    })
  })

  watcher.on('error', (error) => {
    console.error('Watcher error:', error)
  })

  return watcher
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}

export function getWatcher(): FSWatcher | null {
  return watcher
}
