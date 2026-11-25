// Écran 2 — Quête du jour : séances prévues, objectifs à cocher, pénalité.
import { useState } from 'react'
import { ECHAUFFEMENT } from '../config/programme'
import { Bouton, Panneau } from '../components/Panneau'
import { NOMS_JOURS, jourSemaine } from '../lib/date'
import { annulerRemplacement, basculerSerie, faireLaPenalite, lireSuivi, nbSeries, remplacerSeance, seanceFinie, seancesDuJour } from '../lib/moteur'
import { useStore } from '../lib/store'
import type { Exercice, Seance } from '../lib/types'

/** Texte d'un objectif, ex : « Squat — 4×6-8 ». */
export function libelle(ex: Exercice) {
  switch (ex.kind) {
    case 'series': return `${ex.nom} — ${ex.series}×${ex.reps}`
    case 'circuit': return `${ex.nom} — ${ex.tours} tours`
    case 'emom': return `${ex.nom} : ${ex.consigne}`
    default: return ex.nom
  }
}

export function Quete({ lancer }: { lancer: (s: Seance) => void }) {
  const { etat, aujourdhui, agir } = useStore()
  const seances = seancesDuJour(etat, aujourdhui)
  const jour = etat.jours[aujourdhui]
  const [douleur, setDouleur] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="font-titre text-xs tracking-[0.35em] text-doux">{NOMS_JOURS[jourSemaine(aujourdhui)].toUpperCase()}</p>
        <h1 className="font-titre text-lg text-bleu lueur tracking-[0.12em] mt-1">[QUÊTE QUOTIDIENNE]</h1>
      </div>

      {jour?.penalite && (
        <Panneau titre="[ Quête de pénalité ]" tone={jour.penalite.faite ? 'or' : 'danger'}>
          <p className="font-semibold">{jour.penalite.texte}</p>
          <p className="text-xs text-doux mt-1">La quête d’hier n’a pas été accomplie. Fais-la avant minuit ou ta série sera brisée. +{jour.penalite.xp} XP</p>
          {!jour.penalite.faite ? (
            <Bouton variante="danger" className="w-full mt-3" onClick={() => agir((e, ev) => faireLaPenalite(e, aujourdhui, ev))}>Pénalité accomplie</Bouton>
          ) : (
            <p className="text-or text-sm mt-2 font-titre tracking-wider">ACCOMPLIE</p>
          )}
        </Panneau>
      )}

      {seances.length === 0 && (
        <Panneau titre="[ Jour de repos ]" tone="or">
          <p className="text-sm">Le Système t’accorde le repos. La journée est validée automatiquement.</p>
          <p className="text-xs text-doux mt-2">Facultatif : balade de 30 min et 10 min d’étirements.</p>
        </Panneau>
      )}

      {seances.map((s) => {
        const suivi = lireSuivi(etat, aujourdhui, s)
        const finie = seanceFinie(suivi, s)
        const remplacee = s.id.endsWith('~recup')
        const idOrigine = s.id.replace('~recup', '')
        const aDesExercicesLongs = s.exercices.some((x) => x.kind !== 'simple')
        return (
          <Panneau key={s.id} titre={`[ ${s.creneau} ] ${s.nom}`} tone={finie ? 'or' : 'normal'}>
            <p className="text-xs text-doux -mt-2 mb-2">{s.dureeMin} min · Difficulté {'◆'.repeat(s.difficulte)}{'◇'.repeat(3 - s.difficulte)}</p>
            {!finie && s.type !== 'eps' && <p className="text-xs text-or mb-2">⚠ {ECHAUFFEMENT}</p>}
            {s.note && <p className="text-xs text-texte/75 mb-3 border-l-2 border-violet pl-2">{s.note}</p>}

            <ul className="space-y-3">
              {s.exercices.map((ex) => {
                const sets = suivi?.sets[ex.id] ?? Array(nbSeries(ex)).fill(false)
                return (
                  <li key={ex.id}>
                    <p className="text-sm font-semibold">{libelle(ex)}</p>
                    {ex.kind === 'circuit' && <p className="text-xs text-doux">{ex.mouvements.join(' · ')}</p>}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {sets.map((ok: boolean, i: number) => (
                        <button
                          key={i}
                          aria-label={`${ex.nom} série ${i + 1}`}
                          onClick={() => agir((e, ev) => basculerSerie(e, aujourdhui, s, ex.id, i, ev))}
                          className={`min-w-11 h-11 px-2 border font-titre text-xs transition ${ok ? 'bg-bleu/25 border-bleu text-bleu shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'border-ligne text-doux'}`}
                        >
                          {ok ? '✓' : ex.kind === 'simple' ? 'VALIDER' : ex.kind === 'emom' || ex.kind === 'intervalles' ? 'FAIT' : i + 1}
                        </button>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>

            {!finie && (
              <div className="mt-4 space-y-2">
                {aDesExercicesLongs && <Bouton className="w-full" onClick={() => lancer(s)}>Lancer la séance</Bouton>}
                {!remplacee && s.type !== 'eps' && (douleur === s.id ? (
                  <div className="border border-danger/60 p-3 text-sm">
                    <p>Douleur articulaire ? Le Système propose de remplacer cette séance par une <b>récup active</b>.</p>
                    <div className="flex gap-2 mt-3">
                      <Bouton variante="danger" className="flex-1" onClick={() => { agir((e, ev) => remplacerSeance(e, aujourdhui, s.id, ev)); setDouleur(null) }}>Remplacer</Bouton>
                      <Bouton variante="contour" className="flex-1" onClick={() => setDouleur(null)}>Annuler</Bouton>
                    </div>
                  </div>
                ) : (
                  <Bouton variante="contour" className="w-full" onClick={() => setDouleur(s.id)}>J’ai mal</Bouton>
                ))}
                {remplacee && !suivi?.xp && (
                  <Bouton variante="contour" className="w-full" onClick={() => agir((e) => annulerRemplacement(e, aujourdhui, idOrigine))}>Reprendre la séance prévue</Bouton>
                )}
              </div>
            )}
          </Panneau>
        )
      })}
    </div>
  )
}
