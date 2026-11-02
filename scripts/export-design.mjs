// Экспорт мобильных макетов (390x844) в статические .html файлы — по одному на страницу.
// Запуск: npm run build && npm run preview (в другом терминале), затем npm run design:export

import { createHmac } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const OUT = new URL('../design/', import.meta.url)

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const admin = await prisma.user.findUniqueOrThrow({ where: { login: 'Admin' } })
const testuser = await prisma.user.findUniqueOrThrow({ where: { login: 'testuser' } })
await prisma.$disconnect()

function cookieFor(userId) {
  const value = String(userId)
  const sig = createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('hex')
  return `session=${value}.${sig}`
}

const PAGES = [
  { file: 'index.html', path: '/', title: 'Главная' },
  { file: 'register.html', path: '/register', title: 'Регистрация' },
  { file: 'login.html', path: '/login', title: 'Авторизация' },
  { file: 'entries.html', path: '/entries', title: 'Мои заявки', user: testuser.id },
  { file: 'new-entry.html', path: '/entries/new', title: 'Новая заявка', user: testuser.id },
  { file: 'admin.html', path: '/admin', title: 'Панель администратора', user: admin.id },
]

// ссылки между макетами вместо маршрутов приложения
const LINKS = { '/': 'index.html', '/register': 'register.html', '/login': 'login.html', '/entries': 'entries.html', '/entries/new': 'new-entry.html', '/admin': 'admin.html' }

// мини-скрипт слайдера для статического макета (автосмена каждые 3 секунды)
const SLIDER_SCRIPT = `<script>
(() => {
  const s = document.querySelector('.slider'); if (!s) return;
  const track = s.querySelector('.slider-track'), dots = [...s.querySelectorAll('.slider-dots button')];
  let i = 0, t;
  const go = (n) => { i = (n + dots.length) % dots.length; track.style.transform = 'translateX(-' + i * 100 + '%)';
    dots.forEach((d, k) => d.classList.toggle('active', k === i)); clearInterval(t); t = setInterval(() => go(i + 1), 3000); };
  s.querySelector('.prev').onclick = () => go(i - 1); s.querySelector('.next').onclick = () => go(i + 1);
  dots.forEach((d, k) => (d.onclick = () => go(k))); go(0);
})();
</script>`

await mkdir(new URL('img/', OUT), { recursive: true })
const cssCache = new Map()
const copied = new Set()

async function fetchText(url) {
  const res = await fetch(new URL(url, BASE))
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return res.text()
}

async function copyAsset(src) {
  const name = src.split('/').pop()
  if (!copied.has(name)) {
    const res = await fetch(new URL(src, BASE))
    await writeFile(new URL(`img/${name}`, OUT), Buffer.from(await res.arrayBuffer()))
    copied.add(name)
  }
  return `img/${name}`
}

for (const page of PAGES) {
  const res = await fetch(new URL(page.path, BASE), {
    headers: page.user ? { cookie: cookieFor(page.user) } : {},
    redirect: 'manual',
  })
  let html = await res.text()

  // стили — инлайном, скрипты приложения — убираем
  const styles = []
  for (const [, href] of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g)) {
    // макет всегда в мобильной раскладке, независимо от ширины окна
    if (!cssCache.has(href))
      cssCache.set(
        href,
        (await fetchText(href))
          .replace(/@media\s*\(min-width:\s*\d+px\)/g, '@media (min-width: 99999px)')
          .replace(/@media\s*\((?:max-width:\s*576px|width\s*<=\s*576px)\)/g, '@media all'),
      )
    styles.push(cssCache.get(href))
  }
  html = html
    .replace(/<link[^>]+rel="(stylesheet|modulepreload|preload)"[^>]*>/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace('</head>', `<style>${styles.join('\n')}</style><style>body{max-width:390px;margin:0 auto;box-shadow:0 0 0 1px #dde3ec}</style></head>`)
    .replace(/<title>[^<]*<\/title>/, `<title>Макет 390x844 — ${page.title}</title>`)

  for (const [, src] of [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:jpg|png|webp))"/g)]) {
    html = html.replaceAll(src, await copyAsset(src))
  }
  html = html.replace(/href="(\/[^"]*)"/g, (m, href) => (LINKS[href] ? `href="${LINKS[href]}"` : m))
  if (page.file === 'index.html') html = html.replace('</body>', `${SLIDER_SCRIPT}</body>`)

  await writeFile(new URL(page.file, OUT), html)
  console.log(`✅ design/${page.file}`)
}
