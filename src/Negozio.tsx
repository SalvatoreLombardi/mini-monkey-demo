import { useEffect, useRef, useState } from 'react'
import { euro, PREZZO_REGALO, prodotti, SOGLIA_SPEDIZIONE, type Prodotto } from './dati'

const foto = (n: string) => `${import.meta.env.BASE_URL}foto/${n}.jpg`

export type Riga = { id: string; taglia: string | null; qta: number }

// blocca lo scroll della pagina e chiude con ESC mentre un pannello e' aperto
function usePannello(aperto: boolean, chiudi: () => void) {
  useEffect(() => {
    if (!aperto) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && chiudi()
    window.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [aperto, chiudi])
}

/* ---------- carrello laterale ---------- */
export function Carrello({ aperto, righe, regalo, onRegalo, onQta, onChiudi, onOrdina, onApri }: {
  aperto: boolean
  righe: Riga[]
  regalo: boolean
  onRegalo: (v: boolean) => void
  onQta: (r: Riga, delta: number) => void
  onChiudi: () => void
  onOrdina: () => void
  onApri: (id: string) => void
}) {
  usePannello(aperto, onChiudi)
  const sub = righe.reduce((t, r) => t + (prodotti.find((p) => p.id === r.id)?.prezzo ?? 0) * r.qta, 0)
  const totale = sub + (regalo && righe.length ? PREZZO_REGALO : 0)
  const mancano = Math.max(0, SOGLIA_SPEDIZIONE - sub)
  const perc = Math.min(100, (sub / SOGLIA_SPEDIZIONE) * 100)

  return (
    <>
      <div className={`velo${aperto ? ' on' : ''}`} onClick={onChiudi} />
      <aside className={`carrello${aperto ? ' on' : ''}`} aria-hidden={!aperto} aria-label="Carrello">
        <header>
          <h3>Il tuo carrello</h3>
          <button className="chiudi" onClick={onChiudi} aria-label="Chiudi il carrello">×</button>
        </header>

        {righe.length === 0 ? (
          <div className="carrello__vuoto">
            <img src={import.meta.env.BASE_URL + 'logo/scimmia.png'} alt="" />
            <p>Il carrello è vuoto,<br />la scimmietta si annoia.</p>
            <button className="btn" onClick={() => { onChiudi(); document.getElementById('prodotti')?.scrollIntoView({ behavior: 'smooth' }) }}>Vai ai prodotti</button>
          </div>
        ) : (
          <>
            <div className="spedizione">
              <p>{mancano > 0 ? <>Ancora <strong>€ {euro(mancano)}</strong> per la spedizione gratuita</> : <><strong>Spedizione gratuita!</strong> La scimmietta ringrazia</>}</p>
              <div className="spedizione__barra"><span style={{ width: perc + '%' }} /></div>
            </div>

            <ul className="carrello__righe">
              {righe.map((r) => {
                const p = prodotti.find((x) => x.id === r.id)!
                return (
                  <li key={r.id + r.taglia}>
                    <button className="carrello__foto" onClick={() => { onChiudi(); onApri(p.id) }} aria-label={`Apri ${p.nome}`}>
                      <img src={foto(p.foto)} alt="" />
                    </button>
                    <div>
                      <h4>{p.nome}</h4>
                      {r.taglia && <small>Taglia {r.taglia}</small>}
                      <div className="qta">
                        <button onClick={() => onQta(r, -1)} aria-label="Diminuisci">−</button>
                        <span>{r.qta}</span>
                        <button onClick={() => onQta(r, 1)} aria-label="Aumenta">+</button>
                      </div>
                    </div>
                    <strong>€ {euro(p.prezzo * r.qta)}</strong>
                  </li>
                )
              })}
            </ul>

            <label className="regalo">
              <input type="checkbox" checked={regalo} onChange={(e) => onRegalo(e.target.checked)} />
              <span>Confezione regalo con bigliettino <em>(+ € {euro(PREZZO_REGALO)})</em></span>
            </label>

            <footer>
              <div className="totale"><span>Totale</span><strong>€ {euro(totale)}</strong></div>
              <button className="btn btn--pieno" onClick={onOrdina}>Procedi all'ordine</button>
              <small>Demo: nessun pagamento reale. Reso gratuito entro 14 giorni.</small>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}

/* ---------- pagina prodotto ---------- */
export function PaginaProdotto({ prodotto, onChiudi, onAggiungi, onApri }: {
  prodotto: Prodotto | null
  onChiudi: () => void
  onAggiungi: (p: Prodotto, taglia: string | null) => void
  onApri: (id: string) => void
}) {
  usePannello(!!prodotto, onChiudi)
  const [taglia, setTaglia] = useState<string | null>(null)
  const [errore, setErrore] = useState(false)
  const [attiva, setAttiva] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)
  const ultimo = useRef<Prodotto | null>(null)
  if (prodotto) ultimo.current = prodotto
  const p = ultimo.current // resta visibile durante l'animazione di chiusura

  useEffect(() => {
    setTaglia(null)
    setErrore(false)
    setAttiva(0)
    scroller.current?.scrollTo({ top: 0 })
  }, [prodotto?.id])

  if (!p) return null
  const foto_ = [p.foto, ...(p.extra ?? [])]
  const simili = prodotti.filter((x) => x.id !== p.id).slice(0, 3)

  const aggiungi = () => {
    if (p.taglie && !taglia) return setErrore(true)
    onAggiungi(p, taglia)
  }

  return (
    <div className={`pp${prodotto ? ' on' : ''}`} role="dialog" aria-modal="true" aria-label={p.nome} aria-hidden={!prodotto} ref={scroller}>
      <button className="pp__indietro" onClick={onChiudi}>← Torna al negozio</button>
      <div className="pp__corpo">
        <div className="pp__gal">
          <div className="pp__grande"><img src={foto(foto_[attiva])} alt={p.nome} /></div>
          {foto_.length > 1 && (
            <div className="pp__mini">
              {foto_.map((f, i) => (
                <button key={f} className={i === attiva ? 'on' : ''} onClick={() => setAttiva(i)} aria-label={`Foto ${i + 1}`}>
                  <img src={foto(f)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pp__info">
          <p className="eyebrow">Fatto a mano in Italia</p>
          <h2>{p.nome}</h2>
          <p className="pp__prezzo">€ {euro(p.prezzo)}</p>
          {p.rimasti && <p className="pp__rimasti">● Ultimi {p.rimasti} pezzi disponibili</p>}
          <p>{p.descrizione}</p>

          {p.taglie && (
            <div className={`pp__taglie${errore ? ' errore' : ''}`}>
              <p>Taglia {errore && <em>— scegline una</em>}</p>
              <div>
                {p.taglie.map((t) => (
                  <button key={t} className={t === taglia ? 'on' : ''} onClick={() => { setTaglia(t); setErrore(false) }}>{t}</button>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn--pieno" onClick={aggiungi}>Aggiungi al carrello</button>

          <ul className="pp__punti">
            <li><strong>Materiali</strong> {p.materiali}</li>
            <li><strong>Cura</strong> Lavaggio a mano o in lavatrice a 30°, stendere in piano</li>
            <li><strong>Spedizione</strong> In 2-4 giorni lavorativi, gratuita da € {SOGLIA_SPEDIZIONE}</li>
            <li><strong>Reso</strong> Gratuito entro 14 giorni</li>
          </ul>
        </div>
      </div>

      <section className="pp__simili">
        <h3>Ti potrebbe piacere</h3>
        <div className="pp__simili-lista">
          {simili.map((s) => (
            <button key={s.id} onClick={() => onApri(s.id)}>
              <img src={foto(s.foto)} alt="" />
              <span>{s.nome}</span>
              <small>€ {euro(s.prezzo)}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ---------- pannello ordine (demo) ---------- */
export function Grazie({ aperto, onChiudi }: { aperto: boolean; onChiudi: () => void }) {
  usePannello(aperto, onChiudi)
  return (
    <div className={`grazie${aperto ? ' on' : ''}`} onClick={onChiudi} aria-hidden={!aperto}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ordine di prova">
        <img src={import.meta.env.BASE_URL + 'logo/scimmia.png'} alt="" />
        <h3>Grazie!</h3>
        <p>Qui partirebbe il pagamento. Questo è un sito dimostrativo: nessun ordine è stato inviato.</p>
        <button className="btn" onClick={onChiudi}>Continua a guardare</button>
      </div>
    </div>
  )
}
