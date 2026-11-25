// Affiche les événements du Système : fenêtres et montée de niveau plein écran.
import { useEffect } from 'react'
import { rangDuNiveau } from '../config/progression'
import { useStore } from '../lib/store'
import { Bouton, Panneau } from './Panneau'

export function Superposition() {
  const { evenements, fermerEvenement } = useStore()
  const ev = evenements[0]

  // Les petits messages se ferment seuls après quelques secondes.
  useEffect(() => {
    if (!ev || ev.kind !== 'message') return
    const t = setTimeout(fermerEvenement, ev.tone === 'danger' ? 6000 : 3500)
    return () => clearTimeout(t)
  }, [ev, fermerEvenement])

  if (!ev) return null

  if (ev.kind === 'niveau') {
    const r = rangDuNiveau(ev.niveau)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-nuit/90 backdrop-blur-sm overflow-hidden" onClick={fermerEvenement}>
        <div className="rayons absolute w-[160vmax] h-[160vmax] opacity-30" style={{ background: 'repeating-conic-gradient(from 0deg, rgba(56,189,248,0.25) 0deg 6deg, transparent 6deg 18deg)' }} />
        <div className="relative text-center px-6 w-full max-w-sm">
          <p className="font-titre text-doux text-xs tracking-[0.4em] mb-4 apparition">[ NOTIFICATION DU SYSTÈME ]</p>
          <h1 className="montee font-titre text-3xl font-black text-bleu lueur">NIVEAU SUPÉRIEUR !</h1>
          <p className="montee font-titre text-7xl font-black mt-6 lueur-violet text-violet" style={{ animationDelay: '0.25s' }}>{ev.niveau}</p>
          {ev.rang && (
            <div className="apparition mt-8" style={{ animationDelay: '0.6s' }}>
              <p className="font-titre text-sm tracking-[0.3em] text-doux">NOUVEAU RANG ATTEINT</p>
              <p className="font-titre text-8xl font-black mt-2" style={{ color: r.couleur, textShadow: `0 0 30px ${r.couleur}` }}>{ev.rang}</p>
            </div>
          )}
          <Bouton className="mt-10 w-full" onClick={fermerEvenement}>Continuer</Bouton>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-0 right-0 top-0 z-40 p-4 pt-[max(1rem,env(safe-area-inset-top))] max-w-md mx-auto" onClick={fermerEvenement}>
      <Panneau key={evenements.length + ev.titre} titre={ev.titre} tone={ev.tone}>
        {ev.texte && <p className="text-sm whitespace-pre-line text-texte/90">{ev.texte}</p>}
      </Panneau>
    </div>
  )
}
