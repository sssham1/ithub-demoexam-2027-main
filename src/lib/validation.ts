// Общие правила валидации — используются и на клиенте (pattern в input), и на сервере

export const ADMIN_LOGIN = 'Admin'

export type FieldErrors = Partial<Record<string, string>>

export const COURSES = [
  'Основы алгоритмизации и программирования',
  'Основы веб-дизайна',
  'Основы проектирования баз данных',
] as const

export const PAYMENTS = {
  CASH: 'Наличными',
  PHONE_TRANSFER: 'Переводом по номеру телефона',
} as const

export const STATUSES = {
  NEW: 'Новая',
  IN_PROGRESS: 'Идет обучение',
  DONE: 'Обучение завершено',
} as const

export type StatusKey = keyof typeof STATUSES
export type PaymentKey = keyof typeof PAYMENTS

export const patterns = {
  login: '[A-Za-z0-9]{6,}',
  password: '.{8,}',
  fullname: '[А-Яа-яЁё ]+',
  phone: '8\\(\\d{3}\\)\\d{3}-\\d{2}-\\d{2}',
  email: '[^@\\s]+@[^@\\s]+\\.[^@\\s]+',
  date: '\\d{2}\\.\\d{2}\\.\\d{4}',
}

export function matches(value: string, pattern: string) {
  return new RegExp(`^(?:${pattern})$`).test(value)
}

// ДД.ММ.ГГГГ -> Date (UTC) или null, если такой даты не существует
export function parseRuDate(value: string) {
  if (!matches(value, patterns.date)) return null
  const [d, m, y] = value.split('.').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return date
}

export function formatRuDate(value: Date | string) {
  const date = new Date(value)
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${date.getUTCFullYear()}`
}
