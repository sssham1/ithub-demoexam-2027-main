import { useCallback, useEffect, useState } from 'react'

import slide1 from '#/assets/optimized/slide-image06.jpg'
import slide2 from '#/assets/optimized/slide-image07.jpg'
import slide3 from '#/assets/optimized/slide-image10.jpg'
import slide4 from '#/assets/optimized/slide-image11.jpg'

const SLIDES = [
  { src: slide1, caption: 'Учитесь онлайн в удобное время' },
  { src: slide2, caption: 'Практика на реальных задачах' },
  { src: slide3, caption: 'Опытные преподаватели' },
  { src: slide4, caption: 'Удостоверение о повышении квалификации' },
]

const INTERVAL = 3000

export function Slider() {
  const [index, setIndex] = useState(0)
  // при ручном переключении таймер начинается заново
  const [tick, setTick] = useState(0)

  const go = useCallback((delta: number) => {
    setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length)
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL)
    return () => clearInterval(id)
  }, [tick])

  return (
    <section className="slider" aria-roledescription="carousel" aria-label="Слайдер">
      <div className="slider-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((slide, i) => (
          <figure className="slide" key={slide.src} aria-hidden={i !== index}>
            <img src={slide.src} alt={slide.caption} width={960} height={600} loading={i ? 'lazy' : 'eager'} />
            <figcaption>{slide.caption}</figcaption>
          </figure>
        ))}
      </div>
      <button type="button" className="slider-btn prev" onClick={() => go(-1)} aria-label="Назад">
        ‹
      </button>
      <button type="button" className="slider-btn next" onClick={() => go(1)} aria-label="Вперед">
        ›
      </button>
      <div className="slider-dots">
        {SLIDES.map((slide, i) => (
          <button
            type="button"
            key={slide.src}
            className={i === index ? 'active' : ''}
            onClick={() => go(i - index)}
            aria-label={`Слайд ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
