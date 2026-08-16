import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { AgentActionToggle } from '@/components/clinic/AgentActionToggle'
import { useAgentConfig, useUpdateAgentConfig } from '@/lib/api/hooks/use-agent'
import { useIntegrations } from '@/lib/api/hooks/use-integrations'
import { useUIStore } from '@/lib/stores/ui.store'
import { Channel, IntegrationType, IAgentConfig } from '@/lib/types'


// Mock hooks
jest.mock('@/lib/api/hooks/use-agent')
jest.mock('@/lib/api/hooks/use-integrations')

describe('AgentActionToggle Organism — Configuration Panel UI', () => {
  const mockMutate = jest.fn()
  let addToastSpy: jest.SpyInstance

  const mockAgentConfig: IAgentConfig = {
    id: 'agent-config-1',
    clinic_id: 'clinic-1',
    actions: {
      schedule: {
        active: true,
        channels: [Channel.WHATSAPP],
        integrations: [IntegrationType.WHATSAPP, IntegrationType.GOOGLE_CALENDAR]
      },
      reschedule: {
        active: true,
        channels: [Channel.WHATSAPP],
        integrations: [IntegrationType.WHATSAPP]
      },
      cancel: {
        active: false,
        channels: [Channel.WHATSAPP],
        integrations: [IntegrationType.WHATSAPP]
      }
    },
    updated_at: '2026-05-24T14:16:51Z'
  }

  const mockIntegrations = [
    { type: IntegrationType.WHATSAPP, connected: true, last_tested_at: '', last_test_ok: true },
    { type: IntegrationType.INSTAGRAM, connected: true, last_tested_at: '', last_test_ok: true },
    { type: IntegrationType.GOOGLE_CALENDAR, connected: true, last_tested_at: '', last_test_ok: true },
    { type: IntegrationType.DENTALINK, connected: false, last_tested_at: '', last_test_ok: false },
    { type: IntegrationType.DENTIDESK, connected: false, last_tested_at: '', last_test_ok: false },
    { type: IntegrationType.GMAIL, connected: false, last_tested_at: '', last_test_ok: false }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAgentConfig as jest.Mock).mockReturnValue({
      data: mockAgentConfig,
      isLoading: false,
      isError: false,
    })
    ;(useUpdateAgentConfig as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
    ;(useIntegrations as jest.Mock).mockReturnValue({
      data: mockIntegrations,
      isLoading: false,
    })
    addToastSpy = jest.spyOn(useUIStore.getState(), 'addToast').mockImplementation(() => {})
  })

  afterEach(() => {
    addToastSpy.mockRestore()
  })

  // ==========================================
  // ✅ TEST 1: Toggle de Acción e Invocación de Mutación (PATCH)
  // ==========================================
  it('toggles an action active state and triggers update mutation', async () => {
    render(<AgentActionToggle />)

    // Trigger toggle schedule action
    const toggleButton = screen.getByRole('button', { name: /Toggle Agendar Citas/i })
    fireEvent.click(toggleButton)

    expect(mockMutate).toHaveBeenCalledWith(
      {
        actions: {
          ...mockAgentConfig.actions,
          schedule: {
            ...mockAgentConfig.actions.schedule,
            active: false
          }
        }
      },
      expect.any(Object)
    )
  })

  // ==========================================
  // ✅ TEST 2: Controles Deshabilitados cuando la Acción está Inactiva
  // ==========================================
  it('disables channels and integrations selectors when the action is inactive', () => {
    render(<AgentActionToggle />)

    // "Cancelar Citas" in config is active: false
    const cancelPanel = screen.getByTestId('action-panel-cancel')
    const withinCancel = within(cancelPanel)
    
    // Selectors under cancelPanel should be disabled
    const whatsappButton = withinCancel.getByTestId('channel-WHATSAPP')
    const googleCalendarButton = withinCancel.getByTestId('integration-GOOGLE_CALENDAR')

    expect(whatsappButton).toBeDisabled()
    expect(googleCalendarButton).toBeDisabled()
  })

  // ==========================================
  // ✅ TEST 3: Activación de Canales en la Configuración
  // ==========================================
  it('adds or removes channels when clicked on active actions', () => {
    render(<AgentActionToggle />)

    // "Agendar Citas" is active: true. Let's add INSTAGRAM channel (it only has WHATSAPP)
    const schedulePanel = screen.getByTestId('action-panel-schedule')
    const withinSchedule = within(schedulePanel)
    const instagramButton = withinSchedule.getByTestId('channel-INSTAGRAM')
    fireEvent.click(instagramButton)

    expect(mockMutate).toHaveBeenCalledWith(
      {
        actions: {
          ...mockAgentConfig.actions,
          schedule: {
            ...mockAgentConfig.actions.schedule,
            channels: [Channel.WHATSAPP, Channel.INSTAGRAM]
          }
        }
      },
      expect.any(Object)
    )
  })

  // ==========================================
  // ❌ TEST 4: Toggles Bloqueados en Modo Solo Lectura (readOnly)
  // ==========================================
  it('forces all controls to be disabled in readOnly mode', () => {
    render(<AgentActionToggle readOnly={true} />)

    const schedulePanel = screen.getByTestId('action-panel-schedule')
    const withinSchedule = within(schedulePanel)

    const toggleButton = screen.getByRole('button', { name: /Toggle Agendar Citas/i })
    const whatsappButton = withinSchedule.getByTestId('channel-WHATSAPP')
    const googleCalendarButton = withinSchedule.getByTestId('integration-GOOGLE_CALENDAR')

    // Click on toggle should not trigger mutation
    fireEvent.click(toggleButton)
    expect(mockMutate).not.toHaveBeenCalled()

    // Controls should have disabled attribute or logic preventing action
    expect(toggleButton).toBeDisabled()
    expect(whatsappButton).toBeDisabled()
    expect(googleCalendarButton).toBeDisabled()
  })

  // ==========================================
  // ❌ TEST 5: Advertencia y Bloqueo al Habilitar Integración no Conectada
  // ==========================================
  it('prevents enabling an unconnected integration and shows warning toast', () => {
    render(<AgentActionToggle />)

    const schedulePanel = screen.getByTestId('action-panel-schedule')
    const withinSchedule = within(schedulePanel)

    // DENTALINK has connected: false in mockIntegrations. Attempt to click it under "Agendar Citas".
    const dentalinkButton = withinSchedule.getByTestId('integration-DENTALINK')
    fireEvent.click(dentalinkButton)

    // It should not trigger backend mutation
    expect(mockMutate).not.toHaveBeenCalled()

    // It should show a warning toast
    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Integración requerida',
      message: 'No se puede habilitar porque la integración con DENTALINK no está conectada o activa.',
      type: 'warning',
    })
  })
})

