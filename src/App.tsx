// Application : navigation entre les écrans + fenêtres du Système.
import { useState } from 'react'
import { Superposition } from './components/Superposition'
import { useStore } from './lib/store'
import type { Seance as TSeance } from './lib/types'
import { Historique } from './screens/Historique'
import { Planning } from './screens/Planning'
import { Quete } from './screens/Quete'
import { Reglages } from './screens/Reglages'
import { Seance } from './screens/Seance'
import { Statut } from './screens/Statut'
import { TestNiveau } from './screens/TestNiveau'

type Onglet = 'statut' | 'quete' | 'planning' | 'historique' | 'reglages'

const ONGLETS: { id: Onglet; nom: string; icone: string }[] = [
  { id: 'statut', nom: 'Statut', icone: '◈' },
  { id: 'quete', nom: 'Quête', icone: '⚔' },
  { id: 'planning', nom: 'Planning', icone: '▦' },
  { id: 'historique', nom: 'Progrès', icone: '↗' },
  { id: 'reglages', nom: 'Réglages', icone: '⚙' },
]

export default function App() {
  const { etat, aujourdhui } = useStore()
  const [onglet, setOnglet] = useState<Onglet>('statut')
  const [seance, setSeance] = useState<TSeance | null>(null)
  const [test, setTest] = useState(false)

  let contenu
  if (!etat.niveau || test) contenu = <TestNiveau fini={() => setTest(false)} />
  else if (seance) contenu = <Seance key={seance.id + aujourdhui} seance={seance} quitter={() => setSeance(null)} />
  else
    contenu = {
      statut: <Statut allerQuete={() => setOnglet('quete')} />,
      quete: <Quete lancer={setSeance} />,
      planning: <Planning />,
      historique: <Historique />,
      reglages: <Reglages refaireTest={() => setTest(true)} />,
    }[onglet]

  const navVisible = etat.niveau && !test && !seance

  return (
    <div className="min-h-full max-w-md mx-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="flex items-center justify-between mb-4">
        <p className="flex items-center gap-2 font-titre text-[11px] tracking-[0.4em] text-doux"><img src="./icons/icon-192.png" alt="" className="w-7 h-7" />LE SYSTÈME</p>
        <p className="font-titre text-[11px] tracking-[0.2em] text-doux">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase()}</p>
      </header>
      <main key={onglet + String(seance?.id) + String(test)}>{contenu}</main>

      {navVisible && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-nuit/92 backdrop-blur border-t border-ligne pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-md mx-auto grid grid-cols-5">
            {ONGLETS.map((o) => (
              <button key={o.id} onClick={() => setOnglet(o.id)} className={`min-h-16 flex flex-col items-center justify-center gap-1 ${onglet === o.id ? 'text-bleu lueur' : 'text-doux'}`}>
                <span className="text-xl leading-none">{o.icone}</span>
                <span className="font-titre text-[9px] tracking-wider uppercase">{o.nom}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
      <Superposition />
    </div>
  )
}
