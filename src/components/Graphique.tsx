// Petit graphique en ligne (SVG, sans bibliothèque).
import { dateCourte } from '../lib/date'

export function Graphique({ points, unite }: { points: { cle: string; valeur: number }[]; unite: string }) {
  if (points.length === 0) return <p className="text-sm text-doux">Aucune donnée pour l’instant.</p>
  const L = 320, H = 120, m = 22
  const vals = points.map((p) => p.valeur)
  const min = Math.min(...vals), max = Math.max(...vals)
  const ecart = max - min || 1
  const x = (i: number) => (points.length === 1 ? L / 2 : m + (i * (L - 2 * m)) / (points.length - 1))
  const y = (v: number) => H - m - ((v - min) / ecart) * (H - 2 * m)
  const chemin = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.valeur)}`).join(' ')
  const dernier = points[points.length - 1]
  return (
    <div>
      <svg viewBox={`0 0 ${L} ${H}`} className="w-full h-auto" role="img" aria-label={`Progression : dernier ${dernier.valeur} ${unite}`}>
        <line x1={m} x2={L - m} y1={H - m} y2={H - m} stroke="#1e2b4a" />
        <line x1={m} x2={L - m} y1={m} y2={m} stroke="#1e2b4a" strokeDasharray="3 4" />
        <text x={2} y={m + 4} fill="#8193b8" fontSize="10">{max}</text>
        <text x={2} y={H - m + 4} fill="#8193b8" fontSize="10">{min}</text>
        <path d={chemin} fill="none" stroke="#38bdf8" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 3px #38bdf8)' }} />
        {points.map((p, i) => (
          <circle key={p.cle} cx={x(i)} cy={y(p.valeur)} r="3.5" fill="#05070f" stroke="#a78bfa" strokeWidth="2">
            <title>{`${dateCourte(p.cle)} : ${p.valeur} ${unite}`}</title>
          </circle>
        ))}
      </svg>
      <p className="text-xs text-doux mt-1">
        Dernier : <span className="text-texte font-semibold">{dernier.valeur} {unite}</span> ({dateCourte(dernier.cle)}) · Record : <span className="text-or font-semibold">{max} {unite}</span>
      </p>
    </div>
  )
}
