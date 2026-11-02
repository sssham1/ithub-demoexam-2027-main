import { createServerOnlyFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import { getSessionUserId } from '#/lib/session'
import { ADMIN_LOGIN } from '#/lib/validation'

// Проверки доступа для серверных функций

export const requireUser = createServerOnlyFn(async () => {
  const userId = getSessionUserId()
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null
  if (!user) throw new Error('Требуется авторизация')
  return user
})

export const requireAdmin = createServerOnlyFn(async () => {
  const user = await requireUser()
  if (user.login !== ADMIN_LOGIN) throw new Error('Доступ только для администратора')
  return user
})
