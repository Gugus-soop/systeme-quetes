// Écran 4 — Planning de la semaine.
import { Panneau } from '../components/Panneau'
import { NOMS_JOURS, ajouterJours, depuisCle, jourSemaine, lundiDe } from '../lib/date'
import { seancesDuJour, semaineProgramme } from '../lib/moteur'
import { useStore } from '../lib/store'

export function Planning() {
  const { etat, aujourdhui } = useStore()
  const lundi = lundiDe(aujourdhui)
  const jours = Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i))

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h1 className="font-titre text-lg text-bleu lueur tracking-[0.12em]">[PLANNING]</h1>
        <p className="text-xs text-doux mt-1">Semaine {semaineProgramme(etat, aujourdhui)} du programme · la difficulté monte chaque semaine</p>
      </div>
      {jours.map((cle) => {
        const seances = seancesDuJour(etat, cle)
        const jour = etat.jours[cle]
        const estAujourdhui = cle === aujourdhui
        const passe = cle < aujourdhui
        const statut = jour?.valide ? (jour.auto ? 'REPOS' : 'VALIDÉ') : passe && cle >= etat.debut ? 'RATÉ' : ''
        return (
          <Panneau key={cle} className={estAujourdhui ? 'ring-1 ring-bleu shadow-[0_0_24px_rgba(56,189,248,0.45)]' : passe ? 'opacity-70' : ''} tone={statut === 'RATÉ' ? 'danger' : jour?.valide && !jour.auto ? 'or' : 'normal'}>
            <div className="flex justify-between items-baseline">
              <p className={`font-titre text-sm tracking-wider ${estAujourdhui ? 'text-bleu lueur' : ''}`}>
                {NOMS_JOURS[jourSemaine(cle)].toUpperCase()} <span className="text-doux text-xs">{depuisCle(cle).getDate()}</span>
                {estAujourdhui && <span className="text-xs text-doux"> · AUJOURD’HUI</span>}
              </p>
              {statut && <span className={`font-titre text-xs ${statut === 'RATÉ' ? 'text-danger' : 'text-or'}`}>{statut === 'RATÉ' ? '✗' : '✓'} {statut}</span>}
            </div>
            {seances.length === 0 ? (
              <p className="text-sm text-doux mt-1">Repos — balade facultative, étirements</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {seances.map((s) => {
                  const ok = jour?.seances[s.id]?.terminee
                  return (
                    <li key={s.id} className="text-sm flex gap-2">
                      <span className="text-doux w-20 shrink-0 text-xs pt-0.5">{s.creneau}</span>
                      <span className={ok ? 'text-or' : ''}>{ok ? '✓ ' : ''}{s.nom}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panneau>
        )
      })}
    </div>
  )
}
