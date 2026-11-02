import { useState } from 'react'
import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Field } from '#/components/Field'
import { useToast } from '#/components/Toast'
import type { FieldErrors } from '#/lib/validation'
import { login } from '#/server/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: context.user.isAdmin ? '/admin' : '/entries' })
  },
  component: Login,
})

function Login() {
  const router = useRouter()
  const toast = useToast()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setPending(true)
    const result = await login({ data: { login: form.login, password: form.password } })
    setPending(false)
    if (!result.ok) return setErrors(result.errors)
    toast('Добро пожаловать!')
    await router.invalidate()
    await router.navigate({ to: result.isAdmin ? '/admin' : '/entries' })
  }

  return (
    <article className="auth-card">
      <h1>Вход</h1>
      <form className="form" onSubmit={onSubmit} onInput={() => setErrors({})}>
        {errors.form && (
          <p className="form-alert" role="alert">
            {errors.form}
          </p>
        )}
        <Field label="Логин" name="login" autoComplete="username" hint="Введите логин" serverError={errors.login} />
        <Field
          label="Пароль"
          name="password"
          type="password"
          autoComplete="current-password"
          hint="Введите пароль"
          serverError={errors.password}
        />
        <button type="submit" className="button-submit" aria-busy={pending} disabled={pending}>
          Войти
        </button>
      </form>
      <p className="switch">
        Еще не зарегистрированы? <Link to="/register">Регистрация</Link>
      </p>
    </article>
  )
}
