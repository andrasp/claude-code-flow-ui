import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'

export function useMenuEvents(): void {
  const navigate = useNavigate()
  const selectProject = useProjectStore((s) => s.selectProject)

  useEffect(() => {
    const unsubscribeNav = window.flowAPI.onMenuNavigate((path) => {
      navigate(path)
    })

    const unsubscribeOpen = window.flowAPI.onMenuOpenProject(() => {
      selectProject()
    })

    return () => {
      unsubscribeNav()
      unsubscribeOpen()
    }
  }, [navigate, selectProject])
}
