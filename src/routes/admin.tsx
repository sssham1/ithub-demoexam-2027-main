import { useState } from 'react'
import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useToast } from '#/components/Toast'
import { PAYMENTS, STATUSES, formatRuDate, type StatusKey } from '#/lib/validation'
import { getAllEntries, setEntryStatus } from '#/server/entries'

type Search = { status?: StatusKey; q?: string; page?: number }

export const Route = createFileRoute('/admin')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    status: typeof search.status === 'string' && search.status in STATUSES ? (search.status as StatusKey) : undefined,
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
    if (!context.user.isAdmin) throw redirect({ to: '/entries' })
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAllEntries({ data: { status: deps.status, search: deps.q, page: deps.page } }),
  component: Admin,
})

function Admin() {
  const data = Route.useLoaderData()
  const { status, q = '', page: current = 1 } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const router = useRouter()
  const toast = useToast()
  const [query, setQuery] = useState(q)

  const setSearch = (patch: Partial<Search>) => navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }) })

  async function changeStatus(entryId: number, status: StatusKey) {
    try {
      await setEntryStatus({ data: { entryId, status } })
      toast(`Заявка №${entryId}: статус «${STATUSES[status]}»`)
      await router.invalidate()
    } catch {
      toast('Не удалось изменить статус', 'error')
    }
  }

  const totalAll = Object.values(data.counts).reduce((a, b) => a + (b ?? 0), 0)

  return (
    <div className="stack">
      <h1>Панель администратора</h1>

      <div className="stats">
        <button type="button" className={!status ? 'stat active' : 'stat'} onClick={() => setSearch({ status: undefined })}>
          <b>{totalAll}</b> Все
        </button>
        {(Object.keys(STATUSES) as StatusKey[]).map((key) => (
          <button
            type="button"
            key={key}
            className={status === key ? `stat stat-${key} active` : `stat stat-${key}`}
            onClick={() => setSearch({ status: key })}
          >
            <b>{data.counts[key] ?? 0}</b> {STATUSES[key]}
          </button>
        ))}
      </div>

      <form
        className="filters"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch({ q: query || undefined })
        }}
      >
        <input type="search" placeholder="Поиск: логин, ФИО или курс" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit">Найти</button>
      </form>

      {data.entries.length === 0 ? (
        <article className="empty">Заявок не найдено</article>
      ) : (
        data.entries.map((entry) => (
          <article key={entry.id} className="entry">
            <header className="entry-head">
              <h3>
                №{entry.id}. {entry.course}
              </h3>
              <span className={`badge badge-${entry.status}`}>{STATUSES[entry.status]}</span>
            </header>
            <dl className="entry-meta">
              <dt>Пользователь</dt>
              <dd>
                {entry.user.fullname} ({entry.user.login})
              </dd>
              <dt>Контакты</dt>
              <dd>
                {entry.user.phone}, {entry.user.email}
              </dd>
              <dt>Начало обучения</dt>
              <dd>{formatRuDate(entry.startDate)}</dd>
              <dt>Оплата</dt>
              <dd>{PAYMENTS[entry.payment]}</dd>
              {entry.review && (
                <>
                  <dt>Отзыв</dt>
                  <dd>{entry.review}</dd>
                </>
              )}
            </dl>
            <label className="status-select">
              Статус
              <select value={entry.status} onChange={(e) => changeStatus(entry.id, e.target.value as StatusKey)}>
                {(Object.keys(STATUSES) as StatusKey[]).map((key) => (
                  <option key={key} value={key}>
                    {STATUSES[key]}
                  </option>
                ))}
              </select>
            </label>
          </article>
        ))
      )}

      {data.pages > 1 && (
        <nav className="pagination" aria-label="Страницы">
          <button
            type="button"
            className="outline"
            disabled={current <= 1}
            onClick={() => navigate({ search: (prev) => ({ ...prev, page: current - 1 }) })}
          >
            ‹
          </button>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((page) => (
            <button
              type="button"
              key={page}
              className={page === current ? '' : 'outline'}
              aria-current={page === current ? 'page' : undefined}
              onClick={() => navigate({ search: (prev) => ({ ...prev, page }) })}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="outline"
            disabled={current >= data.pages}
            onClick={() => navigate({ search: (prev) => ({ ...prev, page: current + 1 }) })}
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}
