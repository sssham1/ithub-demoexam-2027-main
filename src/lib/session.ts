import { createHmac, timingSafeEqual } from 'node:crypto'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

// Сессия — подписанная HMAC cookie с id пользователя

const COOKIE = 'session'

function secret() {
  const value = process.env.SESSION_SECRET
  if (!value) throw new Error('SESSION_SECRET is required')
  return value
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('hex')
}

export function startSession(userId: number) {
  const value = String(userId)
  setCookie(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function endSession() {
  deleteCookie(COOKIE, { path: '/' })
}

export function getSessionUserId() {
  const raw = getCookie(COOKIE)
  if (!raw) return null
  const [value, signature] = raw.split('.')
  if (!value || !signature) return null
  const expected = Buffer.from(sign(value))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  return Number(value)
}
