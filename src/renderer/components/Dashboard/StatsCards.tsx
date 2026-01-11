import { Activity, Map, Brain, CheckCircle } from 'lucide-react'

interface StatsCardsProps {
  activeFlows: number
  completedFlows: number
  roadmapItems: number
  memoryEntries: number
}

export function StatsCards({
  activeFlows,
  completedFlows,
  roadmapItems,
  memoryEntries,
}: StatsCardsProps): JSX.Element {
  const stats = [
    {
      label: 'Active Flows',
      value: activeFlows,
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Completed',
      value: completedFlows,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Roadmap Items',
      value: roadmapItems,
      icon: Map,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Memory Entries',
      value: memoryEntries,
      icon: Brain,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-flow-surface border border-flow-border rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-flow-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
