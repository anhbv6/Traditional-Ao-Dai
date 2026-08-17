export function normalizeVietnamPhone(phone?: string | null) {
  if (!phone) {
    return phone
  }

  return phone.startsWith('+84') ? `0${phone.slice(3)}` : phone
}