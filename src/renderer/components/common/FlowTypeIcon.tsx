import {
  Hammer,
  Bug,
  RefreshCw,
  Zap,
  Plug,
  Sprout,
  FileText,
  Folder,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  feature: Hammer,
  bugfix: Bug,
  refactor: RefreshCw,
  optimization: Zap,
  integration: Plug,
  greenfield: Sprout,
  custom: FileText,
}

const colorMap: Record<string, string> = {
  feature: 'text-blue-400',
  bugfix: 'text-red-400',
  refactor: 'text-purple-400',
  optimization: 'text-yellow-400',
  integration: 'text-cyan-400',
  greenfield: 'text-green-400',
  custom: 'text-gray-400',
}

interface FlowTypeIconProps {
  type: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FlowTypeIcon({
  type,
  className,
  size = 'md',
}: FlowTypeIconProps): JSX.Element {
  const Icon = iconMap[type] || Folder
  const color = colorMap[type] || 'text-gray-400'

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return <Icon className={cn(sizeClasses[size], color, className)} />
}
