// Écran 1 — Statut du joueur (accueil).
import { useState } from 'react'
import { TITRES, niveauDepuisXp, rangDuNiveau } from '../config/progression'
import { Barre, Bouton, Panneau } from '../components/Panneau'
import { seanceFinie, lireSuivi, seancesDuJour } from '../lib/moteur'
import { useStore } from '../lib/store'
import { NOM_STAT, STATS } from '../lib/types'

export function Statut({ allerQuete }: { allerQuete: () => void }) {
  const { etat, aujourdhui, agir } = useStore()
  const [choixTitre, setChoixTitre] = useState(false)
  const { niveau, xpDansNiveau, xpProchain } = niveauDepuisXp(etat.xp)
  const rang = rangDuNiveau(niveau)
  const titre = TITRES.find((t) => t.id === etat.titreActif)
  const seances = seancesDuJour(etat, aujourdhui)
  const faites = seances.filter((s) => seanceFinie(lireSuivi(etat, aujourdhui, s), s)).length
  const jour = etat.jours[aujourdhui]
  const maxStat = Math.max(...STATS.map((s) => etat.stats[s]), 20)

  return (
    <div className="space-y-4">
      <Panneau titre="[ Statut ]">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center border-2 font-titre text-5xl font-black" style={{ borderColor: rang.couleur, color: rang.couleur, textShadow: `0 0 18px ${rang.couleur}`, boxShadow: `0 0 16px ${rang.couleur}55 inset` }}>
            {rang.rang}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-titre text-xl font-bold truncate">{etat.reglages.pseudo}</p>
            <button className="text-left text-sm text-violet lueur-violet" onClick={() => setChoixTitre((v) => !v)}>
              {titre ? `« ${titre.nom} »` : 'Aucun titre'} <span className="text-doux text-xs">▾</span>
            </button>
            <p className="font-titre text-sm text-doux mt-1">NIVEAU <span className="text-bleu lueur text-lg">{niveau}</span> · RANG {rang.rang}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-doux mb-1 font-titre tracking-wider">
            <span>XP</span>
            <span>{xpDansNiveau} / {xpProchain}</span>
          </div>
          <Barre valeur={xpDansNiveau} max={xpProchain} />
        </div>
      </Panneau>

      {choixTitre && (
        <Panneau titre="[ Titres ]">
          <ul className="space-y-2">
            {TITRES.map((t) => {
              const ok = !!etat.titres[t.id]
              return (
                <li key={t.id}>
                  <button disabled={!ok} onClick={() => { agir((e) => { e.titreActif = t.id }); setChoixTitre(false) }} className={`w-full text-left p-2 border ${etat.titreActif === t.id ? 'border-violet' : 'border-ligne'} ${ok ? '' : 'opacity-45'}`}>
                    <span className={ok ? 'text-violet' : 'text-doux'}>{ok ? t.nom : '???'}</span>
                    <span className="block text-xs text-doux">{t.condition}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panneau>
      )}

      <Panneau titre="[ Statistiques ]">
        <div className="space-y-3">
          {STATS.map((s) => (
            <div key={s}>
              <div className="flex justify-between font-titre text-xs tracking-wider mb-1">
                <span>{NOM_STAT[s]}</span>
                <span className="text-bleu lueur">{etat.stats[s]}</span>
              </div>
              <Barre valeur={etat.stats[s]} max={maxStat} />
            </div>
          ))}
        </div>
      </Panneau>

      <div className="grid grid-cols-2 gap-3">
        <Panneau>
          <p className="font-titre text-xs text-doux tracking-wider">SÉRIE</p>
          <p className="font-titre text-3xl font-black text-or" style={{ textShadow: '0 0 14px #fbbf2488' }}>{etat.serie}<span className="text-sm text-doux"> j</span></p>
        </Panneau>
        <Panneau>
          <p className="font-titre text-xs text-doux tracking-wider">RECORD</p>
          <p className="font-titre text-3xl font-black">{etat.meilleureSerie}<span className="text-sm text-doux"> j</span></p>
        </Panneau>
      </div>

      <Panneau titre={jour?.valide ? '[ Quête du jour accomplie ]' : '[ Quête quotidienne disponible ]'} tone={jour?.penalite && !jour.penalite.faite ? 'danger' : jour?.valide ? 'or' : 'normal'}>
        <p className="text-sm text-doux mb-3">
          {seances.length === 0 ? 'Jour de repos. Validé automatiquement.' : `${faites} / ${seances.length} séance${seances.length > 1 ? 's' : ''} accomplie${faites > 1 ? 's' : ''}.`}
          {jour?.penalite && !jour.penalite.faite && <span className="block text-danger mt-1">Une quête de pénalité t’attend.</span>}
        </p>
        <Bouton className="w-full pulse-lent" onClick={allerQuete}>Voir la quête du jour</Bouton>
      </Panneau>
    </div>
  )
}
