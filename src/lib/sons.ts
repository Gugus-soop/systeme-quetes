// Effets sonores courts (générés, aucun fichier) et vibrations.

let ctx: AudioContext | null = null
const audio = () => {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Joue une note simple. */
function note(freq: number, debut: number, duree: number, type: OscillatorType = 'square', volume = 0.08) {
  const a = audio()
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, a.currentTime + debut)
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + debut + duree)
  osc.connect(gain).connect(a.destination)
  osc.start(a.currentTime + debut)
  osc.stop(a.currentTime + debut + duree + 0.02)
}

export type Son = 'valider' | 'niveau' | 'bip' | 'bipFort' | 'fin' | 'erreur'

export function jouer(son: Son, actif: boolean) {
  if (!actif) return
  try {
    switch (son) {
      case 'valider':
        note(880, 0, 0.08, 'triangle'); note(1320, 0.07, 0.12, 'triangle')
        break
      case 'bip':
        note(1000, 0, 0.12, 'sine', 0.12)
        break
      case 'bipFort':
        note(1400, 0, 0.25, 'square', 0.1)
        break
      case 'fin':
        note(660, 0, 0.15); note(880, 0.15, 0.15); note(1320, 0.3, 0.3)
        break
      case 'niveau':
        ;[523, 659, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.09, 0.25, 'sawtooth', 0.06))
        break
      case 'erreur':
        note(220, 0, 0.2, 'sawtooth', 0.08); note(160, 0.18, 0.3, 'sawtooth', 0.08)
        break
    }
  } catch {
    /* pas de son disponible : on ignore */
  }
}

export function vibrer(motif: number | number[], actif: boolean) {
  if (!actif) return
  try {
    navigator.vibrate?.(motif)
  } catch {
    /* pas de vibration sur cet appareil */
  }
}
