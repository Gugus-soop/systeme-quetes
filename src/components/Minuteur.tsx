// Minuteurs : compte à rebours simple (repos, gainage) et cycles (fractionné, EMOM).
import { useEffect, useRef, useState } from 'react'
import { formatDuree } from '../lib/date'
import { useStore } from '../lib/store'
import { jouer, vibrer } from '../lib/sons'
import { Bouton } from './Panneau'

/** Compte à rebours basé sur l'heure réelle (reste juste même si l'écran se met en veille). */
export function CompteARebours({ secondes, titre, onFini, onPasser, couleur = 'text-bleu' }: { secondes: number; titre: string; onFini: () => void; onPasser?: () => void; couleur?: string }) {
  const { etat } = useStore()
  const [fin, setFin] = useState(() => Date.now() + secondes * 1000)
  const [maintenant, setMaintenant] = useState(Date.now())
  const dernierBip = useRef(-1)
  const fini = useRef(false)
  const reste = Math.max(0, (fin - maintenant) / 1000)

  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const s = Math.ceil(reste)
    if (s <= 3 && s > 0 && s !== dernierBip.current) {
      dernierBip.current = s
      jouer('bip', etat.reglages.sons)
    }
    if (reste <= 0 && !fini.current) {
      fini.current = true
      jouer('bipFort', etat.reglages.sons)
      vibrer([200, 100, 200], etat.reglages.vibrations)
      onFini()
    }
  }, [reste, etat.reglages, onFini])

  const pct = Math.min(1, 1 - reste / secondes)
  return (
    <div className="text-center">
      <p className="font-titre text-xs tracking-[0.25em] text-doux">{titre}</p>
      <div className="relative mx-auto my-3 w-44 h-44">
        <svg viewBox="0 0 100 100" className={`w-full h-full -rotate-90 ${couleur}`}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e2b4a" strokeWidth="5" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={283} strokeDashoffset={283 * (1 - pct)} style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-titre text-4xl font-bold ${couleur} lueur`}>{formatDuree(reste)}</span>
      </div>
      <div className="flex gap-2 justify-center">
        <Bouton variante="contour" onClick={() => setFin((f) => f - 15000)}>-15 s</Bouton>
        <Bouton variante="contour" onClick={() => setFin((f) => f + 15000)}>+15 s</Bouton>
        {onPasser && <Bouton variante="contour" onClick={onPasser}>Passer</Bouton>}
      </div>
    </div>
  )
}

export interface Phase {
  libelle: string
  duree: number
  travail: boolean
}

/**
 * Minuteur à cycles qui gère tout seul les changements.
 * Fractionné : travail puis récup, N fois. EMOM : une phase de 60 s par minute.
 */
export function MinuteurCycles({ phases, onFini }: { phases: Phase[]; onFini: () => void }) {
  const { etat } = useStore()
  const [lance, setLance] = useState(false)
  const [pause, setPause] = useState<number | null>(null) // secondes écoulées au moment de la pause
  const [debut, setDebut] = useState(0)
  const [maintenant, setMaintenant] = useState(Date.now())
  const derniereCle = useRef('')
  const fini = useRef(false)
  const total = phases.reduce((s, p) => s + p.duree, 0)

  useEffect(() => {
    if (!lance || pause !== null) return
    const t = setInterval(() => setMaintenant(Date.now()), 200)
    return () => clearInterval(t)
  }, [lance, pause])

  const ecoule = pause !== null ? pause : lance ? Math.min(total, (maintenant - debut) / 1000) : 0
  let acc = 0
  let index = phases.length - 1
  for (let i = 0; i < phases.length; i++) {
    if (ecoule < acc + phases[i].duree) {
      index = i
      break
    }
    acc += phases[i].duree
    if (i === phases.length - 1) acc -= phases[i].duree
  }
  const phase = phases[index]
  const resteP = Math.max(0, acc + phase.duree - ecoule)
  const termine = lance && ecoule >= total

  // Bip fort + vibration à chaque changement de phase, petits bips 3-2-1.
  useEffect(() => {
    if (!lance || pause !== null) return
    if (termine) {
      if (!fini.current) {
        fini.current = true
        jouer('fin', etat.reglages.sons)
        vibrer([300, 100, 300, 100, 500], etat.reglages.vibrations)
        onFini()
      }
      return
    }
    const s = Math.ceil(resteP)
    const cle = `${index}-${s}`
    if (cle === derniereCle.current) return
    const nouvellePhase = !derniereCle.current.startsWith(`${index}-`)
    derniereCle.current = cle
    if (nouvellePhase && index > 0) {
      jouer('bipFort', etat.reglages.sons)
      vibrer(phase.travail ? [250] : [100, 80, 100], etat.reglages.vibrations)
    } else if (s <= 3 && s > 0) jouer('bip', etat.reglages.sons)
  }, [resteP, index, lance, pause, termine, phase, etat.reglages, onFini])

  const demarrer = () => {
    jouer('bipFort', etat.reglages.sons)
    vibrer(200, etat.reglages.vibrations)
    const t = Date.now()
    setDebut(t)
    setMaintenant(t)
    derniereCle.current = '0-'
    setLance(true)
  }
  const basculerPause = () => {
    if (pause === null) setPause(ecoule)
    else {
      const t = Date.now()
      setDebut(t - pause * 1000)
      setMaintenant(t)
      setPause(null)
    }
  }

  const couleur = phase.travail ? 'text-bleu' : 'text-violet'
  if (!lance) return <Bouton className="w-full" onClick={demarrer}>Lancer le minuteur</Bouton>
  if (termine) return <p className="font-titre text-or text-lg tracking-widest text-center">TERMINÉ</p>
  return (
    <div className="text-center">
      <p className="font-titre text-xs tracking-[0.25em] text-doux">{index + 1} / {phases.length}</p>
      <p className={`font-titre text-xl font-bold mt-2 ${couleur} lueur`}>{phase.libelle}</p>
      <p className={`font-titre text-6xl font-black my-4 ${couleur} lueur`}>{formatDuree(resteP)}</p>
      <p className="text-xs text-doux mb-3">Total restant : {formatDuree(total - ecoule)}</p>
      <Bouton variante="contour" className="w-full" onClick={basculerPause}>{pause === null ? 'Pause' : 'Reprendre'}</Bouton>
    </div>
  )
}
