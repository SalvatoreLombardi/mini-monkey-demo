import { useEffect, useRef } from 'react'
import gsap from 'gsap'

type Props = { onDone: () => void }

const COLORI = ['#d9b3ab', '#a9bfd6', '#c9b79c', '#e9dfce', '#e8c9c1']

export default function Intro({ onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const logo = useRef<HTMLDivElement>(null)
  const stork = useRef<HTMLImageElement>(null)
  const monkey = useRef<HTMLDivElement>(null)
  const sway = useRef<HTMLDivElement>(null)
  const flip = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone()
      return
    }
    const ctx = gsap.context(() => {
      const W = logo.current!.offsetWidth
      const s = W / 1845 // dai pixel del logo originale ai pixel dello schermo
      const fuori = (window.innerWidth + W) / 2 + W * 0.2
      const quota = -W * 0.14 // altezza da cui cade la scimmietta
      const salto = W * 0.1 // altezza dei salti
      const pallini = gsap.utils.toArray<HTMLElement>('.intro__dot')

      gsap.set([stork.current, monkey.current], { x: -fuori, y: quota * 1.6, opacity: 0 })
      gsap.set(text.current, { clipPath: 'inset(0 100% 0 0)' })
      gsap.set(pallini, { opacity: 0 })

      const tl = gsap.timeline({ onComplete: onDone, defaults: { ease: 'power2.out' } })

      // la scritta compare come scritta a mano, da sinistra a destra
      tl.to(text.current, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power2.inOut' }, 0.15)

      // la cicogna arriva planando e rallenta fino a fermarsi sopra la scritta
      tl.to([stork.current, monkey.current], { opacity: 1, duration: 0.3 }, 0.3)
      tl.to([stork.current, monkey.current], { x: 0, y: quota, duration: 1.8, ease: 'power3.out' }, 0.3)
      tl.to(stork.current, { rotate: 2, duration: 1.0, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.5)

      // la scimmietta dondola appesa al becco
      tl.to(sway.current, { rotate: -9, duration: 0.3, ease: 'sine.inOut' }, 1.7)
      tl.to(sway.current, { rotate: 9, duration: 0.5, ease: 'sine.inOut' })
      tl.to(sway.current, { rotate: -4, duration: 0.4, ease: 'sine.inOut' })

      // lascia la presa: cade e rimbalza sulla "k" di Monkey
      const cade = tl.duration()
      tl.to(sway.current, { rotate: 0, duration: 0.25 }, cade)
      tl.to(monkey.current, { y: 0, duration: 0.85, ease: 'bounce.out' }, cade)
      tl.to(stork.current, { x: fuori, y: quota * 2.4, rotate: -4, duration: 1.9, ease: 'power2.in' }, cade - 0.05)

      // coriandoli morbidi dove atterra
      pallini.forEach((d) => {
        const a = gsap.utils.random(-Math.PI, 0)
        const r = gsap.utils.random(W * 0.08, W * 0.26)
        tl.fromTo(
          d,
          { x: 0, y: 0, opacity: 1, scale: gsap.utils.random(0.7, 1.3) },
          { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.9 + r * 0.45, opacity: 0, duration: 1.1, ease: 'power3.out', immediateRender: false },
          cade + 0.36,
        )
      })

      // schiaccia leggermente a ogni atterraggio
      const schiaccia = (t: number) =>
        tl.fromTo(
          monkey.current,
          { scaleY: 1, scaleX: 1 },
          { scaleY: 0.88, scaleX: 1.08, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.out', immediateRender: false },
          t,
        )
      schiaccia(cade + 0.4)

      // un salto con capriola da una lettera all'altra
      let t = cade + 1.05
      const salta = (dx: number, dy: number, durata: number) => {
        const x0 = gsap.getProperty(monkey.current, 'x') as number
        const su = durata * 0.45
        tl.to(monkey.current, { x: `+=${dx}`, duration: durata, ease: 'power1.inOut' }, t)
        tl.to(monkey.current, { y: `+=${dy - salto}`, duration: su, ease: 'power2.out' }, t)
        tl.to(monkey.current, { y: `+=${salto}`, duration: durata - su, ease: 'power2.in' }, t + su)
        tl.to(flip.current, { rotate: '-=360', duration: durata, ease: 'power1.inOut' }, t)
        schiaccia(t + durata)
        t += durata + 0.15
        return x0
      }
      salta(-555 * s, 25 * s, 0.7) // sulla M di "Monkey"
      salta(-570 * s, -42 * s, 0.8) // sulla M di "Mini"

      // festeggia
      tl.to(sway.current, { rotate: 8, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut', transformOrigin: '50% 100%' }, t)
      t += 0.6

      // sipario: il logo si abbassa e la pagina si scopre salendo
      tl.to(logo.current, { scale: 0.94, opacity: 0, duration: 0.6, ease: 'power2.in' }, t)
      tl.to(root.current, { yPercent: -100, duration: 0.95, ease: 'power3.inOut' }, t + 0.25)

      // solo in sviluppo: ?t=2.5 ferma l'animazione a quel secondo
      const q = import.meta.env.DEV ? new URLSearchParams(location.search).get('t') : null
      if (q) tl.pause(Number(q))
    }, root)
    return () => ctx.revert()
  }, [onDone])

  return (
    <div className="intro" ref={root} role="presentation">
      <div className="intro__logo" ref={logo}>
        <img className="intro__text" ref={text} src={import.meta.env.BASE_URL + 'logo/scritta.png'} alt="Mini Monkey Italy" />
        <img className="intro__stork" ref={stork} src={import.meta.env.BASE_URL + 'logo/cicogna.png'} alt="" />
        <div className="intro__monkey" ref={monkey}>
          <div className="intro__sway" ref={sway}>
            <div className="intro__flip" ref={flip}>
              <img src={import.meta.env.BASE_URL + 'logo/scimmia.png'} alt="" />
            </div>
          </div>
        </div>
        <div className="intro__dots" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <span className="intro__dot" key={i} style={{ background: COLORI[i % COLORI.length] }} />
          ))}
        </div>
      </div>
      <button className="intro__skip" onClick={onDone}>
        Salta
      </button>
    </div>
  )
}
