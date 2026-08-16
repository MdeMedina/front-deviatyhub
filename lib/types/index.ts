// Enums
export enum ConversationStatus {
  OPEN = 'OPEN',
  HUMAN_TAKEOVER = 'HUMAN_TAKEOVER',
  CLOSED = 'CLOSED'
}

export enum ConversationStep {
  INICIO = 'INICIO',
  ESPERANDO_TRATAMIENTO = 'ESPERANDO_TRATAMIENTO',
  ESPERANDO_FECHA = 'ESPERANDO_FECHA',
  ESPERANDO_HORARIO = 'ESPERANDO_HORARIO',
  ESPERANDO_DATOS_PERSONALES = 'ESPERANDO_DATOS_PERSONALES',
  LISTO_PARA_EJECUCION = 'LISTO_PARA_EJECUCION',
  SIN_CITAS = 'SIN_CITAS',
  CERRADO = 'CERRADO'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum AppointmentSource {
  AGENT = 'AGENT',
  HUMAN = 'HUMAN',
  EXTERNAL = 'EXTERNAL'
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  HUMAN = 'HUMAN'
}

export enum Channel {
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM'
}

export enum IntegrationType {
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  GOOGLE_CALENDAR = 'GOOGLE_CALENDAR',
  DENTALINK = 'DENTALINK',
  DENTIDESK = 'DENTIDESK',
  GMAIL = 'GMAIL'
}

// Auth
export interface IPermissions {
  knowledge_base: { view: boolean; edit: boolean }
  agent_actions: { view: boolean; edit: boolean }
  simulator: { view: boolean }
  metrics: { view: boolean }
  integrations: { view: boolean }
  security: { view: boolean }
  users: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  clinic_config: { view: boolean; edit: boolean }
  conversations: { view: boolean; takeover: boolean }
  agenda: { view: boolean; edit: boolean }
}

export interface IRole {
  id: string
  name: string
  is_superadmin: boolean
  isSuperadmin?: boolean
  permissions: IPermissions
}

export interface IUser {
  id: string
  email: string
  clinic_id: string
  active: boolean
  role: IRole
}

export interface ILoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: IUser
}

// Clínica
export interface IClinicConfig {
  id: string
  name: string
  address: string
  phone: string
  email: string
  timezone: string
  language: string
}

export interface IClinicSchedule {
  id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_open: boolean
}

export interface IUnavailabilityBlock {
  id: string
  name: string
  days_of_week: number[]
  start_time: string
  end_time: string
  active: boolean
}

export interface IPolicy {
  id: string
  title: string
  description: string
  active: boolean
}

// Summaries
export interface ITreatmentSummary {
  id: string
  name: string
}

export interface IDoctorSummary {
  id: string
  name: string
}

export interface IContactSummary {
  id: string
  name: string
}

export interface IMessageSummary {
  id: string
  content: string
  sent_at: string
}

export interface IAppointmentSummary {
  id: string
  scheduled_at: string
}

// Doctores y tratamientos
export interface IDoctor {
  id: string
  name: string
  title: string
  active: boolean
  treatments: ITreatmentSummary[]
}

export interface ITreatmentOffer {
  id: string
  label: string
  discount_pct: number
  fixed_price: number
  valid_from: string
  valid_until: string
  active: boolean
}

export interface ITreatment {
  id: string
  name: string
  description: string
  duration_min: number
  price: number
  price_isapre: number
  price_fonasa: number
  accepts_isapre: boolean
  accepts_fonasa: boolean
  active: boolean
  encyclopedia_ref: string
  doctors: IDoctorSummary[]
  offers: ITreatmentOffer[]
}

export interface IEncyclopediaEntry {
  id: string
  name: string
  category: string
  description: string
  procedure: string
  duration_avg_min: number
  indications: string
  contraindications: string
  post_care: string
  keywords: string[]
}

// Agenda
export interface IAppointment {
  id: string
  contact_name: string
  contact_id: string
  treatment: ITreatmentSummary
  doctor: IDoctorSummary
  scheduled_at: string
  duration_min: number
  status: AppointmentStatus
  source: AppointmentSource
  channel: Channel
  conversation_id: string
  notes: string
}

