export function normalizeVietnamPhone(phone?: string | null) {
  if (!phone) {
    return phone
  }

  return phone.startsWith('+84') ? `0${phone.slice(3)}` : phone
}

export function generateOtp(length = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}