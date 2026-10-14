// suoni della scena, generati dal codice (nessun file audio, nessuna licenza da gestire)

export type Suoni = {
  vento: (livello: number, durata: number) => void // 0 = fermo, 0.3 = forte
  giungla: (livello: number, durata: number) => void // 0 = spenta, 1 = vicina
  tonfo: () => void
  whoosh: () => void
  muto: (m: boolean) => void
  inPausa: (p: boolean) => void
  volume: (v: number) => void // 0..1, indipendente dal pulsante muto
}

type ACtor = typeof AudioContext

export function creaSuoni(): Suoni | null {
  const AC: ACtor | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: ACtor }).webkitAudioContext
  if (!AC) return null
  const ctx = new AC()
  const volGain = ctx.createGain()
  volGain.connect(ctx.destination)
  const master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(volGain)

  // rumore "marrone" (morbido, come il vento) e rumore bianco
  const rumore = (secondi: number, marrone: boolean) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * secondi, ctx.sampleRate)
    const d = buf.getChannelData(0)
    let ultimo = 0
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1
      if (marrone) {
        ultimo = (ultimo + 0.02 * w) / 1.02
        d[i] = ultimo * 3.5
      } else d[i] = w
    }
    return buf
  }
  const marrone = rumore(4, true)
  const bianco = rumore(1, false)
  const loop = (buf: AudioBuffer) => {
    const s = ctx.createBufferSource()
    s.buffer = buf
    s.loop = true
    s.start()
    return s
  }
  const ora = () => ctx.currentTime
  const verso = (p: AudioParam, v: number, durata: number) => p.setTargetAtTime(v, ora(), Math.max(0.05, durata / 3))

  // --- vento: rumore filtrato, con raffiche lente ---
  const ventoGain = ctx.createGain()
  ventoGain.gain.value = 0
  const ventoFiltro = ctx.createBiquadFilter()
  ventoFiltro.type = 'bandpass'
  ventoFiltro.frequency.value = 300
  ventoFiltro.Q.value = 0.4
  loop(marrone).connect(ventoFiltro)
  ventoFiltro.connect(ventoGain)
  ventoGain.connect(master)
  const raffica = ctx.createOscillator()
  const raffGain = ctx.createGain()
  raffica.frequency.value = 0.23
  raffGain.gain.value = 0.02
  raffica.connect(raffGain)
  raffGain.connect(ventoGain.gain)
  raffica.start()

  // --- giungla lontana: ronzio, grilli e uccelli ---
  const giunglaGain = ctx.createGain()
  giunglaGain.gain.value = 0
  const giunglaFiltro = ctx.createBiquadFilter()
  giunglaFiltro.type = 'lowpass'
  giunglaFiltro.frequency.value = 600
  giunglaFiltro.connect(giunglaGain)
  giunglaGain.connect(master)

  const ronzio = ctx.createBiquadFilter()
  ronzio.type = 'bandpass'
  ronzio.frequency.value = 260
  const ronzioGain = ctx.createGain()
  ronzioGain.gain.value = 0.35
  loop(marrone).connect(ronzio)
  ronzio.connect(ronzioGain)
  ronzioGain.connect(giunglaFiltro)

  const cinguetta = () => {
    const n = 2 + Math.floor(Math.random() * 3)
    const base = 1100 + Math.random() * 900
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null
    if (pan) pan.pan.value = Math.random() * 1.6 - 0.8
    for (let i = 0; i < n; i++) {
      const t = ora() + i * 0.13
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(base, t)
      o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.5), t + 0.09)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.03, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11)
      o.connect(g)
      if (pan) { g.connect(pan); pan.connect(giunglaFiltro) } else g.connect(giunglaFiltro)
      o.start(t)
      o.stop(t + 0.14)
    }
  }
  let uccelli = 0
  const avviaUccelli = () => {
    if (uccelli) return
    const prossimo = () => {
      cinguetta()
      uccelli = window.setTimeout(prossimo, 700 + Math.random() * 1800)
    }
    prossimo()
  }
  const fermaUccelli = () => {
    window.clearTimeout(uccelli)
    uccelli = 0
  }

  return {
    vento(livello, durata) {
      verso(ventoGain.gain, livello, durata)
      verso(ventoFiltro.frequency, 250 + livello * 1400, durata)
      verso(ventoFiltro.Q, 0.4 + livello * 0.5, durata)
    },
    giungla(livello, durata) {
      verso(giunglaGain.gain, livello * 0.9, durata)
      verso(giunglaFiltro.frequency, 500 + livello * 2800, durata)
      if (livello > 0) avviaUccelli()
      else fermaUccelli()
    },
    tonfo() {
      const t = ora()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.setValueAtTime(130, t)
      o.frequency.exponentialRampToValueAtTime(38, t + 0.3)
      g.gain.setValueAtTime(0.9, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      o.connect(g)
      g.connect(master)
      o.start(t)
      o.stop(t + 0.45)
      // colpo sordo e fruscio di foglie
      const colpo = ctx.createBufferSource()
      colpo.buffer = bianco
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 450
      const cg = ctx.createGain()
      cg.gain.setValueAtTime(0.6, t)
      cg.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      colpo.connect(lp)
      lp.connect(cg)
      cg.connect(master)
      colpo.start(t)
      colpo.stop(t + 0.25)
      const fr = ctx.createBufferSource()
      fr.buffer = bianco
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2600
      bp.Q.value = 0.8
      const fg = ctx.createGain()
      fg.gain.setValueAtTime(0.0001, t + 0.04)
      fg.gain.linearRampToValueAtTime(0.22, t + 0.1)
      fg.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      fr.connect(bp)
      bp.connect(fg)
      fg.connect(master)
      fr.start(t + 0.04)
      fr.stop(t + 0.6)
    },
    whoosh() {
      const t = ora()
      const s = ctx.createBufferSource()
      s.buffer = bianco
      s.loop = true
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.Q.value = 0.5
      bp.frequency.setValueAtTime(250, t)
      bp.frequency.exponentialRampToValueAtTime(900, t + 1.4)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.12, t + 0.5)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)
      s.connect(bp)
      bp.connect(g)
      g.connect(master)
      s.start(t)
      s.stop(t + 1.6)
    },
    muto(m) {
      master.gain.setTargetAtTime(m ? 0 : 0.9, ora(), 0.08)
    },
    volume(v) {
      volGain.gain.setTargetAtTime(Math.min(1, Math.max(0, v)), ora(), 0.12)
    },
    inPausa(p) {
      if (p) void ctx.suspend()
      else void ctx.resume()
    },
  }
}