export interface IAppointmentHistory {
  id: string
  event: string
  performed_by: string
  channel: string
  created_at: string
}

export interface IAppointmentDetail extends IAppointment {
  history: IAppointmentHistory[]
}

// Conversaciones
export interface IContact {
  id: string
  name: string
  phone: string
  email: string
  instagram_user: string
  channel: Channel
  last_interaction_at: string
}

export interface IMessage {
  id: string
  role: MessageRole
  content: string
  sent_at: string
}

export interface IConversationListItem {
  id: string
  channel: Channel
  status: ConversationStatus
  current_step: ConversationStep
  contact: IContactSummary
  last_message: IMessageSummary
  appointment_id: string | null
  started_at: string
}

export interface IConversationDetail extends IConversationListItem {
  contact: IContact
  appointment: IAppointmentSummary | null
  assigned_user_id: string | null
  messages: IMessage[]
}

export interface ConversationFilters {
  status?: ConversationStatus
  channel?: Channel
  search?: string
  page?: number
  limit?: number
}

// Credentials
export interface ILoginCredentials {
  email: string
  password: string
}

// Métricas
export interface IIntentionDistribution {
  intention: string
  count: number
  percentage: number
}

export interface IHourlyInteraction {
  hour: number
  count: number
}

export interface IMetricsSummary {
  period: string
  from: string
  to: string
  conversations_attended: number
  avg_response_time_ms: number
  containment_rate: number
  human_takeovers: number
  appointments_scheduled: number
  appointments_rescheduled: number
  appointments_cancelled: number
  out_of_hours_conversations: number
  intentions_distribution: IIntentionDistribution[]
  interactions_by_hour: IHourlyInteraction[]
}

// Integraciones
export interface IIntegration {
  type: IntegrationType
  connected: boolean
  last_tested_at: string
  last_test_ok: boolean
  latency_ms?: number
}

// API responses
export interface IApiResponse<T> {
  success: boolean
  data: T
}

export interface IPaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface IApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type SocketEvent = 
  | 'conversation.new'
  | 'conversation.message'
  | 'conversation.status_changed'
  | 'conversation.action_executed'
  | 'conversation.step_changed'

// Socket.io events
export interface ISocketConversationNew {
  id: string
  channel: Channel
  contact: IContactSummary
  started_at: string
}

export interface ISocketConversationMessage {
  conversation_id: string
  message: IMessage
}

export interface ISocketStatusChanged {
  conversation_id: string
  status: ConversationStatus
  assigned_user_id: string | null
}

export interface ISocketActionExecuted {
  conversation_id: string
  action: string
  appointment_id: string | null
}

export interface ISocketStepChanged {
  conversation_id: string
  current_step: ConversationStep
}

// Credentials for setting password
export interface ISetPasswordCredentials {
  token: string
  password: string
  password_confirm: string
}

// Agente
export interface IAgentActionConfig {
  active: boolean
  channels: Channel[]
  integrations: IntegrationType[]
}

export interface IAgentConfig {
  id: string
  clinic_id: string
  actions: {
    schedule: IAgentActionConfig
    reschedule: IAgentActionConfig
    cancel: IAgentActionConfig
  }
  updated_at: string
}

// Simulador
export interface ISimulatorResponse {
  session_id: string
  response: string
  tools_used: string[]
}

// Integraciones
export interface IIntegrationTestResponse {
  ok: boolean
  tested_at: string
  latency_ms: number
  error?: string
}

// Seguridad — Logs de auditoría
export type AuditLogPeriod = '7d' | '30d'

export interface IAuditLog {
  id: string
  /** Email del usuario que realizó la acción */
  user_email: string
  /** Acción realizada (ej. CREATE, UPDATE, DELETE) */
  action: string
  /** Entidad afectada (ej. Doctor, Treatment, Role) */
  entity: string
  /** Fecha ISO de la acción */
  created_at: string
  /** Detalle de cambios — before puede ser null para acciones CREATE */
  changes: {
    before: Record<string, unknown> | null
    after: Record<string, unknown> | null
  }
}
