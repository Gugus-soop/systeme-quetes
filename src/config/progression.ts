/**
 * PROGRESSION — XP, niveaux, rangs, stats et titres.
 * Modifie les chiffres ici pour rendre le jeu plus ou moins généreux.
 */
import type { Stat, TypeSeance } from '../lib/types'

/** XP par série validée = XP_SERIE × difficulté (1 à 3). */
export const XP_SERIE = 5
/** Bonus de séance complète = XP_SEANCE × difficulté. */
export const XP_SEANCE = 30
/** XP pour une activité validée en un clic (EPS, natation…) = XP_SIMPLE × difficulté. */
export const XP_SIMPLE = 15
/** Bonus quand toute la quête du jour est accomplie. */
export const XP_JOUR = 25

/** XP nécessaire pour passer du niveau n au niveau n+1 (courbe croissante). */
export const xpPourNiveau = (n: number) => 50 + 30 * n

/** Calcule niveau, XP dans le niveau et XP du prochain niveau à partir de l'XP total. */
export function niveauDepuisXp(xpTotal: number) {
  let niveau = 1
  let reste = xpTotal
  while (reste >= xpPourNiveau(niveau)) {
    reste -= xpPourNiveau(niveau)
    niveau++
  }
  return { niveau, xpDansNiveau: reste, xpProchain: xpPourNiveau(niveau) }
}

/** Rangs : E (1-9), D (10-19), C (20-34), B (35-49), A (50-69), S (70+). */
export const RANGS: { rang: string; min: number; couleur: string }[] = [
  { rang: 'E', min: 1, couleur: '#8a94a8' },
  { rang: 'D', min: 10, couleur: '#4ade80' },
  { rang: 'C', min: 20, couleur: '#38bdf8' },
  { rang: 'B', min: 35, couleur: '#818cf8' },
  { rang: 'A', min: 50, couleur: '#c084fc' },
  { rang: 'S', min: 70, couleur: '#fbbf24' },
]
export function rangDuNiveau(niveau: number) {
  return [...RANGS].reverse().find((r) => niveau >= r.min) ?? RANGS[0]
}

/** Stats gagnées quand une séance est terminée (la VOLONTÉ s'ajoute toujours +1). */
export const GAIN_STATS: Record<TypeSeance, Partial<Record<Stat, number>>> = {
  salle: { FORCE: 2 },
  natation: { ENDURANCE: 2 },
  footing: { ENDURANCE: 1 },
  fractionne: { AGILITE: 2, ENDURANCE: 1 },
  circuit: { AGILITE: 1, FORCE: 1 },
  jambes: { AGILITE: 2, FORCE: 1 },
  eps: {}, // défini dans les réglages (le sport change pendant l'année)
  recup: { ENDURANCE: 1 },
}
export const STATS_DEPART = 10

/** Données utilisées pour vérifier les titres. */
export interface Compteurs {
  seances: number
  parType: Record<TypeSeance, number>
  series: number
  serie: number
  lundiComplet: boolean
  penalitesFaites: number
  maxTractions: number
  niveau: number
  joursValides: number
}

export interface Titre {
  id: string
  nom: string
  condition: string
  test: (c: Compteurs) => boolean
}

/** Titres déblocables. */
export const TITRES: Titre[] = [
  { id: 'eveil', nom: 'L’Éveillé', condition: 'Terminer ta première séance', test: (c) => c.seances >= 1 },
  { id: 'assidu', nom: 'Celui qui ne saute pas de séance', condition: '7 jours de suite', test: (c) => c.serie >= 7 },
  { id: 'fer', nom: 'Volonté de fer', condition: '30 jours de suite', test: (c) => c.serie >= 30 },
  { id: 'nageur', nom: 'Nageur des profondeurs', condition: '10 séances de natation', test: (c) => c.parType.natation >= 10 },
  { id: 'triple', nom: 'Triple quête', condition: 'Un lundi complet (3 séances)', test: (c) => c.lundiComplet },
  { id: 'rachete', nom: 'Le Racheté', condition: 'Accomplir une quête de pénalité', test: (c) => c.penalitesFaites >= 1 },
  { id: 'fonte', nom: 'Forgé dans la fonte', condition: '20 séances de salle', test: (c) => c.parType.salle >= 20 },
  { id: 'eclair', nom: 'L’Éclair', condition: '10 séances de fractionné', test: (c) => c.parType.fractionne >= 10 },
  { id: 'acier', nom: 'Jambes d’acier', condition: '10 vendredis jambes', test: (c) => c.parType.jambes >= 10 },
  { id: 'barre', nom: 'Maître de la barre', condition: '10 tractions d’affilée', test: (c) => c.maxTractions >= 10 },
  { id: 'centurion', nom: 'Centurion', condition: '100 séries validées', test: (c) => c.series >= 100 },
  { id: 'ascension', nom: 'L’Ascension', condition: 'Atteindre le rang C (niveau 20)', test: (c) => c.niveau >= 20 },
  { id: 'cent-jours', nom: 'Le Centenaire', condition: '100 jours de quête validés', test: (c) => c.joursValides >= 100 },
]
