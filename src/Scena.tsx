import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import App from './App'
import { creaSuoni, type Suoni } from './suoni'
import './scena.css'

gsap.registerPlugin(ScrollTrigger)

const FOGLIE = ['#9bb36a', '#c3cf8a', '#e8c9c1', '#f1dfa0', '#7f9c5a', '#d9b3ab']
const BASE = import.meta.env.BASE_URL + 'scena/'

// schermata d'ingresso: serve un tocco per poter far partire l'audio (regola dei browser)
export default function Scena() {
  const [scelta, setScelta] = useState<{ suoni: Suoni | null } | null>(null)
  const [sito, setSito] = useState(false) // il sito compare sotto la scena quando l'ingresso e' finito

  useEffect(() => {
    if (sito) ScrollTrigger.refresh()
  }, [sito])

  useEffect(() => {
    if (!scelta) document.body.style.overflow = 'hidden'
  }, [scelta])

  if (!scelta) {
    return (
      <div className="sc-ingresso">
        <img src={import.meta.env.BASE_URL + 'logo/scritta.png'} alt="Mini Monkey" />
        <button className="sc-btn" onClick={() => setScelta({ suoni: creaSuoni() })}>Entra con l'audio</button>
        <button className="sc-btn-secondario" onClick={() => setScelta({ suoni: null })}>Entra senza audio</button>
      </div>
    )
  }
  return (
    <>
      <Palcoscenico suoni={scelta.suoni} onPronto={() => setSito(true)} />
      {sito && <App senzaIntro />}
    </>
  )
}

