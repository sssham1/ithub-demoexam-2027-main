import { useState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Field, formatDate } from '#/components/Field'
import { useToast } from '#/components/Toast'
import { COURSES, PAYMENTS, patterns, type FieldErrors } from '#/lib/validation'
import { createEntry } from '#/server/entries'

export const Route = createFileRoute('/entries/new')({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
    if (context.user.isAdmin) throw redirect({ to: '/admin' })
  },
  component: NewEntry,
})

function NewEntry() {
  const router = useRouter()
  const toast = useToast()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [date, setDate] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setPending(true)
    const result = await createEntry({ data: { course: form.course, startDate: form.startDate, payment: form.payment } })
    setPending(false)
    if (!result.ok) return setErrors(result.errors)
    toast('Заявка отправлена на рассмотрение')
    await router.navigate({ to: '/entries' })
  }

  return (
    <article className="auth-card">
      <h1>Новая заявка</h1>
      <form className="form" onSubmit={onSubmit} onInput={() => setErrors({})}>
        <label className="field">
          Наименование курса
          <select className="input" name="course" required defaultValue="" aria-invalid={errors.course ? true : undefined}>
            <option value="" disabled>
              Выберите курс
            </option>
            {COURSES.map((course) => (
              <option key={course}>{course}</option>
            ))}
          </select>
          <small className="error">Выберите курс из списка</small>
          {errors.course && <small className="server-error">{errors.course}</small>}
        </label>

        <Field
          label="Желаемая дата начала обучения"
          name="startDate"
          inputMode="numeric"
          placeholder="ДД.ММ.ГГГГ"
          pattern={patterns.date}
          value={date}
          onChange={(e) => {
            const deleting = (e.nativeEvent as InputEvent).inputType?.startsWith('delete')
            setDate(deleting ? e.target.value : formatDate(e.target.value))
          }}
          hint="Формат: ДД.ММ.ГГГГ"
          serverError={errors.startDate}
        />

        <fieldset>
          <legend>Способ оплаты</legend>
          {Object.entries(PAYMENTS).map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="payment" value={value} required /> {label}
            </label>
          ))}
          {errors.payment && <small className="server-error">{errors.payment}</small>}
        </fieldset>

        <button type="submit" className="button-submit" aria-busy={pending} disabled={pending}>
          Отправить
        </button>
      </form>
    </article>
  )
}
