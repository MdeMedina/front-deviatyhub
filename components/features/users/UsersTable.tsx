'use client'

import React, { useState } from 'react'
import { IUser } from '@/lib/types'
import { Trash2, Pencil, Search, UserCheck, UserMinus, Shield, User } from 'lucide-react'

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
    <div data-card>
      {/* Table Search & Header */}
      <div data-hd>
        <div style={{ position: 'relative', width: '280px', maxWidth: '60%' }}>
          <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dim)' }} />
          <input
            data-inp
            type="text"
            placeholder="Buscar por correo o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ height: '32px', paddingLeft: '31px' }}
          />
        </div>
        <span data-lbl>
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </span>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '8px', textAlign: 'center' }}>
          <User style={{ color: 'var(--dim)' }} size={24} />
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)', margin: 0 }}>No se encontraron usuarios</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table data-tbl>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                {!readOnly && (canEdit || canDelete) && <th style={{ textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  data-testid={`user-row-${u.id}`}
                >
                  {/* Email & Initials Avatar */}
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--ink)', color: 'var(--bg)', display: 'grid', placeItems: 'center', fontSize: '10.5px', fontWeight: 600, flexShrink: 0 }}>
                        {getInitials(u.email)}
                      </span>
                      <span style={{ color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </span>
                    </span>
                  </td>

                  {/* Role Name */}
                  <td>
                    <span data-badge>
                      <Shield size={11} strokeWidth={2} />
                      {u.role?.name || 'Usuario'}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <span data-badge>
                      <span data-dot style={{ background: u.active ? 'var(--pos)' : 'var(--dim)' }} />
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Actions */}
                  {!readOnly && (canEdit || canDelete) && (
                    <td>
                      <span style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {canEdit && (
                          <button
                            data-btn
                            data-testid={`toggle-status-btn-${u.id}`}
                            onClick={() => onToggleActive(u)}
                            disabled={isMutating}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {u.active ? <UserMinus size={14} strokeWidth={1.75} /> : <UserCheck size={14} strokeWidth={1.75} />}
                          </button>
                        )}

                        {canEdit && (
                          <button
                            data-btn
                            data-testid={`edit-user-btn-${u.id}`}
                            onClick={() => onEdit(u)}
                            disabled={isMutating}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title="Editar usuario"
                          >
                            <Pencil size={14} strokeWidth={1.75} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            data-btn
                            data-testid={`delete-user-btn-${u.id}`}
                            onClick={() => onDelete(u.id)}
                            disabled={isMutating}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        )}
                      </span>
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
