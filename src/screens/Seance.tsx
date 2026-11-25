// Écran 3 — Mode séance : exercice par exercice, repos automatique, poids/reps, minuteurs.
import { useMemo, useState } from 'react'
import { ECHAUFFEMENT } from '../config/programme'
import { CompteARebours, MinuteurCycles, type Phase } from '../components/Minuteur'
import { Bouton, Panneau } from '../components/Panneau'
import { basculerSerie, lireSuivi, nbSeries, seanceFinie } from '../lib/moteur'
import { useStore } from '../lib/store'
import type { Etat, Exercice, LogSerie, Seance as TSeance } from '../lib/types'
import { libelle } from './Quete'

/** Dernier poids / reps notés pour un exercice (pour pré-remplir). */
function dernierLog(e: Etat, exId: string, avant: string): LogSerie | undefined {
  const cles = Object.keys(e.jours).filter((c) => c < avant).sort().reverse()
  for (const c of cles) {
    for (const s of Object.values(e.jours[c].seances)) {
      const logs = (s.logs[exId] ?? []).filter((l) => l && (l.poids || l.reps))
      if (logs.length) return logs[logs.length - 1]
    }
  }
}

function phasesDe(ex: Exercice): Phase[] {
  if (ex.kind === 'intervalles')
    return Array.from({ length: ex.cycles }, (_, i) => [
      { libelle: `${ex.libelleTravail} ${i + 1}/${ex.cycles}`, duree: ex.travail, travail: true },
      { libelle: ex.libelleRecup, duree: ex.recup, travail: false },
    ]).flat()
  if (ex.kind === 'emom')
    return Array.from({ length: ex.minutes }, (_, i) => ({ libelle: `MINUTE ${i + 1} — ${ex.consigne}`, duree: 60, travail: i % 2 === 0 }))
  return []
}

