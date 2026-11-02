import { HeadContent, Link, Scripts, createRootRoute, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import logo from '#/assets/optimized/logo.png'
import { ToastProvider } from '#/components/Toast'
import { getCurrentUser, logout } from '#/server/auth'

export const Route = createRootRoute({
  beforeLoad: async () => ({ user: await getCurrentUser() }),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Корочки.есть — онлайн-курсы ДПО',
      },
      {
        name: 'theme-color',
        content: '#1b3a6b',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: logo,
      },
      {
        rel: 'stylesheet',
        href: '/pico.css',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function Header() {
  const { user } = Route.useRouteContext()
  const router = useRouter()

  async function onLogout() {
    await logout()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <header className="header">
      <nav className="container">
        <Link to="/" className="brand">
          <img src={logo} alt="" width={48} height={48} />
          <span>
            Корочки<b>.есть</b>
          </span>
        </Link>
        <ul className="nav-links">
          {user?.isAdmin && (
            <li>
              <Link to="/admin">Панель</Link>
            </li>
          )}
          {user && !user.isAdmin && (
            <>
              <li>
                <Link to="/entries" activeOptions={{ exact: true }}>
                  Заявки
                </Link>
              </li>
              <li>
                <Link to="/entries/new">Новая</Link>
              </li>
            </>
          )}
          {user ? (
            <li>
              <button type="button" className="outline secondary btn-small" onClick={onLogout}>
                Выйти
              </button>
            </li>
          ) : (
            <li>
              <Link to="/login" role="button" className="btn-small">
                Войти
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <ToastProvider>
          <Header />
          <main className="container main">{children}</main>
          <footer className="footer">
            <div className="container">© {new Date().getFullYear()} Корочки.есть — онлайн-курсы дополнительного профессионального образования</div>
          </footer>
        </ToastProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
