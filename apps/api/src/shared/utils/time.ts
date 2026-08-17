import { AppError } from "../middlewares/errorHandler"

export function durationToMs(duration: string): number {
  const match = duration.trim().match(/^(\d+)(ms|s|m|h|d|w)?$/)
  if (!match) {
    throw new AppError(500, 'Invalid refresh token expiration config')
  }

  const value = Number(match[1])
  const unit = match[2] ?? 'ms'
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  }

  return value * multipliers[unit]
}