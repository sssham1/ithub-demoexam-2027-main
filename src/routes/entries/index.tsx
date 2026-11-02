import { useState } from 'react'
import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useToast } from '#/components/Toast'
import { PAYMENTS, STATUSES, formatRuDate } from '#/lib/validation'
import { getMyEntries, leaveReview } from '#/server/entries'

export const Route = createFileRoute('/entries/')({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
    if (context.user.isAdmin) throw redirect({ to: '/admin' })
  },
  loader: () => getMyEntries(),
  component: Entries,
})

type Entry = Awaited<ReturnType<typeof getMyEntries>>[number]

function Entries() {
  const entries = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Мои заявки</h1>
          <p className="muted">{user?.fullname}</p>
        </div>
        <Link to="/entries/new" role="button">
          + Новая заявка
        </Link>
      </div>

      {entries.length === 0 ? (
        <article className="empty">
          <p>У вас пока нет заявок.</p>
          <Link to="/entries/new">Оформить первую заявку</Link>
        </article>
      ) : (
        entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
      )}
    </div>
  )
}

function EntryCard({ entry }: { entry: Entry }) {
  const router = useRouter()
  const toast = useToast()
  const [review, setReview] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const result = await leaveReview({ data: { entryId: entry.id, review } })
    setPending(false)
    if (!result.ok) return setError(result.error)
    toast('Спасибо за отзыв!')
    await router.invalidate()
  }

  return (
    <article className="entry">
      <header className="entry-head">
        <h3>{entry.course}</h3>
        <span className={`badge badge-${entry.status}`}>{STATUSES[entry.status]}</span>
      </header>
      <dl className="entry-meta">
        <dt>Заявка №</dt>
        <dd>{entry.id}</dd>
        <dt>Начало обучения</dt>
        <dd>{formatRuDate(entry.startDate)}</dd>
        <dt>Оплата</dt>
        <dd>{PAYMENTS[entry.payment]}</dd>
      </dl>

      {entry.review ? (
        <blockquote className="review">
          <b>Ваш отзыв:</b> {entry.review}
        </blockquote>
      ) : entry.status === 'DONE' ? (
        <form className="review-form" onSubmit={onSubmit}>
          <label>
            Отзыв о качестве образовательных услуг
            <textarea
              required
              rows={3}
              value={review}
              onChange={(e) => {
                setReview(e.target.value)
                setError('')
              }}
              placeholder="Поделитесь впечатлениями о курсе"
              aria-invalid={error ? true : undefined}
            />
            {error && <small className="server-error">{error}</small>}
          </label>
          <button type="submit" aria-busy={pending} disabled={pending || !review.trim()}>
            Оставить отзыв
          </button>
        </form>
      ) : (
        <p className="muted small">Отзыв можно будет оставить после завершения обучения.</p>
      )}
    </article>
  )
}
