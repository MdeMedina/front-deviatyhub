'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, Users, ArrowRight, Plus, Mail, Shield, Save, UserMinus, UserCheck, Key } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { 
  useUsers, 
  useInviteUser, 
  useUpdateUser, 
  useDeleteUser, 
  useRoles 
} from '@/lib/api/hooks/use-users-roles'
import { UsersTable } from '@/components/features/users/UsersTable'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { IUser } from '@/lib/types'

export default function UsersPage() {
  const { hasPermission } = useAuthStore()
  const addToast = useUIStore((state) => state.addToast)

  // API Query Hooks
  const { data: users, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useUsers()
  const { data: roles, isLoading: rolesLoading } = useRoles()

  // API Mutation Hooks
  const inviteMutation = useInviteUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  // Modal control states
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)

  // Form states
  const [emailInput, setEmailInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [errors, setErrors] = useState<{ email?: string; role?: string; password?: string }>({})

  // Permission checks
  const canView = hasPermission('users.view')
  const canCreate = hasPermission('users.create')
  const canEdit = hasPermission('users.edit')
  const canDelete = hasPermission('users.delete')

  if (!canView) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[calc(100vh-10rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-100/50"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 text-sm mb-6">
            No tienes los permisos necesarios para ver o modificar los usuarios y roles de la clínica. Por favor contacta al administrador.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors gap-2"
          >
            Ir al Dashboard
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    )
  }

  // Handle Invite Submit
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: typeof errors = {}
    if (!emailInput.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailInput)) {
        newErrors.email = 'El formato del correo electrónico no es válido'
      }
    }
    if (!roleInput) {
      newErrors.role = 'Debes seleccionar un rol para el usuario'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      await inviteMutation.mutateAsync({
        email: emailInput,
        roleId: roleInput,
      })
      addToast({
        title: 'Usuario invitado',
        message: `Se ha enviado la invitación a ${emailInput}`,
        type: 'success',
      })
      // Reset & close
      setIsInviteOpen(false)
      setEmailInput('')
      setRoleInput('')
    } catch (err: any) {
      addToast({
        title: 'Error al invitar',
        message: err?.message || 'No se pudo invitar al usuario',
        type: 'error',
      })
    }
  }

  // Handle Edit Submit (role change)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if (!roleInput) {
      setErrors({ role: 'Debes seleccionar un rol para el usuario' })
      return
    }

    if (passwordInput.trim() !== '' && passwordInput.length < 6) {
      setErrors({ password: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedUser.id,
        roleId: roleInput,
        ...(passwordInput.trim() !== '' ? { password: passwordInput } : {}),
      })
      addToast({
        title: 'Usuario actualizado',
        message: `Se ha actualizado la información de ${selectedUser.email}`,
        type: 'success',
      })
      setIsEditOpen(false)
      setSelectedUser(null)
      setRoleInput('')
      setPasswordInput('')
      setErrors({})
    } catch (err: any) {
      addToast({
        title: 'Error al actualizar',
        message: err?.message || 'No se pudo actualizar el usuario',
        type: 'error',
      })
    }
  }

  // Handle Toggle Active/Inactive state
  const handleToggleActive = async (user: IUser) => {
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        active: !user.active,
      })
      addToast({
        title: user.active ? 'Usuario desactivado' : 'Usuario activado',
        message: `El usuario ${user.email} ha sido ${user.active ? 'desactivado' : 'activado'} con éxito.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Error al actualizar estado',
        message: err?.message || 'No se pudo actualizar el estado del usuario',
        type: 'error',
      })
    }
  }

  // Handle Delete User
  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario permanentemente?')) return

    try {
      await deleteMutation.mutateAsync(id)
      addToast({
        title: 'Usuario eliminado',
        message: 'El usuario ha sido eliminado correctamente.',
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Error al eliminar',
        message: err?.message || 'No se pudo eliminar el usuario',
        type: 'error',
      })
    }
  }

  // Open Edit Dialog
  const openEditDialog = (user: IUser) => {
    setSelectedUser(user)
    setRoleInput(user.role?.id || '')
    setPasswordInput('')
    setIsEditOpen(true)
    setErrors({})
  }

  // Loading indicator for queries
  const isLoading = usersLoading || rolesLoading
  const isMutating = inviteMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Usuarios & Accesos</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Gestiona el personal de la clínica y sus niveles de acceso
            </p>
          </div>
        </div>

        {canCreate && (
          <div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => {
                setIsInviteOpen(true)
                setErrors({})
                setEmailInput('')
                setRoleInput(roles?.[0]?.id || '')
              }}
              disabled={isLoading}
              className="font-bold"
            >
              Invitar Usuario
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      ) : usersError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertCircle size={26} />
          </div>
          <p className="text-sm font-semibold text-slate-700">Error al cargar usuarios</p>
          <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <UsersTable
            users={users || []}
            onEdit={openEditDialog}
            onDelete={handleDeleteUser}
            onToggleActive={handleToggleActive}
            readOnly={!canEdit && !canDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            isMutating={isMutating}
          />
        </motion.div>
      )}

      {/* invite User Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invitar Nuevo Usuario"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-5">
          <Input
            label="Correo Electrónico"
            placeholder="Ej: doctor@deviaty.com"
            type="email"
            value={emailInput}
            onChange={setEmailInput}
            error={errors.email}
            leftIcon={<Mail size={16} />}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="invite-role-select"
              className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1"
            >
              <Shield size={16} className="text-slate-400" />
              Rol de Seguridad
              <span className="text-rose-500">*</span>
            </label>
            <select
              id="invite-role-select"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300 cursor-pointer text-sm"
            >
              <option value="">Selecciona un rol...</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-rose-600 mt-1 ml-1">{errors.role}</p>}
          </div>

          <div className="flex justify-end pt-4 gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={inviteMutation.isPending}
            >
              Enviar Invitación
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedUser(null)
        }}
        title="Editar Usuario"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Usuario
            </span>
            <p className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
              {selectedUser?.email}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-role-select"
              className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1"
            >
              <Shield size={16} className="text-slate-400" />
              Rol de Seguridad
              <span className="text-rose-500">*</span>
            </label>
            <select
              id="edit-role-select"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300 cursor-pointer text-sm"
            >
              <option value="">Selecciona un rol...</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-rose-600 mt-1 ml-1">{errors.role}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-password-input"
              className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1"
            >
              <Key size={16} className="text-slate-400" />
              Nueva Contraseña (Opcional)
            </label>
            <input
              id="edit-password-input"
              type="password"
              placeholder="Deja en blanco para no cambiarla"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300 text-sm"
            />
            {errors.password && <p className="text-xs text-rose-600 mt-1 ml-1">{errors.password}</p>}
          </div>

          <div className="flex justify-end pt-4 gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedUser(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Save size={16} />}
              loading={updateMutation.isPending}
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
