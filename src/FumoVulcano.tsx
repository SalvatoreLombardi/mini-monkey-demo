// @ts-nocheck
import { useEffect, useRef } from 'react'

/* ============================================================================
   FUMO DEL VULCANO — adattato da effetti-riutilizzabili/fumo-nero (simulazione di fluido su GPU, WebGL2).
   Invece del dito, e' il cratere a spingere fumo scuro verso l'alto di continuo; il vento lo piega a sinistra.
   Il canvas sta dentro lo strato del vulcano: segue il vulcano mentre la scena scorre.
   Se WebGL2 non c'e' (o "riduci movimento"), restano i vecchi sbuffi in CSS.
   ========================================================================== */

const VERT = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
uniform vec2 texelSize;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const FRAG_TESTA = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`

const SHADER = {
  splat: `
uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
void main() {
  vec2 p = vUv - point; p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  o = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`,
  advezione: `
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  o = texture(uSource, coord) / (1.0 + dissipation * dt);
}`,
  divergenza: `
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x; float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y; float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
  rotore: `
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y; float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x; float B = texture(uVelocity, vB).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  vortici: `
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
void main() {
  float L = texture(uCurl, vL).x; float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x; float B = texture(uCurl, vB).x; float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * dt;
  o = vec4(min(max(vel, -1000.0), 1000.0), 0.0, 1.0);
}`,
  // il fumo caldo sale: dove c'è più fumo, la velocità verso l'alto cresce
  spinta: `
uniform sampler2D uVelocity; uniform sampler2D uDye; uniform float forza; uniform float dt;
void main() {
  vec2 vel = texture(uVelocity, vUv).xy;
  vel.y += texture(uDye, vUv).r * forza * dt;
  o = vec4(vel, 0.0, 1.0);
}`,
  pressione: `
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x;
  o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradiente: `
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x;
  vec2 vel = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(vel, 0.0, 1.0);
}`,
  azzera: `
uniform sampler2D uTexture; uniform float value;
void main() { o = value * texture(uTexture, vUv); }`,
  // fumo scuro bruno con trasparenza morbida (colore premoltiplicato)
  mostra: `
uniform sampler2D uTexture;
void main() {
  float d = texture(uTexture, vUv).r;
  float a = 1.0 - exp(-max(d - 0.02, 0.0) * 4.0); // sotto una soglia e' trasparente: niente velo grigio
  vec3 c = mix(vec3(0.42, 0.38, 0.35), vec3(0.2, 0.17, 0.16), clamp(d * 1.5, 0.0, 1.0));
  o = vec4(c * a, a);
}`,
}

