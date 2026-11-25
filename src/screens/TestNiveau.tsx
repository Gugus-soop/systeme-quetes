// Test de niveau (premier lancement, puis toutes les 4-6 semaines) : ajuste les répétitions.
import { useEffect, useState } from 'react'
import { Bouton, Panneau } from '../components/Panneau'
import { cleJour, formatDuree } from '../lib/date'
import { verifierTitres } from '../lib/moteur'
import { useStore } from '../lib/store'

function Champ({ label, aide, valeur, onChange }: { label: string; aide: string; valeur: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="font-titre text-xs tracking-wider text-bleu">{label}</span>
      <span className="block text-xs text-doux mb-1">{aide}</span>
      <input inputMode="numeric" value={valeur} onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} className="w-full h-12 bg-nuit-2 border border-ligne px-3 font-titre text-lg focus:border-bleu outline-none" />
    </label>
  )
}

export function TestNiveau({ fini }: { fini: () => void }) {
  const { etat, agir } = useStore()
  const [pompes, setPompes] = useState(etat.niveau ? String(etat.niveau.pompes) : '')
  const [tractions, setTractions] = useState(etat.niveau ? String(etat.niveau.tractions) : '')
  const [gainage, setGainage] = useState(etat.niveau ? String(etat.niveau.gainage) : '')
  const [chrono, setChrono] = useState<number | null>(null)
  const [maintenant, setMaintenant] = useState(Date.now())

  useEffect(() => {
    if (chrono === null) return
    const t = setInterval(() => setMaintenant(Date.now()), 200)
    return () => clearInterval(t)
  }, [chrono])

  const ok = pompes !== '' && tractions !== '' && gainage !== ''

  return (
    <div className="space-y-4">
      <Panneau titre="[ Évaluation du joueur ]">
        <p className="text-sm">Le Système doit mesurer ton niveau pour calibrer tes quêtes.</p>
        <p className="text-xs text-doux mt-2">Échauffe-toi 5 min. Repose-toi 3 min entre chaque test. Technique propre : une rep mal faite ne compte pas.</p>
      </Panneau>
      <Panneau>
        <div className="space-y-4">
          <Champ label="POMPES MAX" aide="D’affilée, poitrine près du sol, corps gainé." valeur={pompes} onChange={setPompes} />
          <Champ label="TRACTIONS MAX" aide="Bras tendus en bas, menton au-dessus de la barre. 0 si aucune." valeur={tractions} onChange={setTractions} />
          <div>
            <Champ label="GAINAGE MAX (SECONDES)" aide="Sur les avant-bras, dos droit. Arrête quand les fesses tombent." valeur={gainage} onChange={setGainage} />
            <Bouton
              variante="contour"
              className="w-full mt-2"
              onClick={() => {
                if (chrono === null) {
                  setChrono(Date.now())
                  setMaintenant(Date.now())
                } else {
                  setGainage(String(Math.round((Date.now() - chrono) / 1000)))
                  setChrono(null)
                }
              }}
            >
              {chrono === null ? 'Chrono gainage' : `Stop — ${formatDuree((maintenant - chrono) / 1000)}`}
            </Bouton>
          </div>
        </div>
      </Panneau>
      <Bouton
        className="w-full"
        disabled={!ok}
        onClick={() => {
          agir((e, ev) => {
            e.niveau = { pompes: +pompes, tractions: +tractions, gainage: +gainage, date: cleJour() }
            ev.push({ kind: 'message', titre: '[CALIBRAGE TERMINÉ]', texte: 'Les quêtes ont été ajustées à ton niveau.' })
            verifierTitres(e, ev)
          })
          fini()
        }}
      >
        Valider l’évaluation
      </Bouton>
      {!etat.niveau && (
        <button className="w-full text-xs text-doux underline min-h-11" onClick={() => {
          agir((e) => { e.niveau = { pompes: 30, tractions: 5, gainage: 75, date: cleJour() } })
          fini()
        }}>
          Passer (valeurs par défaut)
        </button>
      )}
    </div>
  )
}
