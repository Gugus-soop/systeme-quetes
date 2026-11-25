// Fenêtre de « notification du Système », boutons et barre de progression.
import type { ReactNode } from 'react'

export function Panneau({ titre, children, tone = 'normal', className = '' }: { titre?: string; children: ReactNode; tone?: 'normal' | 'danger' | 'or'; className?: string }) {
  const couleur = tone === 'danger' ? 'text-danger' : tone === 'or' ? 'text-or' : 'text-bleu lueur'
  return (
    <section className={`panneau apparition p-4 ${tone === 'danger' ? 'panneau-danger' : tone === 'or' ? 'panneau-or' : ''} ${className}`}>
      {titre && <h2 className={`font-titre text-[13px] tracking-[0.18em] uppercase mb-3 ${couleur}`}>{titre}</h2>}
      {children}
    </section>
  )
}

/** Gros bouton (utilisable au pouce). */
export function Bouton({ children, onClick, variante = 'plein', className = '', disabled }: { children: ReactNode; onClick?: () => void; variante?: 'plein' | 'contour' | 'danger'; className?: string; disabled?: boolean }) {
  const styles = {
    plein: 'bg-bleu/15 border-bleu text-bleu hover:bg-bleu/25 shadow-[0_0_14px_rgba(56,189,248,0.35)]',
    contour: 'bg-transparent border-ligne text-texte hover:border-bleu-vif',
    danger: 'bg-danger/10 border-danger text-danger hover:bg-danger/20',
  }[variante]
  return (
    <button disabled={disabled} onClick={onClick} className={`min-h-12 px-4 border font-titre text-[13px] tracking-[0.14em] uppercase transition active:scale-[0.98] disabled:opacity-40 ${styles} ${className}`}>
      {children}
    </button>
  )
}

export function Barre({ valeur, max, couleur = 'from-bleu to-violet' }: { valeur: number; max: number; couleur?: string }) {
  const pct = Math.max(0, Math.min(100, (valeur / Math.max(1, max)) * 100))
  return (
    <div className="h-2.5 bg-nuit-2 border border-ligne overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${couleur} shadow-[0_0_10px_rgba(56,189,248,0.8)] transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  )
}
