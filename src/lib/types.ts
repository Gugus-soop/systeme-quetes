// Types partagés de l'application.

export type Stat = 'FORCE' | 'ENDURANCE' | 'AGILITE' | 'VOLONTE'
export const STATS: Stat[] = ['FORCE', 'ENDURANCE', 'AGILITE', 'VOLONTE']
export const NOM_STAT: Record<Stat, string> = {
  FORCE: 'FORCE',
  ENDURANCE: 'ENDURANCE',
  AGILITE: 'AGILITÉ',
  VOLONTE: 'VOLONTÉ',
}

/** Catégorie d'une séance : sert pour l'XP, les stats et les titres. */
export type TypeSeance = 'salle' | 'natation' | 'footing' | 'fractionne' | 'circuit' | 'jambes' | 'eps' | 'recup'

/** Un exercice de la séance. */
export type Exercice =
  | {
      /** Séries classiques à cocher une par une (ex : Squat 4×6-8). */
      kind: 'series'
      id: string
      nom: string
      series: number
      reps: string
      /** true = exercice avec charge : on note le poids et les reps. */
      charge?: boolean
      /** true = on note les reps faites (ex : tractions max). */
      noterReps?: boolean
      /** Durée d'une série en secondes (gainage, chaise) : lance un minuteur. */
      duree?: number
      /** Repos après chaque série (secondes). Sinon : réglage par défaut. */
      repos?: number
      astuce?: string
    }
  | {
      /** Circuit en tours (ex : mercredi). Un tour = une série. */
      kind: 'circuit'
      id: string
      nom: string
      tours: number
      mouvements: string[]
      repos: number
    }
  | {
      /** Fractionné : travail / récup, répété. Minuteur automatique. */
      kind: 'intervalles'
      id: string
      nom: string
      cycles: number
      travail: number
      recup: number
      libelleTravail: string
      libelleRecup: string
    }
  | {
      /** EMOM : chaque minute, on fait la consigne puis on récupère le reste de la minute. */
      kind: 'emom'
      id: string
      nom: string
      minutes: number
      consigne: string
    }
  | {
      /** Activité validée en un clic (EPS, natation, footing, étirements…). */
      kind: 'simple'
      id: string
      nom: string
      detail?: string
    }

export interface Seance {
  id: string
  nom: string
  creneau: string
  type: TypeSeance
  /** 1 = facile, 2 = moyen, 3 = dur. Multiplie l'XP. */
  difficulte: 1 | 2 | 3
  dureeMin: number
  note?: string
  exercices: Exercice[]
}

/** Résultat du petit test de niveau. */
export interface Niveau {
  pompes: number
  tractions: number
  gainage: number // secondes
  date: string
}

export interface LogSerie {
  poids?: number
  reps?: number
}

/** Ce qui a été fait pour une séance donnée un jour donné. */
export interface SuiviSeance {
  /** Pour chaque exercice : tableau de séries cochées. */
  sets: Record<string, boolean[]>
  logs: Record<string, LogSerie[]>
  terminee: boolean
  xp: number
  /** Nom et type au moment où elle a été faite (pour l'historique). */
  nom: string
  type: TypeSeance
}

export interface Penalite {
  texte: string
  xp: number
  faite: boolean
}

export interface Jour {
  seances: Record<string, SuiviSeance>
  /** Séance remplacée par la récup active (bouton « J'ai mal »). */
  remplacements: Record<string, true>
  valide: boolean
  auto?: boolean // dimanche validé automatiquement
  penalite?: Penalite
}

export interface Reglages {
  pseudo: string
  sons: boolean
  vibrations: boolean
  reposDefaut: number
  epsNom: string
  epsStats: Stat[]
}

export interface Etat {
  version: 1
  reglages: Reglages
  niveau: Niveau | null
  debut: string // date de début du programme (pour la progression semaine par semaine)
  xp: number // XP total
  stats: Record<Stat, number>
  serie: number
  meilleureSerie: number
  titres: Record<string, string> // id -> date de déblocage
  titreActif: string | null
  jours: Record<string, Jour>
  dernierJour: string // dernier jour traité par le passage de minuit
}

/** Notifications du Système (fenêtres, plein écran). */
export type Evenement =
  | { kind: 'message'; titre: string; texte?: string; tone?: 'normal' | 'danger' | 'or' }
  | { kind: 'niveau'; niveau: number; rang?: string }
