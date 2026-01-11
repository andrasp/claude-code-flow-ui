import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  Brain,
  History,
  FolderOpen,
  Settings,
  GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/stores/projectStore'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/flows', label: 'Flows', icon: GitBranch },
  { path: '/roadmap', label: 'Roadmap', icon: Map },
  { path: '/memory', label: 'Memory', icon: Brain },
  { path: '/history', label: 'History', icon: History },
]

export function Sidebar(): JSX.Element {
  const location = useLocation()
  const project = useProjectStore((s) => s.project)
  const selectProject = useProjectStore((s) => s.selectProject)

  return (
    <aside className="w-56 flex-shrink-0 bg-flow-surface border-r border-flow-border flex flex-col">
      {/* Project selector */}
      <button
        onClick={selectProject}
        className="mx-3 mt-3 p-3 rounded-lg bg-flow-bg border border-flow-border hover:border-flow-accent/50 transition-colors text-left no-drag"
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-flow-muted" />
          {project ? (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{project.name}</p>
              <p className="text-xs text-flow-muted truncate">
                {project.hasFlowContext ? 'Flow project' : 'No flow context'}
              </p>
            </div>
          ) : (
            <span className="text-sm text-flow-muted">Open Project...</span>
          )}
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors no-drag',
                isActive
                  ? 'bg-flow-accent/10 text-flow-accent'
                  : 'text-flow-muted hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-flow-border">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-flow-muted hover:text-white hover:bg-white/5 w-full transition-colors no-drag">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </aside>
  )
}
