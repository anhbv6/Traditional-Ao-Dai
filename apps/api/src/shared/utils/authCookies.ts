import { CookieOptions, Response } from 'express'
import { AUTH_COOKIES, type Role } from '@repo/shared'
import { env } from '../config/env'
import { secondsUntil } from './number'

/**
 * Quản lý cookie phiên đăng nhập — NGUỒN DUY NHẤT đặt/xóa cookie auth.
 * Web và API chạy chung origin (Next.js rewrites /api -> Express) nên cookie do API đặt được trình duyệt
 * gắn cho domain của web, Next proxy/Server Actions đọc được cả cookie httpOnly.
 */

function baseOptions(options: { httpOnly: boolean; sameSite: 'lax' | 'strict'; expiresAt?: Date; persistent: boolean }): CookieOptions {
  const cookie: CookieOptions = {
    httpOnly: options.httpOnly,
    secure: env.NODE_ENV === 'production',
    sameSite: options.sameSite,
    path: '/',
  }

  // Không persistent -> session cookie (tự xóa khi đóng trình duyệt)
  if (options.persistent && options.expiresAt) {
    cookie.maxAge = secondsUntil(options.expiresAt) * 1000
  }

  return cookie
}

function clearOptions(httpOnly: boolean, sameSite: 'lax' | 'strict'): CookieOptions {
  return {
    httpOnly,
    secure: env.NODE_ENV === 'production',
    sameSite,
    path: '/',
  }
}

// ─── Customer ──────────────────────────────────────────────────────────────────

/**
 * Refresh token (httpOnly) + cờ `has_session` (đọc được bằng JS, không chứa bí mật) để FE biết có nên gọi refresh
 */
export function setCustomerSessionCookies(res: Response, refreshToken: string, rememberMe: boolean, expiresAt: Date) {
  res.cookie(AUTH_COOKIES.refreshToken, refreshToken, baseOptions({ httpOnly: true, sameSite: 'lax', expiresAt, persistent: rememberMe }))
  res.cookie(AUTH_COOKIES.customerSessionHint, '1', baseOptions({ httpOnly: false, sameSite: 'lax', expiresAt, persistent: rememberMe }))
}

export function clearCustomerSessionCookies(res: Response) {
  res.clearCookie(AUTH_COOKIES.refreshToken, clearOptions(true, 'lax'))
  res.clearCookie(AUTH_COOKIES.customerSessionHint, clearOptions(false, 'lax'))
}

// ─── Admin / Staff ─────────────────────────────────────────────────────────────

/**
 * Access token quản trị (httpOnly, SameSite=Strict để chống CSRF) + cờ vai trò `admin_session` (chỉ dùng hiển thị UI)
 */
export function setAdminSessionCookies(res: Response, token: string, role: Role, rememberMe: boolean, expiresAt: Date) {
  res.cookie(AUTH_COOKIES.adminToken, token, baseOptions({ httpOnly: true, sameSite: 'strict', expiresAt, persistent: rememberMe }))
  res.cookie(AUTH_COOKIES.adminSessionHint, role, baseOptions({ httpOnly: false, sameSite: 'strict', expiresAt, persistent: rememberMe }))
}

export function clearAdminSessionCookies(res: Response) {
  res.clearCookie(AUTH_COOKIES.adminToken, clearOptions(true, 'strict'))
  res.clearCookie(AUTH_COOKIES.adminSessionHint, clearOptions(false, 'strict'))
}
