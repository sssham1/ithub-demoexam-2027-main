import { useState } from 'react'
import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Field, formatPhone } from '#/components/Field'
import { useToast } from '#/components/Toast'
import { patterns, type FieldErrors } from '#/lib/validation'
import { register } from '#/server/auth'

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: '/entries' })
  },
  component: Register,
})

function Register() {
  const router = useRouter()
  const toast = useToast()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [phone, setPhone] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setPending(true)
    const result = await register({
      data: { login: form.login, password: form.password, fullname: form.fullname, phone: form.phone, email: form.email },
    })
    setPending(false)
    if (!result.ok) return setErrors(result.errors)
    toast('Регистрация прошла успешно')
    await router.invalidate()
    await router.navigate({ to: '/entries' })
  }

  return (
    <article className="auth-card">
      <h1>Регистрация</h1>
      <form className="form" onSubmit={onSubmit} onInput={(e) => setErrors((prev) => ({ ...prev, [(e.target as HTMLInputElement).name]: undefined }))}>
        <Field
          label="Логин"
          name="login"
          autoComplete="username"
          pattern={patterns.login}
          hint="Латиница и цифры, не менее 6 символов"
          serverError={errors.login}
        />
        <Field
          label="Пароль"
          name="password"
          type="password"
          autoComplete="new-password"
          pattern={patterns.password}
          hint="Минимум 8 символов"
          serverError={errors.password}
        />
        <Field
          label="ФИО"
          name="fullname"
          autoComplete="name"
          pattern={patterns.fullname}
          hint="Только кириллица и пробелы"
          serverError={errors.fullname}
        />
        <Field
          label="Телефон"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="8(XXX)XXX-XX-XX"
          pattern={patterns.phone}
          value={phone}
          onChange={(e) => {
            const deleting = (e.nativeEvent as InputEvent).inputType?.startsWith('delete')
            setPhone(deleting ? e.target.value : formatPhone(e.target.value))
          }}
          hint="Формат: 8(XXX)XXX-XX-XX"
          serverError={errors.phone}
        />
        <Field
          label="Электронная почта"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          pattern={patterns.email}
          hint="Укажите корректный адрес электронной почты"
          serverError={errors.email}
        />
        <button type="submit" className="button-submit" aria-busy={pending} disabled={pending}>
          Зарегистрироваться
        </button>
      </form>
      <p className="switch">
        Уже зарегистрированы? <Link to="/login">Войти</Link>
      </p>
    </article>
  )
}
