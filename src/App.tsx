import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Intro from './Intro'
import { useReveal } from './useReveal'
import { euro, prodotti, recensioni, SOGLIA_SPEDIZIONE, type Prodotto } from './dati'
import { Carrello, Grazie, PaginaProdotto, type Riga } from './Negozio'
import './negozio.css'

gsap.registerPlugin(ScrollTrigger)

const collezioni = [
  { nome: 'Babies', foto: 'bimba-cesta' },
  { nome: 'Collection', foto: 'vestitino-rosa' },
  { nome: 'Accessori', foto: 'clip-ciuccio' },
]

export default function App({ senzaIntro = false }: { senzaIntro?: boolean }) {
  const [intro, setIntro] = useState(!senzaIntro)
  const [righe, setRighe] = useState<Riga[]>([])
  const [carrelloAperto, setCarrelloAperto] = useState(false)
  const [regalo, setRegalo] = useState(false)
  const [aperto, setAperto] = useState<string | null>(null)
  const [grazie, setGrazie] = useState(false)
  const carrello = righe.reduce((t, r) => t + r.qta, 0)
  const arco = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLElement>(null)
  const done = useCallback(() => setIntro(false), [])
  useReveal(!intro)

  // blocca lo scroll durante l'intro
  useEffect(() => {
    document.body.style.overflow = intro ? 'hidden' : ''
  }, [intro])

  // leggero parallax sulla foto principale
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // il parallax conta solo lo scorrimento dentro la sezione (sotto la scena d'ingresso la pagina e' molto lunga)
        const sezione = arco.current?.closest('section')
        if (arco.current && sezione) {
          const scorso = Math.min(Math.max(0, -sezione.getBoundingClientRect().top), sezione.offsetHeight)
          arco.current.style.transform = `translateY(${scorso * 0.08}px)`
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // testo da sinistra, foto da destra: legati allo scroll (avanti e indietro)
  useEffect(() => {
    if (intro || !hero.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: hero.current, start: 'top 100%', end: 'top 45%', scrub: 0.6 },
      })
      tl.from('.hero__text > *', { x: -260, opacity: 0, stagger: 0.07, duration: 0.8 }, 0)
        .from('.hero__media', { x: 300, opacity: 0, duration: 1 }, 0)
        .from('.hero__mini', { x: 340, y: 50, rotation: 10, opacity: 0, duration: 1 }, 0.2)
    }, hero)
    return () => ctx.revert()
  }, [intro])

  const aggiungi = (p: Prodotto, taglia: string | null) => {
    setRighe((rs) => {
      const e = rs.find((r) => r.id === p.id && r.taglia === taglia)
      return e ? rs.map((r) => (r === e ? { ...r, qta: r.qta + 1 } : r)) : [...rs, { id: p.id, taglia, qta: 1 }]
    })
    setAperto(null)
    setCarrelloAperto(true)
  }
  const cambiaQta = (riga: Riga, delta: number) =>
    setRighe((rs) => rs.flatMap((r) => (r === riga ? (r.qta + delta > 0 ? [{ ...r, qta: r.qta + delta }] : []) : [r])))
  const apri = (id: string) => { setCarrelloAperto(false); setAperto(id) }
  const aggiungiRapido = (p: Prodotto) => (p.taglie ? apri(p.id) : aggiungi(p, null))

  return (
    <>
      {intro && <Intro onDone={done} />}

      <header className="nav">
        <a href="#top" aria-label="Mini Monkey">
          <img className="nav__logo" src={import.meta.env.BASE_URL + 'logo/scritta.png'} alt="Mini Monkey Italy" />
        </a>
        <nav>
          <a href="#collezioni">Collezioni</a>
          <a href="#prodotti">Prodotti</a>
          <a href="#storia">Il brand</a>
          <a href="#contatti">Contatti</a>
        </nav>
        <button className="nav__cart" onClick={() => setCarrelloAperto(true)} aria-label={`Carrello, ${carrello} articoli`}>
          Carrello <span key={carrello} className="nav__count">{carrello}</span>
        </button>
      </header>

      <main id="top" className={intro ? '' : 'ready'}>
        <section className="hero" ref={hero}>
          <div className="hero__text">
            <p className="eyebrow">Handmade · Organic · Made in Italy</p>
            <h2>Piccole cose,<br /><em>fatte con cura</em></h2>
            <p className="lead">Abbigliamento, nursery e regali per i più piccoli, lavorati a mano in Italia con fibre naturali.</p>
            <a className="btn" href="#prodotti">Scopri la collezione</a>
          </div>
          <div className="hero__media">
            <div className="hero__arco" ref={arco}>
              <img src={import.meta.env.BASE_URL + 'foto/bimba-pelliccia.jpg'} alt="Neonata con cappellino e completo all'uncinetto bianco" />
            </div>
            <img className="hero__mini" src={import.meta.env.BASE_URL + 'foto/completo-azzurro.jpg'} alt="Completo azzurro con volant" />
          </div>
        </section>

        <div className="nastro" aria-hidden="true">
          <div className="nastro__riga">
            {Array.from({ length: 2 }, (_, k) => (
              <span key={k}>Handmade ✦ Made in Italy ✦ Cotone organico ✦ Per i primi anni ✦ Handmade ✦ Made in Italy ✦ Cotone organico ✦ Per i primi anni ✦ </span>
            ))}
          </div>
        </div>

        <section id="collezioni" className="section">
          <h3 className="reveal">Collezioni</h3>
          <div className="cols">
            {collezioni.map((c, i) => (
              <a className="collezione reveal" style={{ '--i': i } as React.CSSProperties} href="#prodotti" key={c.nome}>
                <img src={`${import.meta.env.BASE_URL}foto/${c.foto}.jpg`} alt="" loading="lazy" />
                <span>{c.nome}</span>
              </a>
            ))}
          </div>
        </section>

        <section id="prodotti" className="section">
          <h3 className="reveal">I nostri prodotti</h3>
          <div className="grid">
            {prodotti.map((p, i) => (
              <article className="card reveal" style={{ '--i': i % 3 } as React.CSSProperties} key={p.id}>
                <div className="card__img">
                  <button className="card__apri" onClick={() => apri(p.id)} aria-label={`Apri ${p.nome}`}>
                    <img src={`${import.meta.env.BASE_URL}foto/${p.foto}.jpg`} alt={p.nome} loading="lazy" />
                  </button>
                  {(p.novita || p.rimasti) && <span className="card__tag">{p.rimasti ? `Ultimi ${p.rimasti}` : 'Novità'}</span>}
                  <button className="card__add" onClick={() => aggiungiRapido(p)}>{p.taglie ? 'Scegli la taglia' : 'Aggiungi'}</button>
                </div>
                <h4>{p.nome}</h4>
                <p>€ {euro(p.prezzo)}</p>
              </article>
            ))}
          </div>
          <p className="nota reveal">Prodotti e prezzi di esempio, solo per la dimostrazione.</p>
        </section>

        <section className="fiducia reveal" aria-label="I nostri impegni">
          <div><b>✦</b><h4>Fatto a mano</h4><p>Ogni pezzo è lavorato punto dopo punto</p></div>
          <div><b>✦</b><h4>Spedizione gratuita</h4><p>Da € {SOGLIA_SPEDIZIONE} in tutta Italia</p></div>
          <div><b>✦</b><h4>Confezione regalo</h4><p>Con bigliettino scritto a mano</p></div>
          <div><b>✦</b><h4>Reso gratuito</h4><p>Entro 14 giorni, senza pensieri</p></div>
        </section>

        <section id="storia" className="storia">
          <div className="storia__img reveal">
            <img src={import.meta.env.BASE_URL + 'foto/bimba-specchio.jpg'} alt="" loading="lazy" />
          </div>
          <div className="storia__testo reveal">
            <h3>Il brand</h3>
            <p>Mini Monkey nasce dall'amore per i dettagli: fibre naturali, lavorazioni a mano e tanta pazienza. Ogni capo è pensato per accompagnare i primi anni dei bambini.</p>
            <ul>
              <li><strong>Fatto a mano</strong> punto dopo punto</li>
              <li><strong>Fibre naturali</strong> morbide sulla pelle</li>
              <li><strong>Made in Italy</strong> dal filo al fiocco</li>
            </ul>
          </div>
        </section>

        <section className="recensioni">
          <h3 className="reveal">Dicono di noi</h3>
          <div className="recensioni__lista">
            {recensioni.map((r, i) => (
              <figure className="reveal" style={{ '--i': i } as React.CSSProperties} key={r.nome}>
                <div className="stelle" aria-label="5 stelle su 5">★★★★★</div>
                <blockquote>“{r.testo}”</blockquote>
                <figcaption>{r.nome}</figcaption>
              </figure>
            ))}
          </div>
          <p className="nota">Recensioni di esempio, solo per la dimostrazione.</p>
        </section>
      </main>

      <footer id="contatti" className="footer">
        <img className="footer__logo" src={import.meta.env.BASE_URL + 'logo/scritta.png'} alt="Mini Monkey Italy" />
        <p>Instagram: @minimonkey.italy</p>
        <p className="footer__small">Pagina dimostrativa: prodotti e prezzi sono di esempio.</p>
      </footer>

      <PaginaProdotto prodotto={prodotti.find((p) => p.id === aperto) ?? null} onChiudi={() => setAperto(null)} onAggiungi={aggiungi} onApri={setAperto} />
      <Carrello aperto={carrelloAperto} righe={righe} regalo={regalo} onRegalo={setRegalo} onQta={cambiaQta} onChiudi={() => setCarrelloAperto(false)} onOrdina={() => { setCarrelloAperto(false); setGrazie(true) }} onApri={apri} />
      <Grazie aperto={grazie} onChiudi={() => setGrazie(false)} />

    </>
  )
}
