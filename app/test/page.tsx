'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  MessageSquare, 
  Bell, 
  Search, 
  User, 
  Inbox, 
  AlertCircle,
  Code,
  Layout,
  MousePointer2,
  Type,
  Square
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { useUIStore } from '@/lib/stores/ui.store'
import { EmptyState } from '@/components/ui/EmptyState'
import { ToastContainer } from '@/components/ui/ToastContainer'

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { addToast } = useUIStore()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Zap size={24} fill="currentColor" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gallery / Test Page</h1>
          </div>
          <p className="text-lg text-slate-500 max-w-2xl font-medium">
            Esta página sirve para visualizar y testear los componentes atómicos y moléculas 
            que forman el sistema de diseño de Deviaty Hub.
          </p>
        </header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Buttons Section */}
          <Section icon={<MousePointer2 size={18} />} title="Button" description="Botón principal con soporte para estados de carga, variantes y feedback táctil.">
            <div className="flex flex-wrap gap-4 items-center">
              <Button onClick={() => addToast({ title: 'Click!', message: 'Has pulsado el botón Primary', type: 'info' })}>
                Primary Button
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 items-center">
              <Button loading>Cargando...</Button>
              <Button disabled>Deshabilitado</Button>
            </div>
          </Section>

          {/* Inputs Section */}
          <Section icon={<Type size={18} />} title="Input" description="Campos de texto con soporte para iconos, etiquetas y estados de error.">
            <div className="space-y-6">
              <Input 
                label="Nombre de Usuario" 
                placeholder="Ej: Miguel Medina" 
                leftIcon={<User size={18} />}
              />
              <Input 
                label="Búsqueda" 
                placeholder="Buscar conversación..." 
                leftIcon={<Search size={18} />}
              />
              <Input 
                label="Campo con Error" 
                placeholder="Email inválido" 
                error="Este correo ya está registrado"
                leftIcon={<AlertCircle size={18} />}
              />
            </div>
          </Section>

          {/* Badges Section */}
          <Section icon={<Square size={18} />} title="Badge" description="Pequeños indicadores de estado con diseño 'soft background'.">
            <div className="flex flex-wrap gap-4">
              <Badge variant="success">Online</Badge>
              <Badge variant="warning" dot>Pausado</Badge>
              <Badge variant="error" size="sm">Error</Badge>
              <Badge variant="info">WhatsApp</Badge>
              <Badge variant="neutral">Cerrado</Badge>
            </div>
          </Section>

          {/* Feedback & Spinner Section */}
          <Section icon={<Bell size={18} />} title="Feedback & Loading" description="Componentes para informar al usuario sobre procesos o eventos globales.">
            <div className="flex flex-wrap gap-8 items-center">
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pequeño</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-600">
                <Spinner size="md" />
                <span className="text-xs font-bold uppercase tracking-wider">Mediano</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => addToast({ 
                  title: '¡Nueva Alerta!', 
                  message: 'Este es un sistema de notificaciones global.', 
                  type: 'success' 
                })}
              >
                Lanzar Toast
              </Button>
            </div>
          </Section>

          {/* Modal Section */}
          <Section icon={<Layout size={18} />} title="Modal" description="Diálogos flotantes usando Portals para evitar conflictos de z-index y animaciones suaves.">
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Abrir Modal de Ejemplo
            </Button>
            
            <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              title="Información del Sistema"
              footer={
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button onClick={() => {
                    setIsModalOpen(false)
                    addToast({ title: 'Completado', message: 'Configuración guardada', type: 'success' })
                  }}>
                    Aceptar
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Este es el componente Modal. Utiliza un <strong>Portal</strong> de React para renderizarse fuera de la jerarquía DOM actual, garantizando que siempre se vea por encima de todo.
                </p>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-sm text-indigo-700 font-medium">
                    Tip: Las animaciones se gestionan con Framer Motion para asegurar entradas y salidas fluidas.
                  </p>
                </div>
              </div>
            </Modal>
          </Section>

          {/* Empty State Section */}
          <Section icon={<Inbox size={18} />} title="Empty State" description="Componente para guiar al usuario cuando no hay datos disponibles.">
            <div className="border border-dashed border-slate-200 rounded-3xl bg-white/50">
              <EmptyState 
                title="No hay conversaciones"
                description="Aquí aparecerán los chats que el bot de IA no pueda manejar por sí solo."
                icon={<MessageSquare size={48} className="text-slate-300" />}
                action={{
                  label: 'Nueva Simulación',
                  onClick: () => addToast({ title: 'Simulador', message: 'Iniciando simulador...', type: 'info' })
                }}
              />
            </div>
          </Section>
        </motion.div>

        {/* Technical Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-slate-400">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Code size={16} />
            <span className="text-xs font-mono">Build Phase 1.7 / Atomic Design System</span>
          </div>
          <p className="text-xs font-medium italic">Deviaty Hub — Premium Dental AI Interface</p>
        </footer>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  )
}

function Section({ children, title, icon, description }: { children: React.ReactNode, title: string, icon: React.ReactNode, description: string }) {
  return (
    <motion.section 
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
      }}
      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-center gap-2 mb-2 text-indigo-600">
        {icon}
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
      <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
        {description}
      </p>
      <div className="space-y-4">
        {children}
      </div>
    </motion.section>
  )
}
