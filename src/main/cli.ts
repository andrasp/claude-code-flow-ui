#!/usr/bin/env node
/**
 * CLI entry point for Flow UI
 *
 * Usage:
 *   flow-ui              # Opens UI, looks for docs/context in current directory
 *   flow-ui /path/to/project  # Opens UI with specified project root
 */

import * as path from 'path'
import * as fs from 'fs'

function main(): void {
  const args = process.argv.slice(2)

  // Help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Flow UI - Visual layer for Claude Code Flow

Usage:
  flow-ui [path]         Open Flow UI

Arguments:
  path                   Path to project root containing docs/context/
                         Defaults to current working directory

Options:
  -h, --help            Show this help message
  -v, --version         Show version number

Examples:
  flow-ui               Open UI for current directory
  flow-ui .             Same as above
  flow-ui ~/projects/my-app    Open UI for specific project
`)
    process.exit(0)
  }

  // Version flag
  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('../../package.json')
    console.log(pkg.version)
    process.exit(0)
  }

  // Determine project path
  let projectPath = process.cwd()

  if (args.length > 0 && !args[0].startsWith('-')) {
    projectPath = path.resolve(args[0])
  }

  // Validate path exists
  if (!fs.existsSync(projectPath)) {
    console.error(`Error: Path does not exist: ${projectPath}`)
    process.exit(1)
  }

  // Check for docs/context directory
  const contextPath = path.join(projectPath, 'docs', 'context')
  const hasContext = fs.existsSync(contextPath)

  if (!hasContext) {
    console.log(`Note: No docs/context/ found in ${projectPath}`)
    console.log('You can create one or select a different project in the UI.')
  }

  // Set environment variable for the main process to read
  process.env.FLOW_UI_PROJECT_PATH = projectPath

  // Start Electron
  const electronPath = require('electron')
  const { spawn } = require('child_process')

  // __dirname is dist/main/, so go up two levels to get project root
  const appPath = path.join(__dirname, '..', '..')

  const child = spawn(electronPath as unknown as string, [appPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '',
      FLOW_UI_PROJECT_PATH: projectPath,
    },
  })

  child.on('close', (code: number) => {
    process.exit(code)
  })
}

main()