export default function FumoVulcano() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
    if (!gl) return
    canvas.parentElement?.classList.add('gpu') // nasconde i vecchi sbuffi in CSS
    const coloreFloat = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')
    if (!coloreFloat) { canvas.parentElement?.classList.remove('gpu'); return }
    const telefono = window.matchMedia('(pointer: coarse)').matches

    const SIM = telefono ? 96 : 128
    const DYE = telefono ? 320 : 512
    const P = {
      densita: 0.9, // piu' alto = il fumo svanisce prima
      velocita: 1.1,
      pressione: 0.8,
      iterazioni: telefono ? 14 : 20,
      vortici: 10,
      raggio: 0.22, // grandezza della nuvola per ogni spinta (ridotta: meno massa di fumo)
      forza: 5200,
      spinta: 0.7,
      quantita: 0.36, // più alto = fumo più nero (circa un settimo della prima prova)
    }

    // ---- programmi
    const compila = (tipo, src) => {
      const s = gl.createShader(tipo)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
      return s
    }
    let programmi
    try {
      const vs = compila(gl.VERTEX_SHADER, VERT)
      programmi = Object.fromEntries(
        Object.entries(SHADER).map(([nome, corpo]) => {
          const pr = gl.createProgram()
          gl.attachShader(pr, vs)
          gl.attachShader(pr, compila(gl.FRAGMENT_SHADER, FRAG_TESTA + corpo))
          gl.bindAttribLocation(pr, 0, 'aPosition')
          gl.linkProgram(pr)
          if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr))
          const uniformi = {}
          const n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS)
          for (let i = 0; i < n; i++) {
            const nomeU = gl.getActiveUniform(pr, i).name
            uniformi[nomeU] = gl.getUniformLocation(pr, nomeU)
          }
          return [nome, { pr, u: uniformi }]
        }),
      )
    } catch {
      canvas.parentElement?.classList.remove('gpu')
      return // se gli shader non si compilano restano i vecchi sbuffi
    }

    // un quadrato che copre tutto lo schermo
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW)
    const idx = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(0)

    // ---- texture su cui si calcola (16 bit, bastano e girano ovunque)
    const nuovoFbo = (w, h, filtro) => {
      gl.activeTexture(gl.TEXTURE0)
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.viewport(0, 0, w, h)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      return { tex, fbo, w, h, texel: [1 / w, 1 / h], collega: (n) => (gl.activeTexture(gl.TEXTURE0 + n), gl.bindTexture(gl.TEXTURE_2D, tex), n) }
    }
    const doppio = (w, h, filtro) => {
      let a = nuovoFbo(w, h, filtro)
      let b = nuovoFbo(w, h, filtro)
      return { w, h, texel: a.texel, get leggi() { return a }, get scrivi() { return b }, scambia() { [a, b] = [b, a] } }
    }
    const dimensioni = (res) => {
      const ratio = gl.drawingBufferWidth / gl.drawingBufferHeight
      const r = ratio < 1 ? 1 / ratio : ratio
      const min = Math.round(res)
      const max = Math.round(res * r)
      return ratio > 1 ? [max, min] : [min, max]
    }

    let velocita, fumo, divergenza, rotore, pressione

    const misura = () => {
      const scala = telefono ? 0.5 : 0.6
      canvas.width = Math.max(Math.round(canvas.clientWidth * scala), 2)
      canvas.height = Math.max(Math.round(canvas.clientHeight * scala), 2)
      const [sw, sh] = dimensioni(SIM)
      const [dw, dh] = dimensioni(DYE)
      velocita = doppio(sw, sh, gl.LINEAR)
      fumo = doppio(dw, dh, gl.LINEAR)
      divergenza = nuovoFbo(sw, sh, gl.NEAREST)
      rotore = nuovoFbo(sw, sh, gl.NEAREST)
      pressione = doppio(sw, sh, gl.NEAREST)
    }
    misura()

    const disegnaA = (dest, w, h) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dest ? dest.fbo : null)
      gl.viewport(0, 0, w ?? dest.w, h ?? dest.h)
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
    }
    const usa = (nome, texel) => {
      const p = programmi[nome]
      gl.useProgram(p.pr)
      if (texel) gl.uniform2f(p.u.texelSize, texel[0], texel[1])
      return p.u
    }

    // ---- un passo della simulazione
    const passo = (dt) => {
      gl.disable(gl.BLEND)
      let u = usa('rotore', velocita.texel)
      gl.uniform1i(u.uVelocity, velocita.leggi.collega(0))
      disegnaA(rotore)

      u = usa('vortici', velocita.texel)
      gl.uniform1i(u.uVelocity, velocita.leggi.collega(0))
      gl.uniform1i(u.uCurl, rotore.collega(1))
      gl.uniform1f(u.curl, P.vortici)
      gl.uniform1f(u.dt, dt)
      disegnaA(velocita.scrivi)
      velocita.scambia()

      u = usa('spinta', velocita.texel)
      gl.uniform1i(u.uVelocity, velocita.leggi.collega(0))
      gl.uniform1i(u.uDye, fumo.leggi.collega(1))
      gl.uniform1f(u.forza, P.spinta)
      gl.uniform1f(u.dt, dt)
      disegnaA(velocita.scrivi)
      velocita.scambia()

      u = usa('divergenza', velocita.texel)
      gl.uniform1i(u.uVelocity, velocita.leggi.collega(0))
      disegnaA(divergenza)

      u = usa('azzera', pressione.texel)
      gl.uniform1i(u.uTexture, pressione.leggi.collega(0))
      gl.uniform1f(u.value, P.pressione)
      disegnaA(pressione.scrivi)
      pressione.scambia()

      u = usa('pressione', pressione.texel)
      gl.uniform1i(u.uDivergence, divergenza.collega(0))
      for (let i = 0; i < P.iterazioni; i++) {
        gl.uniform1i(u.uPressure, pressione.leggi.collega(1))
        disegnaA(pressione.scrivi)
        pressione.scambia()
      }

      u = usa('gradiente', velocita.texel)
      gl.uniform1i(u.uPressure, pressione.leggi.collega(0))
      gl.uniform1i(u.uVelocity, velocita.leggi.collega(1))
      disegnaA(velocita.scrivi)
      velocita.scambia()

      u = usa('advezione', velocita.texel)
      gl.uniform1i(u.uVelocity, velocita.leggi.collega(0))
      gl.uniform1i(u.uSource, velocita.leggi.collega(0))
      gl.uniform1f(u.dt, dt)
      gl.uniform1f(u.dissipation, P.velocita)
      disegnaA(velocita.scrivi)
      velocita.scambia()

      u = usa('advezione', fumo.texel)
      gl.uniform1i(u.uVelocity, velocita.leggi.collega(0))
      gl.uniform1i(u.uSource, fumo.leggi.collega(1))
      gl.uniform1f(u.dt, dt)
      gl.uniform1f(u.dissipation, P.densita)
      disegnaA(fumo.scrivi)
      fumo.scambia()
    }

    const mostra = () => {
      gl.clearColor(0, 0, 0, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.clear(gl.COLOR_BUFFER_BIT)
      const u = usa('mostra', [1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight])
      gl.uniform1i(u.uTexture, fumo.leggi.collega(0))
      disegnaA(null, gl.drawingBufferWidth, gl.drawingBufferHeight)
    }

    // ---- il dito (o il mouse) spinge l'aria e lascia fumo
    const spruzza = (x, y, dx, dy) => {
      const ratio = canvas.width / canvas.height
      const raggio = (P.raggio / 100) * (ratio > 1 ? ratio : 1)
      let u = usa('splat')
      gl.uniform1i(u.uTarget, velocita.leggi.collega(0))
      gl.uniform1f(u.aspectRatio, ratio)
      gl.uniform2f(u.point, x, y)
      gl.uniform3f(u.color, dx, dy, 0)
      gl.uniform1f(u.radius, raggio)
      disegnaA(velocita.scrivi)
      velocita.scambia()
      u = usa('splat')
      gl.uniform1i(u.uTarget, fumo.leggi.collega(0))
      gl.uniform3f(u.color, P.quantita, 0, 0)
      disegnaA(fumo.scrivi)
      fumo.scambia()
    }

    // il cratere spinge fumo verso l'alto a ogni frame; il vento lo piega a sinistra
    let frame = 0
    let ultimoFrame = 0
    let visibile = true
    const giro = (ora) => {
      const dt = Math.min((ora - ultimoFrame) / 1000, 1 / 60)
      ultimoFrame = ora
      if (visibile && !document.hidden) {
        // uno sbuffo ogni ~1,6 s: per un attimo il cratere spinge fuori una nuvola tonda, poi si calma
        if (ora % 2200 < 160) spruzza(0.5, 0.06, -15 + (Math.random() - 0.5) * 40, 140 + Math.random() * 60)
        passo((dt || 1 / 60) * 0.45) // tutto a rallentatore
        mostra()
      }
      frame = requestAnimationFrame(giro)
    }
    ultimoFrame = performance.now()
    frame = requestAnimationFrame(giro)
    // niente calcoli quando il vulcano e' fuori dallo schermo
    const osserva = new IntersectionObserver(([e]) => { visibile = e.isIntersecting })
    osserva.observe(canvas)
    const suResize = () => {
      misura()
    }
    window.addEventListener('resize', suResize)

    return () => {
      cancelAnimationFrame(frame)
      osserva.disconnect()
      window.removeEventListener('resize', suResize)
    }
  }, [])

  return <canvas ref={ref} className="sc-fumo-gpu" aria-hidden="true" />
}
