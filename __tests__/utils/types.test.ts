import { 
  AppointmentStatus, 
  AppointmentSource, 
  Channel, 
  MessageRole, 
  ConversationStatus, 
  ConversationStep 
} from '@/lib/types'
import type { 
  IUser, 
  IAppointment, 
  IConversationDetail 
} from '@/lib/types'

describe('Data Integrity — TypeScript Schema Definitions', () => {
  it('successfully validates the IUser schema with complete role and permission data', () => {
    const user: IUser = {
      id: '1',
      email: 'test@example.com',
      clinic_id: 'clinic-1',
      active: true,
      role: {
        id: 'role-1',
        name: 'Admin',
        is_superadmin: true,
        permissions: {
          knowledge_base: { view: true, edit: true },
          agent_actions: { view: true, edit: true },
          simulator: { view: true },
          metrics: { view: true },
          integrations: { view: true },
          security: { view: true },
          users: { view: true, edit: true, create: true, delete: true },
          clinic_config: { view: true, edit: true },
          conversations: { view: true, takeover: true },
          agenda: { view: true, edit: true }
        }
      }
    }
    expect(user.email).toBe('test@example.com')
    expect(user.role.is_superadmin).toBe(true)
  })

  it('successfully validates the IAppointment schema with all required relational metadata', () => {
    const appointment: IAppointment = {
      id: 'app-1',
      contactName: 'John Doe',
      contactId: 'contact-1',
      treatment: { id: 't-1', name: 'Limpieza' },
      doctor: { id: 'd-1', name: 'Dr. Smith' },
      scheduledAt: new Date().toISOString(),
      durationMin: 30,
      status: AppointmentStatus.PENDING,
      source: AppointmentSource.AGENT,
      conversationId: 'conv-1',
      notes: 'Test note'
    }
    expect(appointment.status).toBe(AppointmentStatus.PENDING)
  })

  it('successfully validates the IConversationDetail schema including nested messages and contacts', () => {
    const conversation: IConversationDetail = {
      id: 'conv-1',
      channel: Channel.INSTAGRAM,
      status: ConversationStatus.OPEN,
      currentStep: ConversationStep.INICIO,
      startedAt: new Date().toISOString(),
      contact: {
        id: 'c-1',
        name: 'Jane Doe',
        phone: '123456789',
        email: 'jane@example.com',
        instagram_user: 'janedoe',
        channel: Channel.INSTAGRAM,
        last_interaction_at: new Date().toISOString()
      },
      appointments: [],
      assignedUserId: null,
      messages: [
        { id: 'm-1', role: MessageRole.USER, content: 'Hello', sentAt: new Date().toISOString() }
      ]
    }
    expect(conversation.messages).toHaveLength(1)
    expect(conversation.status).toBe(ConversationStatus.OPEN)
  })
})
