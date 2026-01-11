/**
 * Flow UI - Main Process Entry Point
 */

import { app, shell, BrowserWindow, Menu, nativeImage } from 'electron'
import * as path from 'path'
import { setupIpcHandlers, cleanup } from './ipc-handlers'

const APP_NAME = 'Flow UI'

// Set app name explicitly
app.setName(APP_NAME)

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Load icon for window
  const iconPath = path.join(__dirname, '../../assets/icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    autoHideMenuBar: true,
    icon: icon.isEmpty() ? undefined : icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.maximize()
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Set up IPC handlers
  setupIpcHandlers(mainWindow)

  // Load the app from built files
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: APP_NAME,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: (): void => {
            mainWindow?.webContents.send('menu:openProject')
          },
        },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: (): void => {
            mainWindow?.webContents.send('menu:navigate', '/')
          },
        },
        {
          label: 'Roadmap',
          accelerator: 'CmdOrCtrl+2',
          click: (): void => {
            mainWindow?.webContents.send('menu:navigate', '/roadmap')
          },
        },
        {
          label: 'Memory',
          accelerator: 'CmdOrCtrl+3',
          click: (): void => {
            mainWindow?.webContents.send('menu:navigate', '/memory')
          },
        },
        {
          label: 'History',
          accelerator: 'CmdOrCtrl+4',
          click: (): void => {
            mainWindow?.webContents.send('menu:navigate', '/history')
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: (): void => {
            shell.openExternal('https://github.com/andrasp/claude-code-flow')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  cleanup()
  app.quit()
})
