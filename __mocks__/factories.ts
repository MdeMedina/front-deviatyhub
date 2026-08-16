import { 
  IUser, 
  IRole, 
  IPermissions, 
  IAppointment, 
  AppointmentStatus, 
  AppointmentSource, 
  Channel,
  ConversationStatus,
  ConversationStep,
  IConversationListItem,
  MessageRole,
  IMessage,
  IContactSummary,
  IMessageSummary
} from '@/lib/types'

const mockUuid = () => Math.random().toString(36).substring(2, 15)
const mockEmail = () => `test-${mockUuid()}@example.com`
const mockName = () => `User ${mockUuid().substring(0, 5)}`

export const makePermissions = (overrides?: Partial<IPermissions>): IPermissions => ({
  knowledge_base: { view: true, edit: true },
  agent_actions: { view: true, edit: true },
  simulator: { view: true },
  metrics: { view: true },
  integrations: { view: true },
  security: { view: true },
  users: { view: true, edit: true, create: true, delete: true },
  clinic_config: { view: true, edit: true },
  conversations: { view: true, takeover: true },
  agenda: { view: true, edit: true },
  ...overrides
})

export const makeRole = (overrides?: Partial<IRole>): IRole => ({
  id: mockUuid(),
  name: 'Administrador',
  is_superadmin: false,
  permissions: makePermissions(),
  ...overrides
})

export const makeUser = (overrides?: Partial<IUser>): IUser => ({
  id: mockUuid(),
  email: mockEmail(),
  clinic_id: mockUuid(),
  active: true,
  role: makeRole(),
  ...overrides
})

export const makeContactSummary = (overrides?: Partial<IContactSummary>): IContactSummary => ({
  id: mockUuid(),
  name: mockName(),
  ...overrides
})

export const makeMessageSummary = (overrides?: Partial<IMessageSummary>): IMessageSummary => ({
  id: mockUuid(),
  content: 'Mock message content',
  sent_at: new Date().toISOString(),
  ...overrides
})

export const makeAppointment = (overrides?: Partial<IAppointment>): IAppointment => ({
  id: mockUuid(),
  contact_name: mockName(),
  contact_id: mockUuid(),
  treatment: { id: mockUuid(), name: 'Treatment' },
  doctor: { id: mockUuid(), name: 'Doctor' },
  scheduled_at: new Date().toISOString(),
  duration_min: 30,
  status: AppointmentStatus.PENDING,
  source: AppointmentSource.AGENT,
  channel: Channel.WHATSAPP,
  conversation_id: mockUuid(),
  notes: 'Mock notes',
  ...overrides
})

export const makeMessage = (overrides?: Partial<IMessage>): IMessage => ({
  id: mockUuid(),
  role: MessageRole.USER,
  content: 'Hello mock message',
  sent_at: new Date().toISOString(),
  ...overrides
})

export const makeConversation = (overrides?: Partial<IConversationListItem>): IConversationListItem => ({
  id: mockUuid(),
  channel: Channel.WHATSAPP,
  status: ConversationStatus.OPEN,
  current_step: ConversationStep.INICIO,
  contact: makeContactSummary(),
  last_message: makeMessageSummary(),
  appointment_id: null,
  started_at: new Date().toISOString(),
  ...overrides
})
