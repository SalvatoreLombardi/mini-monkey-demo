import { useCallback, useEffect, useRef, useState } from 'react'
import Intro from './Intro'
import { useReveal } from './useReveal'

const prodotti = [
  { nome: 'Vestitino rosa con volant', prezzo: '68,00', foto: 'vestitino-rosa' },
  { nome: 'Completo azzurro polvere', prezzo: '64,00', foto: 'completo-azzurro' },
  { nome: 'Completo rosa antico', prezzo: '62,00', foto: 'completo-rosa' },
  { nome: 'Cappellino alle fragole', prezzo: '32,00', foto: 'cappellino-fragola' },
  { nome: 'Clip ciuccio personalizzata', prezzo: '18,00', foto: 'clip-ciuccio' },
  { nome: 'Copertina in cotone', prezzo: '58,00', foto: 'coperta' },
]

const collezioni = [
  { nome: 'Babies', foto: 'bimba-cesta' },
  { nome: 'Collection', foto: 'vestitino-rosa' },
  { nome: 'Accessori', foto: 'clip-ciuccio' },
]

export default function App({ senzaIntro = false }: { senzaIntro?: boolean }) {
  const [intro, setIntro] = useState(!senzaIntro)
  const [carrello, setCarrello] = useState(0)
  const [avviso, setAvviso] = useState('')
  const timer = useRef<number>(0)
  const arco = useRef<HTMLDivElement>(null)
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

  const aggiungi = (nome: string) => {
    setCarrello((c) => c + 1)
    setAvviso(`${nome}: aggiunto (demo)`)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAvviso(''), 2200)
  }

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
        <button className="nav__cart" aria-label={`Carrello, ${carrello} articoli`}>
          Carrello <span key={carrello} className="nav__count">{carrello}</span>
        </button>
      </header>

      <main id="top" className={intro ? '' : 'ready'}>
        <section className="hero">
          <div className="hero__text">
            <p className="eyebrow rise" style={{ '--d': '0ms' } as React.CSSProperties}>Handmade · Organic · Made in Italy</p>
            <h2 className="rise" style={{ '--d': '90ms' } as React.CSSProperties}>Piccole cose,<br /><em>fatte con cura</em></h2>
            <p className="lead rise" style={{ '--d': '180ms' } as React.CSSProperties}>Abbigliamento, nursery e regali per i più piccoli, lavorati a mano in Italia con fibre naturali.</p>
            <a className="btn rise" style={{ '--d': '270ms' } as React.CSSProperties} href="#prodotti">Scopri la collezione</a>
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
              <article className="card reveal" style={{ '--i': i % 3 } as React.CSSProperties} key={p.nome}>
                <div className="card__img">
                  <img src={`${import.meta.env.BASE_URL}foto/${p.foto}.jpg`} alt={p.nome} loading="lazy" />
                  <button className="card__add" onClick={() => aggiungi(p.nome)}>Aggiungi</button>
                </div>
                <h4>{p.nome}</h4>
                <p>€ {p.prezzo}</p>
              </article>
            ))}
          </div>
          <p className="nota reveal">Prodotti e prezzi di esempio, solo per la dimostrazione.</p>
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
      </main>

      <footer id="contatti" className="footer">
        <img className="footer__logo" src={import.meta.env.BASE_URL + 'logo/scritta.png'} alt="Mini Monkey Italy" />
        <p>Instagram: @minimonkey.italy</p>
        <p className="footer__small">Pagina dimostrativa: prodotti e prezzi sono di esempio.</p>
      </footer>

      <div className={`toast${avviso ? ' on' : ''}`} role="status">{avviso}</div>
    </>
  )
}
