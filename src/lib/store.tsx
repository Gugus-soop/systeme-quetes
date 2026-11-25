/**
 * État global de l'app : chargé depuis le téléphone, sauvegardé à chaque changement.
 * `agir(fn)` applique une règle du moteur et affiche les événements produits.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cleJour } from './date'
import { passageMinuit, verifierTitres } from './moteur'
import { jouer, vibrer } from './sons'
import { charger, sauver } from './stockage'
import type { Etat, Evenement } from './types'

interface Store {
  etat: Etat
  aujourdhui: string
  agir: (f: (e: Etat, ev: Evenement[]) => void) => void
  remplacer: (e: Etat) => void
  evenements: Evenement[]
  fermerEvenement: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Etat>(charger())
  const [etat, setEtat] = useState<Etat>(ref.current)
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [aujourdhui, setAujourdhui] = useState(cleJour())

  const agir = useCallback((f: (e: Etat, ev: Evenement[]) => void) => {
    const copie = structuredClone(ref.current)
    const ev: Evenement[] = []
    f(copie, ev)
    ref.current = copie
    setEtat(copie)
    sauver(copie)
    if (ev.length) {
      const r = copie.reglages
      if (ev.some((x) => x.kind === 'niveau')) {
        jouer('niveau', r.sons)
        vibrer([120, 60, 120, 60, 300], r.vibrations)
      } else if (ev.some((x) => x.kind === 'message' && x.tone === 'danger')) jouer('erreur', r.sons)
      else jouer('fin', r.sons)
      setEvenements((l) => [...l, ...ev])
    }
  }, [])

  const remplacer = useCallback((e: Etat) => {
    ref.current = e
    setEtat(e)
    sauver(e)
  }, [])

  // Passage de minuit : à l'ouverture, toutes les minutes et au retour sur l'app.
  useEffect(() => {
    const verifier = () => {
      const j = cleJour()
      setAujourdhui(j)
      if (ref.current.dernierJour !== j || !ref.current.jours[j]) agir((e, ev) => { passageMinuit(e, j, ev); verifierTitres(e, ev) })
    }
    verifier()
    const t = setInterval(verifier, 60_000)
    document.addEventListener('visibilitychange', verifier)
    // Demande au navigateur de ne pas effacer les données.
    void navigator.storage?.persist?.()
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', verifier)
    }
  }, [agir])

  const fermerEvenement = useCallback(() => setEvenements((l) => l.slice(1)), [])

  return <Ctx.Provider value={{ etat, aujourdhui, agir, remplacer, evenements, fermerEvenement }}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider manquant')
  return s
}
