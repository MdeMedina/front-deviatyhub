'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  MessageSquare, 
  Calendar, 
  Book, 
  Wand2, 
  PlayCircle, 
  BarChart3, 
  Puzzle, 
  Settings, 
  Users, 
  Lock,
  LayoutDashboard,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { Logo } from '@/components/brand/Logo'

interface NavGroup {
  name: string
  items: {
    label: string
    href: string
    icon: React.ElementType
    permission: string | null
  }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Operación',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
      { label: 'Conversaciones', href: '/conversations', icon: MessageSquare, permission: 'conversations.view' },
      { label: 'Agenda', href: '/agenda', icon: Calendar, permission: 'agenda.view' },
    ]
  },
  {
    name: 'Inteligencia',
    items: [
      { label: 'Base conocimiento', href: '/knowledge-base', icon: Book, permission: 'knowledge_base.view' },
      { label: 'Acciones agente', href: '/agent-actions', icon: Wand2, permission: 'agent_actions.view' },
      { label: 'Simulador', href: '/simulator', icon: PlayCircle, permission: 'simulator.view' },
      { label: 'Métricas', href: '/metrics', icon: BarChart3, permission: 'metrics.view' },
    ]
  },
  {
    name: 'Administración',
    items: [
      { label: 'Integraciones', href: '/integrations', icon: Puzzle, permission: 'integrations.view' },
      { label: 'Configuración', href: '/settings', icon: Settings, permission: 'clinic_config.view' },
      { label: 'Usuarios', href: '/users', icon: Users, permission: 'users.view' },
      { label: 'Seguridad', href: '/security', icon: Lock, permission: 'security.view' },
    ]
  }
]

export const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const { hasPermission } = useAuthStore()
  const { isSidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[var(--nav)] border-r border-[var(--line)] flex flex-col z-40 transition-all duration-200 ${
        isSidebarOpen ? 'w-[240px]' : 'w-[72px]'
      }`}
    >
      {/* Header 56px */}
      <div className="h-14 flex items-center px-4 justify-between border-b border-[var(--line)] bg-[var(--card)]">
        <div className="flex items-center gap-2 overflow-hidden">
          {isSidebarOpen ? (
            <>
              <Logo variant="lockup" size={15} />
              <span className="microlabel px-1.5 py-0.5 rounded border border-[var(--line)] bg-[var(--surface)]">
                PRO
              </span>
            </>
          ) : (
            <span className="w-[30px] h-[30px] grid place-items-center rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] shrink-0">
              <Logo variant="mark" size={17} />
            </span>
          )}
        </div>

        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-[6px] hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          aria-label={isSidebarOpen ? "Contraer menú lateral" : "Expandir menú lateral"}
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3.5 px-2.5 space-y-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            item => !item.permission || hasPermission(item.permission as any)
          )

          if (visibleItems.length === 0) return null

          return (
            <div key={group.name} className="space-y-1">
              {isSidebarOpen && (
                <div className="px-2 py-1 microlabel text-[var(--dim)]">
                  {group.name}
                </div>
              )}

              {visibleItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-2 py-[7px] rounded-[6px] transition-[background-color,color] duration-150 relative text-[13.5px] group ${
                      isActive 
                        ? 'bg-[var(--blue-tint)] text-[var(--blue)] font-medium before:content-[""] before:absolute before:left-[-10px] before:top-[7px] before:bottom-[7px] before:w-[2px] before:bg-[var(--blue)] before:rounded-r-[2px]' 
                        : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] font-normal'
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 ${isActive ? 'text-[var(--blue)]' : 'text-[var(--muted)] group-hover:text-[var(--ink)]'}`} />
                    
                    {isSidebarOpen && (
                      <span className="truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer 56px */}
      <div className="p-3 border-t border-[var(--line)] bg-[var(--card)] flex items-center justify-between">
        {isSidebarOpen ? (
          <div className="overflow-hidden">
            <p className="microlabel">Plan Actual</p>
            <p className="text-[12.5px] font-medium text-[var(--ink)] truncate">Enterprise Pro</p>
          </div>
        ) : <div />}

        <button
          onClick={toggleTheme}
          className="w-7 h-7 flex items-center justify-center border border-[var(--line)] rounded-[6px] bg-[var(--head)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer shrink-0"
          title={theme === 'dark' ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </aside>
  )
}
