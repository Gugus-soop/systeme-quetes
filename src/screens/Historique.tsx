// Écran 5 — Historique et progression (charges en salle, max de tractions).
import { useState } from 'react'
import { Graphique } from '../components/Graphique'
import { Panneau } from '../components/Panneau'
import { dateCourte } from '../lib/date'
import { useStore } from '../lib/store'

const EXOS = [
  { id: 'squat', nom: 'Squat' },
  { id: 'dc', nom: 'Développé couché' },
  { id: 'rowing', nom: 'Rowing barre' },
  { id: 'sdt', nom: 'Soulevé de terre j. tendues' },
]

export function Historique() {
  const { etat } = useStore()
  const [exo, setExo] = useState('squat')
  const cles = Object.keys(etat.jours).sort()

  // Charge max par séance pour l'exercice choisi.
  const charges = cles
    .map((cle) => {
      const max = Math.max(0, ...Object.values(etat.jours[cle].seances).flatMap((s) => (s.logs[exo] ?? []).map((l) => l?.poids ?? 0)))
      return { cle, valeur: max }
    })
    .filter((p) => p.valeur > 0)

  const tractions = cles
    .map((cle) => ({ cle, valeur: Math.max(0, ...Object.values(etat.jours[cle].seances).flatMap((s) => (s.logs.tractions ?? []).map((l) => l?.reps ?? 0))) }))
    .filter((p) => p.valeur > 0)

  const faites = cles
    .flatMap((cle) => Object.values(etat.jours[cle].seances).filter((s) => s.terminee).map((s) => ({ cle, ...s })))
    .reverse()

  return (
    <div className="space-y-4">
      <h1 className="font-titre text-lg text-bleu lueur tracking-[0.12em] text-center">[PROGRESSION]</h1>

      <Panneau titre="[ Charges en salle ]">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {EXOS.map((e) => (
            <button key={e.id} onClick={() => setExo(e.id)} className={`px-2.5 min-h-9 border text-xs ${exo === e.id ? 'border-bleu text-bleu' : 'border-ligne text-doux'}`}>{e.nom}</button>
          ))}
        </div>
        <Graphique points={charges} unite="kg" />
      </Panneau>

      <Panneau titre="[ Max de tractions ]">
        <Graphique points={tractions} unite="reps" />
      </Panneau>

      <Panneau titre={`[ Séances accomplies : ${faites.length} ]`}>
        {faites.length === 0 ? (
          <p className="text-sm text-doux">Rien pour l’instant. Le Système attend.</p>
        ) : (
          <ul className="divide-y divide-ligne">
            {faites.slice(0, 60).map((s, i) => (
              <li key={i} className="py-2 flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{s.nom}</span>
                  <span className="text-xs text-doux">{dateCourte(s.cle)}</span>
                </span>
                <span className="font-titre text-bleu text-xs shrink-0 pt-1">+{s.xp} XP</span>
              </li>
            ))}
          </ul>
        )}
      </Panneau>
    </div>
  )
}
