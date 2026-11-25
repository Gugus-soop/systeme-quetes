// Petites fonctions de dates (jours locaux au format AAAA-MM-JJ).

export const cleJour = (d: Date = new Date()) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const j = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${j}`
}

export const depuisCle = (cle: string) => {
  const [a, m, j] = cle.split('-').map(Number)
  return new Date(a, m - 1, j, 12) // midi : évite les soucis de changement d'heure
}

export const ajouterJours = (cle: string, n: number) => {
  const d = depuisCle(cle)
  d.setDate(d.getDate() + n)
  return cleJour(d)
}

/** 0 = dimanche … 6 = samedi */
export const jourSemaine = (cle: string) => depuisCle(cle).getDay()

export const ecartJours = (de: string, a: string) => Math.round((depuisCle(a).getTime() - depuisCle(de).getTime()) / 86400000)

export const NOMS_JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/** Lundi de la semaine qui contient ce jour. */
export const lundiDe = (cle: string) => ajouterJours(cle, -((jourSemaine(cle) + 6) % 7))

export const dateCourte = (cle: string) =>
  depuisCle(cle).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

export const formatDuree = (s: number) => {
  const m = Math.floor(s / 60)
  const r = Math.max(0, Math.ceil(s % 60))
  return `${m}:${String(r === 60 ? 0 : r).padStart(2, '0')}`
}
