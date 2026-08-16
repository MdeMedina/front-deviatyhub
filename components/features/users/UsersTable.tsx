'use client'

import React, { useState } from 'react'
import { IUser, IRole } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { User, Trash2, Edit, Search, UserCheck, UserMinus, Shield } from 'lucide-react'

export interface UsersTableProps {
  users: IUser[]
  onEdit: (user: IUser) => void
  onDelete: (id: string) => void
  onToggleActive: (user: IUser) => void
  readOnly?: boolean
  canEdit?: boolean
  canDelete?: boolean
  isMutating?: boolean
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onEdit,
  onDelete,
  onToggleActive,
  readOnly = false,
  canEdit = true,
  canDelete = true,
  isMutating = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter users by email or role
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase()
    const emailMatch = u.email?.toLowerCase().includes(term)
    const roleMatch = u.role?.name?.toLowerCase().includes(term)
    return emailMatch || roleMatch
  })

  const getInitials = (email: string) => {
    if (!email) return 'U'
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden space-y-4">
      {/* Table search & header */}
      <div className="p-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por correo o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-transparent focus:border-slate-200 rounded-2xl text-sm outline-none transition-all duration-200"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <User className="text-slate-300" size={32} />
          <p className="text-sm font-semibold text-slate-500">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado</th>
                {!readOnly && (canEdit || canDelete) && <th className="px-6 py-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  data-testid={`user-row-${u.id}`}
                  className="hover:bg-slate-50/40 transition-colors group"
                >
                  {/* Email & Initials Avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                        {getInitials(u.email)}
                      </div>
                      <div className="truncate max-w-[200px]">
                        <span className="font-semibold text-slate-700 block text-[13px]">{u.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role Name */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-700 bg-indigo-50/50 px-2.5 py-1 rounded-xl">
                      <Shield size={11} />
                      {u.role?.name || 'Sin Rol'}
                    </span>
                  </td>

                  {/* Active/Inactive Badge */}
                  <td className="px-6 py-4">
                    <Badge
                      label={u.active ? 'Activo' : 'Inactivo'}
                      variant={u.active ? 'success' : 'neutral'}
                      dot
                    />
                  </td>

                  {/* Actions */}
                  {!readOnly && (canEdit || canDelete) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            {/* Toggle active state */}
                            <button
                              onClick={() => onToggleActive(u)}
                              disabled={isMutating}
                              data-testid={`toggle-status-btn-${u.id}`}
                              title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                              className={`p-2 rounded-xl transition-all duration-200 ${
                                u.active
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.active ? <UserMinus size={15} /> : <UserCheck size={15} />}
                            </button>

                            {/* Edit role / details */}
                            <button
                              onClick={() => onEdit(u)}
                              disabled={isMutating}
                              data-testid={`edit-user-btn-${u.id}`}
                              title="Editar rol"
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                            >
                              <Edit size={15} />
                            </button>
                          </>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => onDelete(u.id)}
                            disabled={isMutating}
                            data-testid={`delete-user-btn-${u.id}`}
                            title="Eliminar usuario"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
