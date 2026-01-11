import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''

  // Handle YYYY-MM-DD format
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return dateStr
}

export function getFlowTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    feature: '🔨',
    bugfix: '🐛',
    refactor: '♻️',
    optimization: '⚡',
    integration: '🔌',
    greenfield: '🌱',
    custom: '📝',
  }
  return icons[type] || '📁'
}

export function getFlowTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    feature: 'Feature',
    bugfix: 'Bugfix',
    refactor: 'Refactor',
    optimization: 'Optimization',
    integration: 'Integration',
    greenfield: 'Greenfield',
    custom: 'Custom',
  }
  return labels[type] || type
}

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    understanding: 'Understanding',
    planning: 'Planning',
    implementation: 'Implementation',
    completion: 'Completion',
  }
  return labels[phase] || phase
}

export function getPhaseNumber(phase: string): number {
  const phases = ['understanding', 'planning', 'implementation', 'completion']
  return phases.indexOf(phase) + 1
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: 'bg-status-planned',
    'in-progress': 'bg-status-in-progress',
    blocked: 'bg-status-blocked',
    completed: 'bg-status-completed',
    cancelled: 'bg-status-cancelled',
    active: 'bg-status-in-progress',
    abandoned: 'bg-status-cancelled',
  }
  return colors[status] || 'bg-gray-500'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    P0: 'text-priority-p0',
    P1: 'text-priority-p1',
    P2: 'text-priority-p2',
    P3: 'text-priority-p3',
  }
  return colors[priority] || 'text-gray-400'
}

export function getMemoryCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    patterns: '📐',
    lessons: '📚',
    gotchas: '⚠️',
    architecture: '🏗️',
    conventions: '📏',
  }
  return icons[category] || '📝'
}

export function getMemoryCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    patterns: 'Patterns',
    lessons: 'Lessons',
    gotchas: 'Gotchas',
    architecture: 'Architecture',
    conventions: 'Conventions',
  }
  return labels[category] || category
}
