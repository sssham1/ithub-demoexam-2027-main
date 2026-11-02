import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import { hashPassword, verifyPassword } from '#/lib/hash'
import { endSession, getSessionUserId, startSession } from '#/lib/session'
import { ADMIN_LOGIN, matches, patterns, type FieldErrors } from '#/lib/validation'

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = getSessionUserId()
  if (!userId) return null
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, login: true, fullname: true },
  })
  if (!user) return null
  return { ...user, isAdmin: user.login === ADMIN_LOGIN }
})

type RegisterInput = {
  login: string
  password: string
  fullname: string
  phone: string
  email: string
}

export const register = createServerFn({ method: 'POST' })
  .validator((data: RegisterInput) => data)
  .handler(async ({ data }) => {
    const errors: FieldErrors = {}
    if (!matches(data.login, patterns.login)) errors.login = 'Логин: латиница и цифры, не менее 6 символов'
    if (!matches(data.password, patterns.password)) errors.password = 'Пароль: минимум 8 символов'
    if (!matches(data.fullname.trim(), patterns.fullname)) errors.fullname = 'ФИО: только кириллица и пробелы'
    if (!matches(data.phone, patterns.phone)) errors.phone = 'Телефон в формате 8(XXX)XXX-XX-XX'
    if (!matches(data.email, patterns.email)) errors.email = 'Некорректный адрес электронной почты'

    if (!errors.login) {
      const exists = await prisma.user.findUnique({ where: { login: data.login } })
      if (exists) errors.login = 'Пользователь с таким логином уже существует'
    }

    if (Object.keys(errors).length) return { ok: false as const, errors }

    const user = await prisma.user.create({
      data: {
        login: data.login,
        password: await hashPassword(data.password),
        fullname: data.fullname.trim(),
        phone: data.phone,
        email: data.email,
      },
    })
    startSession(user.id)
    return { ok: true as const }
  })

export const login = createServerFn({ method: 'POST' })
  .validator((data: { login: string; password: string }) => data)
  .handler(async ({ data }) => {
    const errors: FieldErrors = {}
    if (!data.login) errors.login = 'Введите логин'
    if (!data.password) errors.password = 'Введите пароль'
    if (Object.keys(errors).length) return { ok: false as const, errors }

    const user = await prisma.user.findUnique({ where: { login: data.login } })
    if (!user || !(await verifyPassword(data.password, user.password))) {
      return { ok: false as const, errors: { form: 'Неверный логин или пароль' } as FieldErrors }
    }
    startSession(user.id)
    return { ok: true as const, isAdmin: user.login === ADMIN_LOGIN }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  endSession()
})