export function Seance({ seance, quitter }: { seance: TSeance; quitter: () => void }) {
  const { etat, aujourdhui, agir } = useStore()
  const suivi = lireSuivi(etat, aujourdhui, seance)
  const premierNonFini = seance.exercices.findIndex((ex) => !(suivi?.sets[ex.id] ?? []).every(Boolean) || (suivi?.sets[ex.id] ?? []).length === 0)
  const [index, setIndex] = useState(Math.max(0, premierNonFini))
  const [repos, setRepos] = useState<{ secondes: number; cle: number } | null>(null)
  const [chrono, setChrono] = useState<number | null>(null) // clé du chrono de série en cours
  const [echauffe, setEchauffe] = useState(!!suivi?.xp)

  const ex = seance.exercices[index]
  const sets = suivi?.sets[ex.id] ?? Array(nbSeries(ex)).fill(false)
  const prochaine = sets.findIndex((x: boolean) => !x)
  const exFini = prochaine === -1
  const precedent = useMemo(() => dernierLog(etat, ex.id, aujourdhui), [etat, ex.id, aujourdhui])
  const [poids, setPoids] = useState('')
  const [reps, setReps] = useState('')
  const finie = seanceFinie(suivi, seance)

  const valider = (i: number, log?: LogSerie) => {
    agir((e, ev) => basculerSerie(e, aujourdhui, seance, ex.id, i, ev, log, true))
    const dernier = i === nbSeries(ex) - 1
    const toutFini = dernier && index === seance.exercices.length - 1
    if (toutFini) return
    const r = ex.kind === 'series' ? ex.repos ?? etat.reglages.reposDefaut : ex.kind === 'circuit' ? ex.repos : 0
    if (r > 0 && !(dernier && ex.kind === 'circuit')) setRepos({ secondes: r, cle: Date.now() })
    else if (dernier) suivant()
  }
  const suivant = () => {
    setRepos(null)
    setChrono(null)
    setPoids('')
    setReps('')
    setIndex((i) => Math.min(seance.exercices.length - 1, i + 1))
  }

  if (!echauffe)
    return (
      <div className="space-y-4">
        <Panneau titre="[ Avertissement du Système ]" tone="or">
          <p className="font-titre text-lg tracking-wider text-or">{ECHAUFFEMENT.toUpperCase()}</p>
          <p className="text-sm text-doux mt-2">Cardio léger 3-5 min, mobilité des articulations, puis 1-2 séries légères du premier exercice.</p>
          <Bouton className="w-full mt-4" onClick={() => setEchauffe(true)}>Échauffement fait</Bouton>
        </Panneau>
        <Bouton variante="contour" className="w-full" onClick={quitter}>Retour</Bouton>
      </div>
    )

  if (finie)
    return (
      <div className="space-y-4">
        <Panneau titre="[ Notification du Système ]" tone="or">
          <p className="font-titre text-xl text-or tracking-wider">LA QUÊTE A ÉTÉ ACCOMPLIE.</p>
          <p className="text-sm text-doux mt-2">{seance.nom} — +{suivi?.xp ?? 0} XP</p>
        </Panneau>
        <Bouton className="w-full" onClick={quitter}>Retour à la quête</Bouton>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button className="font-titre text-xs text-doux tracking-wider min-h-11" onClick={quitter}>← QUITTER</button>
        <p className="font-titre text-xs text-doux tracking-wider">EXERCICE {index + 1} / {seance.exercices.length}</p>
      </div>

      {/* Navigation entre exercices */}
      <div className="flex gap-1">
        {seance.exercices.map((x, i) => {
          const ok = (suivi?.sets[x.id] ?? []).length > 0 && suivi!.sets[x.id].every(Boolean)
          return <button key={x.id} aria-label={x.nom} onClick={() => { setIndex(i); setRepos(null); setChrono(null) }} className={`h-2 flex-1 ${i === index ? 'bg-bleu shadow-[0_0_8px_#38bdf8]' : ok ? 'bg-violet/70' : 'bg-ligne'}`} />
        })}
      </div>

      <Panneau titre={`[ ${ex.nom} ]`}>
        <p className="text-sm text-texte/80">{libelle(ex)}</p>
        {ex.kind === 'series' && ex.astuce && <p className="text-xs text-doux mt-1">{ex.astuce}</p>}
        {ex.kind !== 'intervalles' && ex.kind !== 'emom' && ex.kind !== 'simple' && (
          <p className="font-titre text-bleu lueur text-2xl mt-3">{exFini ? 'TERMINÉ' : `${ex.kind === 'circuit' ? 'TOUR' : 'SÉRIE'} ${prochaine + 1} / ${sets.length}`}</p>
        )}

        {/* REPOS */}
        {repos && (
          <div className="mt-4">
            <CompteARebours key={repos.cle} secondes={repos.secondes} titre="REPOS" couleur="text-violet" onFini={() => (exFini ? suivant() : setRepos(null))} onPasser={() => (exFini ? suivant() : setRepos(null))} />
          </div>
        )}

        {/* SÉRIES CLASSIQUES */}
        {!repos && ex.kind === 'series' && !exFini && (
          <div className="mt-4 space-y-3">
            {(ex.charge || ex.noterReps) && (
              <div className="grid grid-cols-2 gap-2">
                {ex.charge && (
                  <label className="text-xs text-doux font-titre tracking-wider">
                    POIDS (KG)
                    <input inputMode="decimal" value={poids} placeholder={precedent?.poids ? String(precedent.poids) : '0'} onChange={(e) => setPoids(e.target.value.replace(',', '.'))} className="mt-1 w-full h-12 bg-nuit-2 border border-ligne px-3 text-texte font-titre focus:border-bleu outline-none" />
                  </label>
                )}
                <label className={`text-xs text-doux font-titre tracking-wider ${ex.charge ? '' : 'col-span-2'}`}>
                  REPS FAITES
                  <input inputMode="numeric" value={reps} placeholder={precedent?.reps ? String(precedent.reps) : ex.reps} onChange={(e) => setReps(e.target.value)} className="mt-1 w-full h-12 bg-nuit-2 border border-ligne px-3 text-texte font-titre focus:border-bleu outline-none" />
                </label>
              </div>
            )}
            {precedent && <p className="text-xs text-doux">Dernière fois : {precedent.poids ? `${precedent.poids} kg × ` : ''}{precedent.reps ?? '?'} reps</p>}
            {ex.duree ? (
              chrono !== null ? (
                <CompteARebours key={chrono} secondes={ex.duree} titre="TIENS BON" onFini={() => { setChrono(null); valider(prochaine) }} />
              ) : (
                <Bouton className="w-full" onClick={() => setChrono(Date.now())}>Lancer {ex.duree} s</Bouton>
              )
            ) : (
              <Bouton
                className="w-full"
                onClick={() => {
                  const p = parseFloat(poids || String(precedent?.poids ?? ''))
                  const r = parseInt(reps || '', 10)
                  valider(prochaine, ex.charge || ex.noterReps ? { poids: isNaN(p) ? undefined : p, reps: isNaN(r) ? undefined : r } : undefined)
                  setReps('')
                }}
              >
                Valider la série
              </Bouton>
            )}
          </div>
        )}

        {/* CIRCUIT */}
        {!repos && ex.kind === 'circuit' && !exFini && (
          <div className="mt-4 space-y-3">
            <ul className="space-y-1.5">
              {ex.mouvements.map((m) => (
                <li key={m} className="border-l-2 border-bleu pl-3 py-1 text-sm">{m}</li>
              ))}
            </ul>
            <Bouton className="w-full" onClick={() => valider(prochaine)}>Tour terminé</Bouton>
          </div>
        )}

        {/* FRACTIONNÉ / EMOM */}
        {(ex.kind === 'intervalles' || ex.kind === 'emom') && !exFini && (
          <div className="mt-4 space-y-3">
            {ex.kind === 'emom' && <p className="text-xs text-doux">Au bip, fais la consigne. Le reste de la minute = repos.</p>}
            <MinuteurCycles phases={phasesDe(ex)} onFini={() => valider(0)} />
            <button className="w-full text-xs text-doux underline min-h-11" onClick={() => valider(0)}>Valider sans minuteur</button>
          </div>
        )}

        {/* SIMPLE */}
        {ex.kind === 'simple' && !exFini && <Bouton className="w-full mt-4" onClick={() => valider(0)}>Valider</Bouton>}

        {exFini && !repos && index < seance.exercices.length - 1 && <Bouton className="w-full mt-4" onClick={suivant}>Exercice suivant</Bouton>}
      </Panneau>

      {seance.note && <p className="text-xs text-doux border-l-2 border-violet pl-2">{seance.note}</p>}
    </div>
  )
}
