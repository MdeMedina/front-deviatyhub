'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Bell, 
  LogOut, 
  Search,
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Book,
  Wand2,
  PlayCircle,
  BarChart3,
  Puzzle,
  Settings,
  Users,
  Lock
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'

const PAGE_TITLES: Record<string, { title: string; icon: React.ElementType }> = {
  '/dashboard': { title: 'Dashboard', icon: LayoutDashboard },
  '/conversations': { title: 'Conversaciones', icon: MessageSquare },
  '/agenda': { title: 'Agenda', icon: Calendar },
  '/knowledge-base': { title: 'Base de conocimiento', icon: Book },
  '/agent-actions': { title: 'Acciones del agente', icon: Wand2 },
  '/simulator': { title: 'Simulador de IA', icon: PlayCircle },
  '/metrics': { title: 'Métricas de rendimiento', icon: BarChart3 },
  '/integrations': { title: 'Integraciones', icon: Puzzle },
  '/settings': { title: 'Configuración', icon: Settings },
  '/users': { title: 'Usuarios del sistema', icon: Users },
  '/security': { title: 'Seguridad y permisos', icon: Lock },
}

export const Header: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, clearSession } = useAuthStore()
  const { isSidebarOpen } = useUIStore()

  const handleLogout = async () => {
    clearSession()
    router.push('/login')
  }

  // Derive current page info
  const matchedKey = Object.keys(PAGE_TITLES).find(k => pathname === k || (k !== '/dashboard' && pathname.startsWith(k)))
  const pageInfo = matchedKey ? PAGE_TITLES[matchedKey] : { title: 'Dentral', icon: LayoutDashboard }
  const PageIcon = pageInfo.icon

  // User initials
  const emailPrefix = user?.email?.split('@')[0] || 'Usuario'
  const initials = emailPrefix.slice(0, 2).toUpperCase()

  return (
    <header 
      className="fixed top-0 right-0 h-14 bg-[var(--card)] border-b border-[var(--line)] z-30 transition-all duration-200"
      style={{ left: isSidebarOpen ? '240px' : '72px' }}
    >
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left: Current Screen Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[var(--ink)] font-semibold text-[14px]">
            <PageIcon size={16} className="text-[var(--muted)]" />
            <span>{pageInfo.title}</span>
          </div>

          <div className="h-4 w-px bg-[var(--line)] mx-1 hidden sm:block" />

          {/* Search Input 32px */}
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--dim)]" size={14} />
            <input 
              type="text" 
              placeholder="Buscar..."
              className="w-full h-8 pl-8 pr-3 bg-[var(--surface)] border border-transparent rounded-[6px] focus:bg-[var(--card)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-tint)] transition-[border-color,background-color] text-[12.5px] text-[var(--ink)] placeholder:text-[var(--dim)] outline-none"
            />
          </div>
        </div>

        {/* Right: Clinic, Notifications, Profile, Logout */}
        <div className="flex items-center gap-3.5">
          {/* Clinic Name */}
          <div className="hidden lg:block text-right pr-2">
            <p className="microlabel text-[9px] text-[var(--dim)]">Clínica</p>
            <p className="text-[12.5px] font-medium text-[var(--ink)] truncate max-w-[150px]">Deviaty Dental</p>
          </div>

          {/* Notification Bell */}
          <button 
            className="w-7 h-7 rounded-[6px] border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--dim)] transition-colors flex items-center justify-center relative cursor-pointer"
            aria-label="Notificaciones"
          >
            <Bell size={14} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--blue)] rounded-full" />
          </button>

          <div className="h-4 w-px bg-[var(--line)]" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center text-[11px] font-medium tracking-wider shrink-0 select-none">
              {initials}
            </div>

            <div className="text-left hidden md:block">
              <p className="text-[13px] font-medium text-[var(--ink)] leading-tight">{emailPrefix}</p>
              <p className="microlabel text-[9.5px] text-[var(--muted)] leading-tight">{user?.role?.name || 'Agente'}</p>
            </div>

            <button 
              onClick={handleLogout}
              className="w-7 h-7 ml-1 rounded-[6px] border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--neg)] hover:border-[var(--neg)] transition-colors flex items-center justify-center cursor-pointer"
              title="Cerrar Sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
