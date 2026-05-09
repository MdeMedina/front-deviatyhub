const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export const ENDPOINTS = {
  auth: {
    login:        `${API_BASE}/auth/login`,
    refresh:      `${API_BASE}/auth/refresh`,
    logout:       `${API_BASE}/auth/logout`,
    me:           `${API_BASE}/auth/me`,
    setPassword:  `${API_BASE}/auth/set-password`,
    users:        `${API_BASE}/auth/users`,
    invite:       `${API_BASE}/auth/users/invite`,
    user:         (id: string) => `${API_BASE}/auth/users/${id}`,
    roles:        `${API_BASE}/auth/roles`,
    role:         (id: string) => `${API_BASE}/auth/roles/${id}`,
  },
  clinic: {
    config:           `${API_BASE}/core/clinic/config`,
    schedules:        `${API_BASE}/core/clinic/schedules`,
    unavailability:   `${API_BASE}/core/clinic/unavailability`,
    unavailabilityById: (id: string) => `${API_BASE}/core/clinic/unavailability/${id}`,
    policies:         `${API_BASE}/core/clinic/policies`,
    policyById:       (id: string) => `${API_BASE}/core/clinic/policies/${id}`,
  },
  doctors: {
    list:   `${API_BASE}/core/doctors`,
    byId:   (id: string) => `${API_BASE}/core/doctors/${id}`,
  },
  treatments: {
    list:         `${API_BASE}/core/treatments`,
    byId:         (id: string) => `${API_BASE}/core/treatments/${id}`,
    offers:       (id: string) => `${API_BASE}/core/treatments/${id}/offers`,
    offer:        (id: string, offerId: string) => `${API_BASE}/core/treatments/${id}/offers/${offerId}`,
    encyclopedia: `${API_BASE}/core/treatments/encyclopedia`,
  },
  agenda: {
    appointments:   `${API_BASE}/core/agenda/appointments`,
    byId:           (id: string) => `${API_BASE}/core/agenda/appointments/${id}`,
    status:         (id: string) => `${API_BASE}/core/agenda/appointments/${id}/status`,
    reschedule:     (id: string) => `${API_BASE}/core/agenda/appointments/${id}/reschedule`,
  },
  conversations: {
    list:       `${API_BASE}/core/conversations`,
    byId:       (id: string) => `${API_BASE}/core/conversations/${id}`,
    takeover:   (id: string) => `${API_BASE}/core/conversations/${id}/takeover`,
    release:    (id: string) => `${API_BASE}/core/conversations/${id}/release`,
    message:    (id: string) => `${API_BASE}/core/conversations/${id}/message`,
    contacts:   `${API_BASE}/core/conversations/contacts`,
  },
  metrics: {
    summary: `${API_BASE}/core/metrics/summary`,
  },
  agentConfig: `${API_BASE}/core/agent-config`,
  integrations: {
    list: `${API_BASE}/core/integrations`,
    test: (type: string) => `${API_BASE}/core/integrations/${type}/test`,
  },
  simulator: `${API_BASE}/agent/simulate`,
  security: {
    auditLogs: `${API_BASE}/core/security/audit-logs`,
  },
} as const
