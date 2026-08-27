'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Plus, ArrowRight, X } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  useUsers,
  useRoles,
  useInviteUser,
  useUpdateUser,
  useDeleteUser,
} from '@/lib/api/hooks/use-users-roles'
import { UsersTable } from '@/components/features/users/UsersTable'
import { Spinner } from '@/components/ui/Spinner'
import { IUser } from '@/lib/types'

export default function UsersPage() {
  const { hasPermission } = useAuthStore()

  // Permissions check
  const canView = hasPermission('users.view')
  const canEdit = hasPermission('users.edit')
  const canCreate = hasPermission('users.create') || hasPermission('users.edit')
  const canDelete = hasPermission('users.delete')

  // API hooks
  const { data: users = [], isLoading: loadingUsers, isError: errorUsers } = useUsers()
  const { data: roles = [] } = useRoles()
  const inviteMutation = useInviteUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  // State for modals
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<IUser | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState('')
  const [editRoleId, setEditRoleId] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [deletingUser, setDeletingUser] = useState<IUser | null>(null)

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso Denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          No tienes los permisos necesarios para gestionar los usuarios del sistema. Por favor contacta al administrador.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--ink)] hover:opacity-85 text-[var(--bg)] font-medium rounded-[7px] text-[13px] transition-opacity gap-2"
        >
          Ir al Dashboard
          <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !inviteRoleId) return

    await inviteMutation.mutateAsync({
      email: inviteEmail,
      roleId: inviteRoleId,
    })

    setIsInviteOpen(false)
    setInviteEmail('')
    setInviteRoleId('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !editRoleId) return

    await updateMutation.mutateAsync({
      id: editingUser.id,
      roleId: editRoleId,
      ...(editPassword ? { password: editPassword } : {}),
    })

    setEditingUser(null)
    setEditRoleId('')
    setEditPassword('')
  }

  const handleDeleteConfirm = () => {
    if (!deletingUser) return
    deleteMutation.mutate(deletingUser.id, {
      onSuccess: () => setDeletingUser(null),
    })
  }

  const handleToggleActive = (user: IUser) => {
    updateMutation.mutate({
      id: user.id,
      active: !user.active,
    })
  }

  const isMutating =
    inviteMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
            Usuarios & Accesos
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Gestiona el personal de la clínica y sus niveles de acceso.
          </p>
        </div>

        {canCreate && (
          <button
            data-btn="primary"
            onClick={() => setIsInviteOpen(true)}
          >
            <Plus size={14} strokeWidth={1.9} />
            Invitar usuario
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loadingUsers ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] bg-[var(--card)] border border-[var(--line)] rounded-[10px]">
          <Spinner size="md" />
          <span className="microlabel text-[10px] mt-2">Cargando usuarios</span>
        </div>
      ) : errorUsers ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] bg-[var(--card)] border border-[var(--line)] rounded-[10px] p-6 text-center">
          <AlertCircle size={24} className="text-[var(--neg)] mb-2" />
          <p className="text-[13.5px] font-semibold text-[var(--ink)]">Error al cargar la lista de usuarios</p>
        </div>
      ) : (
        <UsersTable
          users={users}
          onEdit={(user) => {
            setEditingUser(user)
            setEditRoleId(user.role?.id || (user as any).role_id || '')
            setEditPassword('')
          }}
          onDelete={(id) => {
            const target = users.find((u) => u.id === id)
            if (target) setDeletingUser(target)
          }}
          onToggleActive={handleToggleActive}
          readOnly={!canEdit && !canDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          isMutating={isMutating}
        />
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div onClick={() => setIsInviteOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(33,33,33,.45)', backdropFilter: 'blur(2px)' }} />
          <div role="dialog" aria-modal="true" data-card style={{ position: 'relative', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,.18)' }}>
            <div data-hd>
              <h2>Invitar nuevo usuario</h2>
              <button data-btn onClick={() => setIsInviteOpen(false)} style={{ width: '28px', height: '28px', padding: 0, borderColor: 'transparent', background: 'none' }}>
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit}>
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div data-field>
                  <label htmlFor="inv-mail">Correo electrónico *</label>
                  <input
                    id="inv-mail"
                    data-inp
                    type="email"
                    placeholder="ejemplo@clinica.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div data-field>
                  <label htmlFor="inv-role">Rol de seguridad *</label>
                  <select
                    id="inv-role"
                    data-inp
                    aria-label="Rol de Seguridad"
                    value={inviteRoleId}
                    onChange={(e) => setInviteRoleId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecciona un rol...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.55, color: 'var(--muted)' }}>
                  El usuario recibirá un enlace para establecer su contraseña y activar la cuenta.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', padding: '13px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
                <button data-btn type="button" onClick={() => setIsInviteOpen(false)}>Cancelar</button>
                <button data-btn="primary" type="submit" disabled={inviteMutation.isPending}>Enviar invitación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div onClick={() => setEditingUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(33,33,33,.45)', backdropFilter: 'blur(2px)' }} />
          <div role="dialog" aria-modal="true" data-card style={{ position: 'relative', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,.18)' }}>
            <div data-hd>
              <h2>Editar Usuario</h2>
              <button data-btn onClick={() => setEditingUser(null)} style={{ width: '28px', height: '28px', padding: 0, borderColor: 'transparent', background: 'none' }}>
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div data-field>
                  <label>Usuario</label>
                  <p style={{ margin: 0, fontFamily: 'var(--font-geist-mono)', fontSize: '13px', color: 'var(--ink)', background: 'var(--surface)', padding: '8px 12px', borderRadius: '7px', border: '1px solid var(--line)' }}>
                    {editingUser?.email}
                  </p>
                </div>
                <div data-field>
                  <label htmlFor="edit-role">Rol de seguridad *</label>
                  <select
                    id="edit-role"
                    data-inp
                    aria-label="Rol de Seguridad"
                    value={editRoleId}
                    onChange={(e) => setEditRoleId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecciona un rol...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div data-field>
                  <label htmlFor="edit-pass">Nueva contraseña (Opcional)</label>
                  <input
                    id="edit-pass"
                    data-inp
                    type="password"
                    placeholder="Dejar en blanco para mantener actual"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', padding: '13px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
                <button data-btn type="button" onClick={() => setEditingUser(null)}>Cancelar</button>
                <button data-btn="primary" type="submit" disabled={updateMutation.isPending}>Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div onClick={() => setDeletingUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(33,33,33,.45)', backdropFilter: 'blur(2px)' }} />
          <div role="dialog" aria-modal="true" data-card style={{ position: 'relative', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,.18)' }}>
            <div data-hd>
              <h2>Eliminar usuario</h2>
              <button data-btn onClick={() => setDeletingUser(null)} style={{ width: '28px', height: '28px', padding: 0, borderColor: 'transparent', background: 'none' }}>
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <div style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '7px' }}>
                <AlertCircle size={20} style={{ color: 'var(--neg)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)' }}>¿Estás seguro de eliminar este usuario?</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', lineHeight: 1.55, color: 'var(--muted)' }}>
                    Se revocará el acceso de <strong style={{ color: 'var(--ink)' }}>{deletingUser.email}</strong> al panel de forma permanente. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', padding: '13px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
              <button data-btn type="button" onClick={() => setDeletingUser(null)}>Cancelar</button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="h-8 px-3.5 inline-flex items-center gap-2 rounded-[7px] text-[13px] font-medium border border-[var(--line)] text-[var(--neg)] hover:border-[var(--neg)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
