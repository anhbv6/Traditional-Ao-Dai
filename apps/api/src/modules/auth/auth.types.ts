export interface SessionMeta {
  deviceInfo?: string
  ipAddress?: string
}

export interface CheckAccountResult {
  available: boolean
  reason: 'EMAIL_TAKEN' | 'PHONE_TAKEN' | 'AVAILABLE'
}