import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import { requireAdmin, requireUser } from '#/server/guards'
import { COURSES, type FieldErrors, PAYMENTS, STATUSES, parseRuDate, type PaymentKey, type StatusKey } from '#/lib/validation'

export const getMyEntries = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireUser()
  return prisma.entry.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
  })
})

type CreateEntryInput = { course: string; startDate: string; payment: string }

export const createEntry = createServerFn({ method: 'POST' })
  .validator((data: CreateEntryInput) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const errors: FieldErrors = {}
    if (!COURSES.includes(data.course as (typeof COURSES)[number])) errors.course = 'Выберите курс из списка'
    const startDate = parseRuDate(data.startDate)
    if (!startDate) errors.startDate = 'Укажите существующую дату в формате ДД.ММ.ГГГГ'
    if (!(data.payment in PAYMENTS)) errors.payment = 'Выберите способ оплаты'
    if (Object.keys(errors).length || !startDate) return { ok: false as const, errors }

    await prisma.entry.create({
      data: { userId: user.id, course: data.course, startDate, payment: data.payment as PaymentKey },
    })
    return { ok: true as const }
  })

export const leaveReview = createServerFn({ method: 'POST' })
  .validator((data: { entryId: number; review: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const review = data.review.trim()
    if (!review) return { ok: false as const, error: 'Напишите текст отзыва' }

    const entry = await prisma.entry.findFirst({ where: { id: data.entryId, userId: user.id } })
    if (!entry) return { ok: false as const, error: 'Заявка не найдена' }
    if (entry.status !== 'DONE') return { ok: false as const, error: 'Отзыв можно оставить только после завершения обучения' }

    await prisma.entry.update({ where: { id: entry.id }, data: { review } })
    return { ok: true as const }
  })

export const ADMIN_PAGE_SIZE = 5

type AdminListInput = { status?: StatusKey; search?: string; page?: number }

export const getAllEntries = createServerFn({ method: 'GET' })
  .validator((data: AdminListInput) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    const search = data.search?.trim()
    const page = Math.max(1, data.page ?? 1)
    const where = {
      ...(data.status && { status: data.status }),
      ...(search && {
        OR: [
          { course: { contains: search, mode: 'insensitive' as const } },
          { user: { login: { contains: search, mode: 'insensitive' as const } } },
          { user: { fullname: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    }
    const [total, entries, counts] = await Promise.all([
      prisma.entry.count({ where }),
      prisma.entry.findMany({
        where,
        include: { user: { select: { login: true, fullname: true, phone: true, email: true } } },
        orderBy: { id: 'desc' },
        skip: (page - 1) * ADMIN_PAGE_SIZE,
        take: ADMIN_PAGE_SIZE,
      }),
      prisma.entry.groupBy({ by: ['status'], _count: true }),
    ])
    return {
      total,
      pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
      entries,
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) as Partial<Record<StatusKey, number>>,
    }
  })

export const setEntryStatus = createServerFn({ method: 'POST' })
  .validator((data: { entryId: number; status: StatusKey }) => data)
  .handler(async ({ data }) => {
    await requireAdmin()
    if (!(data.status in STATUSES)) throw new Error('Неизвестный статус')
    await prisma.entry.update({ where: { id: data.entryId }, data: { status: data.status } })
  })
