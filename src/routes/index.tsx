import { Link, createFileRoute } from '@tanstack/react-router'
import { Slider } from '#/components/Slider'
import { COURSES } from '#/lib/validation'

export const Route = createFileRoute('/')({
  component: Home,
})

const COURSE_ICONS = ['💻', '🎨', '🗄️']

function Home() {
  const { user } = Route.useRouteContext()

  return (
    <div className="stack">
      <section className="hero">
        <h1>Онлайн-курсы повышения квалификации</h1>
        <p>Выберите программу, укажите удобную дату начала и способ оплаты — администратор рассмотрит заявку в ближайшее время.</p>
        {user ? (
          <Link to={user.isAdmin ? '/admin' : '/entries/new'} role="button">
            {user.isAdmin ? 'Перейти к заявкам' : 'Оставить заявку'}
          </Link>
        ) : (
          <div className="hero-actions">
            <Link to="/register" role="button">
              Зарегистрироваться
            </Link>
            <Link to="/login" role="button" className="outline">
              Войти
            </Link>
          </div>
        )}
      </section>

      <Slider />

      <section>
        <h2>Наши программы</h2>
        <div className="cards">
          {COURSES.map((course, i) => (
            <article key={course} className="card">
              <span className="card-icon" aria-hidden>
                {COURSE_ICONS[i]}
              </span>
              <h3>{course}</h3>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
