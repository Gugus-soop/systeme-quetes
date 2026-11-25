// Écran 6 — Réglages.
import { useRef, useState } from 'react'
import { Bouton, Panneau } from '../components/Panneau'
import { useStore } from '../lib/store'
import { effacer, etatNeuf, exporter, valider } from '../lib/stockage'
import { NOM_STAT, STATS, type Reglages as TReglages } from '../lib/types'

function Interrupteur({ label, actif, onChange }: { label: string; actif: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={actif} onClick={() => onChange(!actif)} className="w-full flex items-center justify-between min-h-12">
      <span className="text-sm">{label}</span>
      <span className={`w-12 h-6 border relative transition ${actif ? 'border-bleu bg-bleu/25' : 'border-ligne'}`}>
        <span className={`absolute top-0.5 w-4.5 h-4.5 transition-all ${actif ? 'left-6.5 bg-bleu shadow-[0_0_8px_#38bdf8]' : 'left-0.5 bg-doux'}`} />
      </span>
    </button>
  )
}

export function Reglages({ refaireTest }: { refaireTest: () => void }) {
  const { etat, agir, remplacer } = useStore()
  const r = etat.reglages
  const fichier = useRef<HTMLInputElement>(null)
  const [confirmer, setConfirmer] = useState(false)
  const [message, setMessage] = useState('')
  const changer = (m: Partial<TReglages>) => agir((e) => { e.reglages = { ...e.reglages, ...m } })

  return (
    <div className="space-y-4">
      <h1 className="font-titre text-lg text-bleu lueur tracking-[0.12em] text-center">[RÉGLAGES]</h1>

      <Panneau titre="[ Joueur ]">
        <label className="block text-xs text-doux font-titre tracking-wider">
          PSEUDO
          <input value={r.pseudo} maxLength={20} onChange={(e) => changer({ pseudo: e.target.value })} className="mt-1 w-full h-12 bg-nuit-2 border border-ligne px-3 text-texte font-titre focus:border-bleu outline-none" />
        </label>
        <Bouton variante="contour" className="w-full mt-3" onClick={refaireTest}>Refaire le test de niveau</Bouton>
        <p className="text-xs text-doux mt-1">{etat.niveau ? `Dernier test : ${etat.niveau.pompes} pompes, ${etat.niveau.tractions} tractions, ${etat.niveau.gainage} s de gainage. À refaire toutes les 4 à 6 semaines.` : 'Aucun test fait.'}</p>
      </Panneau>

      <Panneau titre="[ Sons et vibrations ]">
        <Interrupteur label="Effets sonores" actif={r.sons} onChange={(v) => changer({ sons: v })} />
        <Interrupteur label="Vibrations" actif={r.vibrations} onChange={(v) => changer({ vibrations: v })} />
        <label className="block text-xs text-doux font-titre tracking-wider mt-3">
          REPOS PAR DÉFAUT : <span className="text-bleu">{r.reposDefaut} s</span>
          <input type="range" min={30} max={240} step={15} value={r.reposDefaut} onChange={(e) => changer({ reposDefaut: +e.target.value })} className="w-full mt-2 accent-sky-400 h-8" />
        </label>
      </Panneau>

      <Panneau titre="[ Sport de l’EPS ]">
        <label className="block text-xs text-doux font-titre tracking-wider">
          ACTIVITÉ DU CYCLE
          <input value={r.epsNom} maxLength={30} onChange={(e) => changer({ epsNom: e.target.value })} className="mt-1 w-full h-12 bg-nuit-2 border border-ligne px-3 text-texte font-titre focus:border-bleu outline-none" />
        </label>
        <p className="text-xs text-doux mt-3 mb-1 font-titre tracking-wider">STATS GAGNÉES (+2 CHACUNE)</p>
        <div className="grid grid-cols-2 gap-2">
          {STATS.filter((s) => s !== 'VOLONTE').map((s) => {
            const on = r.epsStats.includes(s)
            return (
              <button key={s} onClick={() => changer({ epsStats: on ? r.epsStats.filter((x) => x !== s) : [...r.epsStats, s] })} className={`min-h-11 border font-titre text-xs ${on ? 'border-bleu text-bleu bg-bleu/15' : 'border-ligne text-doux'}`}>
                {NOM_STAT[s]}
              </button>
            )
          })}
        </div>
      </Panneau>

      <Panneau titre="[ Données ]">
        <div className="space-y-2">
          <Bouton variante="contour" className="w-full" onClick={() => exporter(etat)}>Exporter (JSON)</Bouton>
          <Bouton variante="contour" className="w-full" onClick={() => fichier.current?.click()}>Importer une sauvegarde</Bouton>
          <input
            ref={fichier}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              try {
                const ok = valider(JSON.parse(await f.text()))
                if (ok) {
                  remplacer(ok)
                  setMessage('Sauvegarde importée.')
                } else setMessage('Ce fichier n’est pas une sauvegarde valide.')
              } catch {
                setMessage('Fichier illisible.')
              }
              e.target.value = ''
            }}
          />
          {message && <p className="text-xs text-bleu">{message}</p>}
          {!confirmer ? (
            <Bouton variante="danger" className="w-full" onClick={() => setConfirmer(true)}>Réinitialiser</Bouton>
          ) : (
            <div className="border border-danger p-3">
              <p className="text-sm text-danger">Tout effacer (niveau, XP, historique) ? C’est définitif. Exporte d’abord si tu veux garder une copie.</p>
              <div className="flex gap-2 mt-3">
                <Bouton variante="danger" className="flex-1" onClick={() => { effacer(); remplacer(etatNeuf()); setConfirmer(false) }}>Tout effacer</Bouton>
                <Bouton variante="contour" className="flex-1" onClick={() => setConfirmer(false)}>Annuler</Bouton>
              </div>
            </div>
          )}
        </div>
      </Panneau>
      <p className="text-center text-xs text-doux pb-2">Données stockées uniquement sur ce téléphone.</p>
    </div>
  )
}