function Palcoscenico({ suoni, onPronto }: { suoni: Suoni | null; onPronto: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const suonoRef = useRef<Suoni | null>(suoni)
  const [audio, setAudio] = useState(suoni !== null)

  // il pulsante in alto a destra accende o spegne l'audio (anche se sei entrato senza)
  const commuta = () => {
    if (!suonoRef.current) {
      suonoRef.current = creaSuoni()
      suonoRef.current?.vento(0.05, 1)
      setAudio(true)
      return
    }
    suonoRef.current.muto(audio)
    setAudio(!audio)
  }

  // la scena riparte sempre dall'inizio, anche dopo un ricaricamento a meta' pagina
  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  // l'audio si ferma quando la scheda non e' visibile
  useEffect(() => {
    const f = () => suonoRef.current?.inPausa(document.hidden)
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])

  useEffect(() => {
    const el = root.current!
    const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s)!
    const qa = (s: string) => gsap.utils.toArray<HTMLElement>(s, el)
    const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let segui: (() => void) | null = null

    const ctx = gsap.context(() => {
      const stage = q('.sc-stage')
      const carrier = q('.sc-carrier')
      const beak = q('.sc-beak')
      const hang = q('.sc-hang')
      const stand = q('.sc-stand')
      const titolo = q('.sc-titolo')
      const foglie = qa('.sc-foglia')

      const W = () => stage.offsetWidth
      const H = () => stage.offsetHeight
      const terra = () => H() * 0.895 // dove poggiano i piedi della scimmietta

      // stato finale (usato anche con movimento ridotto)
      gsap.set(stand, { xPercent: -50, opacity: 0 })
      gsap.set(hang, { opacity: 0, transformOrigin: '68% 3.3%' })
      gsap.set(carrier, { xPercent: -50 })
      gsap.set(foglie, { opacity: 0 })
      const sale = qa('.sale')

      if (ridotto) {
        gsap.set(stand, { opacity: 1 })
        gsap.set(carrier, { opacity: 0 })
        gsap.set(titolo, { clipPath: 'inset(0 0% 0 0)' })
        return
      }

      // --- movimento continuo della scenografia ---
      const dolce = { ease: 'sine.inOut', repeat: -1, yoyo: true }
      gsap.to('.sc-alberi .idle', { rotation: 0.5, transformOrigin: '20% 100%', duration: 4.5, ...dolce })
      gsap.fromTo('.sc-giraffa .idle', { rotation: -1.1 }, { rotation: 1.1, transformOrigin: '50% 100%', duration: 3.8, ...dolce })
      gsap.fromTo('.sc-zebra .idle', { rotation: 0.7 }, { rotation: -0.7, transformOrigin: '50% 100%', duration: 3.1, ...dolce })
      gsap.fromTo('.sc-leone .idle', { rotation: -0.8 }, { rotation: 0.8, transformOrigin: '50% 100%', duration: 3.4, ...dolce })
      gsap.fromTo('.sc-elefante .idle', { rotation: 0.9 }, { rotation: -0.9, transformOrigin: '50% 100%', duration: 3.2, ...dolce })
      // l'erba davanti e' fatta di tre pezzi piccoli affiancati (quello centrale specchiato)
      qa('.sc-erba-davanti .idle').forEach((img, i) => {
        gsap.set(img, { scaleX: i % 2 === 1 ? -1 : 1 })
        gsap.fromTo(img, { skewX: 1 }, { skewX: -1, transformOrigin: '50% 100%', duration: 2.4 + i * 0.5, ...dolce })
      })
      gsap.fromTo('.sc-erba-dietro .idle', { skewX: -0.8 }, { skewX: 0.8, transformOrigin: '50% 100%', duration: 3.6, ...dolce })
      qa('.sc-nuvola').forEach((n, i) => {
        gsap.fromTo(n, { xPercent: -140 }, { xPercent: 140, duration: 70 + i * 25, ease: 'none', repeat: -1, delay: -i * 30 })
      })
      // il fumo esce dal cratere, si allarga, deriva di lato e si dissolve
      qa('.sc-sbuffo').forEach((p, i) => {
        const dx = (i % 2 ? 1 : -1) * (6 + i * 3)
        gsap.timeline({ repeat: -1, delay: i * 0.9 })
          .fromTo(p, { y: 0, x: 0, scale: 0.35 }, { y: () => -H() * 0.2, x: dx, scale: 1.9, duration: 4.5, ease: 'sine.out' })
          .fromTo(p, { opacity: 0 }, { opacity: 0.85, duration: 0.8, ease: 'none' }, 0)
          .to(p, { opacity: 0, duration: 2, ease: 'none' }, 2.5)
      })

      // --- la scimmietta appesa segue il becco finche' e' attaccata ---
      let attaccata = true
      segui = () => {
        if (!attaccata) return
        const b = beak.getBoundingClientRect()
        const s = stage.getBoundingClientRect()
        gsap.set(hang, {
          x: b.left - s.left - 0.68 * hang.offsetWidth,
          y: b.top - s.top - 0.033 * hang.offsetHeight,
        })
      }
      gsap.ticker.add(segui)
      const seguiAttivo = segui

      const S = () => suonoRef.current
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.call(() => S()?.vento(0.07, 1.5), [], 0) // vento leggero
      gsap.set(titolo, { clipPath: 'inset(0 100% 0 0)' })
      gsap.set(sale, { y: () => H() * 1.2 })
      gsap.set('.sc-vulcano', { y: () => H() * 0.8 })
      gsap.set('.sc-terra', { y: () => H() * 1.2 })
      gsap.set(hang, { opacity: 1 })

      // la cicogna attraversa il cielo in linea retta; dopo aver lasciato la scimmietta
      // accelera e sparisce a destra molto prima che la scenografia sia visibile
      const larg = W()
      const cw = carrier.offsetWidth
      const xIni = -(larg / 2 + cw)
      const xFin = larg / 2 + cw
      // la scimmietta viene lasciata esattamente sopra il punto in cui atterra, cosi' cade dritta
      const xAtterra = larg / 2 - 0.07 * window.innerWidth
      const xRil = xAtterra + 0.13 * 0.22 * cw - larg / 2 - 0.4935 * cw
      const quota1 = (xRil - xIni) / (xFin - xIni) // quota di percorso fatta prima del rilascio
      const d1 = 2.2
      const d2 = 1.6
      const volo = d1 + d2
      const b = d1 / volo
      const a = (quota1 / b) * (1 - b) / (1 - quota1) // raccorda la velocita' prima e dopo
      const rotta = (t: number) => t < b
        ? (t / b) * quota1
        : quota1 + (1 - quota1) * (a * ((t - b) / (1 - b)) + (1 - a) * ((t - b) / (1 - b)) ** 2)
      tl.fromTo(carrier, { x: xIni }, { x: xFin, duration: volo, ease: rotta }, 0.3)

      const ali = gsap.to(carrier, { y: 10, rotation: -2, transformOrigin: '60% 70%', duration: 0.5, ...dolce })
      const dondolo = gsap.fromTo(hang, { rotation: -9 }, { rotation: 9, duration: 0.9, ...dolce })

      // si ferma un attimo nel cielo vuoto, poi lascia andare la scimmietta
      const cade = 0.3 + d1
      const caduta = 3.9 // dal rilascio all'atterraggio
      tl.call(() => {
        attaccata = false
        dondolo.kill()
        gsap.set(hang, { zIndex: 6 })
        S()?.vento(0.32, 1.6) // la discesa: vento forte
        // parte dalla posizione attuale, quindi e' sempre fluida
        const cad = gsap.timeline()
        cad.fromTo(hang, { rotation: -6 }, { rotation: 6, duration: 0.8, ...dolce }, 0)
        // prima cade nel cielo e resta a mezz'aria mentre le nuvole salgono (effetto discesa)
        cad.to(hang, { x: W() / 2 - 0.07 * window.innerWidth - 0.55 * hang.offsetWidth, y: H() * 0.36, duration: 1.1, ease: 'power2.out' }, 0)
        // poi, quando la scenografia sale, scende verso terra
        cad.to(hang, {
          y: terra() - hang.offsetHeight, duration: 1.5, ease: 'power2.in',
        }, 2.3)
        cad.call(() => { gsap.killTweensOf(hang, 'rotation'); gsap.set(hang, { rotation: 0 }) }, [], caduta - 0.05)
      }, [], cade)

      // nuvole che salgono veloci: lo sguardo segue la scimmietta che cade
      const rush = qa('.sc-rush')
      rush.forEach((n, i) => {
        tl.fromTo(n, { y: 0 }, { y: () => -H() * 1.9, duration: 1.7 + (i % 3) * 0.5, ease: 'none', immediateRender: false }, cade + 0.1 + i * 0.2)
      })
      tl.to('.sc-nuvola', { y: () => -H() * 0.7, duration: 2.4, ease: 'power1.in' }, cade)

      tl.call(() => S()?.whoosh(), [], cade + 0.1)
      tl.call(() => { S()?.giungla(0.35, 2.8); S()?.vento(0.14, 2.5) }, [], cade + 2.0) // la giungla arriva da lontano

      // quando sta per arrivare a terra, la scenografia sale da sotto lo schermo
      // tutta la scenografia sale da sotto insieme, nello stesso istante
      tl.to([...sale, ...qa('.sc-terra'), ...qa('.sc-vulcano')], { y: 0, duration: 1.4, ease: 'power3.out' }, cade + 2.0)
      tl.to('.sc-foschia', { opacity: 0.25, duration: 2, ease: 'power1.inOut' }, cade + 2.0)

      // atterraggio: cambia posa, schiaccia, rimbalza, foglie
      const giu = cade + caduta
      tl.set(hang, { opacity: 0 }, giu)
      tl.call(() => { S()?.tonfo(); S()?.vento(0.04, 2.5); S()?.giungla(1, 2) }, [], giu) // il tonfo
      tl.fromTo(stand, { opacity: 1, scaleY: 0.78, scaleX: 1.12, transformOrigin: '50% 100%' },
        { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)', immediateRender: false }, giu)
      tl.fromTo(foglie, { opacity: 1, x: 0, y: 0, scale: 0.4 }, {
        x: () => gsap.utils.random(-W() * 0.13, W() * 0.13),
        y: () => gsap.utils.random(-H() * 0.28, -H() * 0.08),
        rotation: () => gsap.utils.random(-200, 200),
        scale: () => gsap.utils.random(0.7, 1.3),
        duration: 0.9, ease: 'power3.out', immediateRender: false,
      }, giu)
      tl.to(foglie, { opacity: 0, y: '+=40', duration: 0.7, ease: 'power1.in' }, giu + 0.7)

      // fuori dallo schermo la cicogna sparisce
      tl.call(() => { ali.kill(); gsap.ticker.remove(seguiAttivo) }, [], 0.3 + volo)

      // la scritta compare a mano libera
      tl.to(titolo, { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'power2.inOut' }, giu + 0.4)
      tl.fromTo('.sc-scorri', { opacity: 0 }, { opacity: 1, duration: 0.8, immediateRender: false }, giu + 1.6)

      // la scimmietta resta viva: respira, inclina la testa, ogni tanto salta
      tl.call(() => {
        gsap.to('.sc-stand .idle', { scaleY: 1.014, transformOrigin: '50% 100%', duration: 1.4, ...dolce })
        gsap.to('.sc-stand .idle', { rotation: 2, transformOrigin: '50% 100%', duration: 2.6, ...dolce })
        gsap.timeline({ repeat: -1, repeatDelay: 2.6 })
          .to(stand, { y: -H() * 0.05, duration: 0.28, ease: 'power2.out' })
          .to(stand, { y: 0, duration: 0.34, ease: 'bounce.out' })
          .to(stand, { y: -H() * 0.03, duration: 0.2, ease: 'power2.out' })
          .to(stand, { y: 0, duration: 0.28, ease: 'bounce.out' })
      }, [], giu + 0.8)

      // blocca lo scroll finche' la scena non e' pronta
      document.body.style.overflow = 'hidden'
      tl.call(() => { document.body.style.overflow = ''; onPronto() }, [], giu + 1.2)
      tl.eventCallback('onComplete', () => ScrollTrigger.refresh())

      // solo in sviluppo: ?t=SECONDI per fermare la scena a un istante preciso
      const t = new URLSearchParams(window.location.search).get('t')
      if (import.meta.env.DEV && t !== null) {
        tl.pause(Number(t), false)
        document.body.style.overflow = ''
      }

      // --- scorrimento: la scenografia si apre e lascia spazio al sito; l'audio si spegne ---
      const sc = {
        trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: (self: ScrollTrigger) => {
          S()?.volume(1 - Math.min(1, self.progress / 0.55))
          // tornando indietro i tre amici si girano a sinistra; andando avanti, o arrivati in fondo, guardano a destra
          const lato = self.direction === -1 && self.progress < 0.84 ? 180 : 0
          if (self.direction !== 0 && lato !== girati) {
            girati = lato
            // saltino con giravolta: nel punto piu' alto il verso cambia di colpo, poi atterrano con un piccolo schiacciamento
            const verso = lato ? -1 : 1
            ;['.sc-stand', '.sc-elefante', '.sc-giraffa'].forEach((sel, i) => {
              gsap.timeline({ delay: i * 0.1 })
                .set(sel, { transformOrigin: '50% 100%' })
                .to(sel, { yPercent: -9, scaleY: 1.04, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
                .set(sel, { scaleX: verso, zIndex: sel === '.sc-elefante' && lato ? 7 : '' })
                .to(sel, { yPercent: 0, scaleY: 1, duration: 0.2, ease: 'power2.in' })
                .to(sel, { scaleY: 0.93, duration: 0.07, ease: 'power1.out' })
                .to(sel, { scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
            })
          }
          stage.classList.add('cammina')
          window.clearTimeout(fermo)
          fermo = window.setTimeout(() => stage.classList.remove('cammina'), 160)
        },
      }
      let girati = 0
      const pan = () => window.innerWidth
      // di quanto spostare un animale per farlo fermare accanto alla scimmietta, che a fine corsa sta al centro (distanza in altezze di schermo)
      // in verticale (telefono) la distanza si misura in larghezze di schermo, cosi' nessuno esce dallo schermo
      const verso = (sel: string, distanza: number, distanzaVert: number) => {
        const e = q(sel)
        const centro = e.offsetLeft + e.offsetWidth / 2
        const d = W() < H() ? distanzaVert * W() : distanza * H()
        return W() / 2 + d - centro
      }
      let fermo = 0
      const scrub = gsap.timeline({ scrollTrigger: sc, defaults: { ease: 'none' } })
      scrub
        // il cielo vira al tramonto mentre si cammina
        .to('.sc-tramonto', { opacity: 1, duration: 4 }, 0)
        .to('.sc-titolo', { opacity: 0, yPercent: -30, duration: 2 }, 0)
        .to('.sc-scorri', { opacity: 0, duration: 1 }, 0)
        // la scimmietta cammina verso destra: resta al suo posto e il paesaggio scorre a sinistra
        .to('.sc-nuvole', { x: () => -pan() * 0.25, duration: 7 }, 1)
        .to(['.sc-alberi', '.sc-vulcano', '.sc-erba-dietro', '.sc-terra', '.sc-home'], { x: () => -pan(), duration: 7 }, 1)
        // la scimmietta cammina fino al centro della scena, sotto il bottone
        .to('.sc-personaggio', { x: () => 0.07 * window.innerWidth, duration: 7 }, 1)
        // giraffa ed elefante seguono la scimmietta invece di restare indietro
        .to('.sc-giraffa', { x: () => verso('.sc-giraffa', -0.34, -0.36), duration: 7 }, 1)
        .to('.sc-elefante', { x: () => verso('.sc-elefante', -0.13, -0.2), duration: 7 }, 1)
        // leone e zebra entrano da destra e vanno verso la scimmietta, poi si fermano
        .to('.sc-leone', { x: () => verso('.sc-leone', 0.15, 0.2), duration: 7 }, 1)
        .to('.sc-zebra', { x: () => verso('.sc-zebra', 0.3, 0.37), duration: 7 }, 1)
        // pausa finale: tutti fermi al centro prima che arrivi il sito
        .to({}, { duration: 1.6 }, 8)
        .to('.sc-erba-davanti', { x: () => -pan() * 1.3, duration: 7 }, 1)
        .fromTo('.sc-home', { opacity: 0 }, { opacity: 1, duration: 2.5, ease: 'power1.out', immediateRender: false }, 3.5)
    }, el)

    return () => {
      if (segui) gsap.ticker.remove(segui)
      ctx.revert()
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="sc" ref={root}>
      <div className="sc-stage" aria-label="Mini Monkey: la cicogna lascia cadere la scimmietta nella giungla">
        <div className="sc-cielo" />
        <div className="sc-tramonto" />
        <div className="sc-foschia" />
        <div className="sc-crema" />
        <div className="sc-nuvole sc-lyr">
          <i className="sc-nuvola" style={{ top: '10%', width: '26vw' }} />
          <i className="sc-nuvola" style={{ top: '24%', width: '18vw' }} />
          <i className="sc-nuvola" style={{ top: '5%', width: '22vw' }} />
        </div>

        {[8, 52, 24, 70, 40, 84, 14, 60, 32].map((x, i) => (
          <i key={i} className="sc-rush" style={{ left: x + '%', width: 13 + (i % 4) * 5 + 'vw' }} />
        ))}

        <div className="sc-vulcano sc-lyr">
          <img className="idle" src={BASE + 'vulcano.webp'} alt="" />
          {[0, 1, 2, 3, 4].map((i) => <i key={i} className="sc-sbuffo" />)}
        </div>
        <div className="sc-alberi sc-lyr sale"><img className="idle" src={BASE + 'alberi.webp'} alt="" /></div>
        <div className="sc-terra" />
        <div className="sc-erba-dietro sc-lyr sale">
          {[0, 1].map((i) => <img key={i} className="idle" src={BASE + 'erba.webp'} alt="" />)}
        </div>
        <div className="sc-giraffa sc-lyr sale"><img className="idle" src={BASE + 'giraffa.webp'} alt="" /></div>
        <div className="sc-zebra sc-lyr sale"><img className="idle" src={BASE + 'zebra.webp'} alt="" /></div>
        <div className="sc-leone sc-lyr sale"><img className="idle" src={BASE + 'leone.webp'} alt="" /></div>
        <div className="sc-elefante sc-lyr sale"><img className="idle" src={BASE + 'elefante.webp'} alt="" /></div>

        <div className="sc-personaggio">
          <div className="sc-stand"><img className="idle" src={BASE + 'piedi.webp'} alt="" /></div>
        </div>
        <img className="sc-hang" src={BASE + 'appesa.webp'} alt="" />
        {FOGLIE.concat(FOGLIE).map((c, i) => <i key={i} className="sc-foglia" style={{ background: c }} />)}


        <div className="sc-erba-davanti sc-lyr sale">
          {[0, 1, 2, 3, 4, 5].map((i) => <img key={i} className="idle" src={BASE + 'erba.webp'} alt="" />)}
        </div>

        <div className="sc-carrier">
          <img src={BASE + 'cicogna.webp'} alt="" />
          <i className="sc-beak" />
        </div>

        <img className="sc-titolo" src={import.meta.env.BASE_URL + 'logo/scritta.png'} alt="Mini Monkey" />
        <div className="sc-scorri" aria-hidden="true">scorri<span /></div>
        <div className="sc-home">
          <img src={import.meta.env.BASE_URL + 'logo/scritta-trasp.png'} alt="Mini Monkey" />
          <p>Abbigliamento per bambini, fatto a mano in Italia</p>
          <button className="sc-btn" onClick={() => document.getElementById('collezioni')?.scrollIntoView({ behavior: 'smooth' })}>Scopri la collezione</button>
        </div>
      </div>
      <button className="sc-audio" onClick={commuta} aria-label={audio ? 'Spegni l\'audio' : 'Accendi l\'audio'}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          {audio ? <><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" /></> : <path d="M17 9l5 6M22 9l-5 6" />}
        </svg>
      </button>
    </div>
  )
}
