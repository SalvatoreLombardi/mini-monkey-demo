import { useEffect } from 'react'

/* Aggiunge .in agli elementi .reveal quando entrano nello schermo */
export function useReveal(attivo: boolean) {
  useEffect(() => {
    if (!attivo) return
    const els = document.querySelectorAll<HTMLElement>('.reveal')
    const io = new IntersectionObserver(
      (voci) => {
        voci.forEach((v) => {
          if (v.isIntersecting) {
            v.target.classList.add('in')
            io.unobserve(v.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [attivo])
}
