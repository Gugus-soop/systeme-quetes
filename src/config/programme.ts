/**
 * PROGRAMME DE LA SEMAINE — fichier à modifier pour changer les séances.
 *
 * La structure de la semaine (jours, créneaux, EPS, natation) suit ton emploi du temps.
 * Les chiffres s'adaptent tout seuls :
 *  - à ton test de niveau (pompes, tractions, gainage max),
 *  - à la semaine du programme (ça devient plus dur au fil des semaines).
 *
 * Pour changer une valeur fixe, modifie-la directement ci-dessous.
 * Jours : 0 = dimanche, 1 = lundi, … 6 = samedi.
 */
import type { Exercice, Niveau, Reglages, Seance } from '../lib/types'

/** Borne une valeur entre min et max. */
const borne = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)))
/** Arrondit à 5 secondes. */
const a5 = (s: number) => Math.round(s / 5) * 5

/** Valeurs calculées à partir du niveau et de la semaine. */
function calculs(niveau: Niveau | null, semaine: number) {
  const p = niveau?.pompes ?? 30 // valeur par défaut si pas de test
  const g = niveau?.gainage ?? 75
  const t = niveau?.tractions ?? 5
  const bonus = Math.min(4, Math.floor((semaine - 1) / 2)) // +1 rep toutes les 2 semaines, max +4
  return {
    // Salle : 3 séries les 3 premières semaines (apprendre les mouvements), puis 4.
    seriesSalle: semaine <= 3 ? 3 : 4,
    repsLourd: semaine <= 3 ? '8-10' : '6-8',
    repsRowing: semaine <= 3 ? '10' : '8',
    tractionsNegatives: t < 3,
    // Gainage : environ 60 % de ton max, entre 30 s et 90 s.
    gainage: borne(a5(g * 0.6), 30, 90),
    // Mercredi : environ la moitié de ton max de pompes par tour.
    pompes: borne(p * 0.5 + bonus, 5, 25),
    dips: borne(p * 0.45 + bonus, 6, 20),
    piquees: borne(p * 0.3 + bonus / 2, 3, 12),
    // Jeudi : 10 sprints, puis 11 et 12 au fil des semaines.
    sprints: Math.min(12, 10 + Math.floor((semaine - 1) / 2)),
    // Vendredi : l'EMOM monte de 12 à 20 minutes (+2 min par semaine).
    emom: Math.min(20, 12 + 2 * (semaine - 1)),
    emomFort: semaine >= 3,
    chaise: semaine <= 2 ? 45 : 60,
    footing: semaine <= 2 ? 25 : semaine <= 4 ? 30 : 35,
  }
}

/** Échauffement affiché avant chaque séance. */
export const ECHAUFFEMENT = 'Échauffement 5-10 min obligatoire'

/** Construit la semaine complète. */
export function construireSemaine(niveau: Niveau | null, semaine: number, reglages: Reglages): Record<number, Seance[]> {
  const c = calculs(niveau, semaine)

  const salle: Seance = {
    id: 'lundi-salle',
    nom: 'Salle — tout le corps',
    creneau: 'Midi',
    type: 'salle',
    difficulte: 3,
    dureeMin: 45,
    note: 'Fatigué après l’EPS ? Retire une série par exercice. Charge : tu dois finir chaque série avec 1-2 reps en réserve, jamais à l’échec avec une barre.',
    exercices: [
      { kind: 'series', id: 'squat', nom: 'Squat', series: c.seriesSalle, reps: c.repsLourd, charge: true },
      { kind: 'series', id: 'dc', nom: 'Développé couché', series: c.seriesSalle, reps: c.repsLourd, charge: true, astuce: 'Toujours avec quelqu’un pour te parer.' },
      { kind: 'series', id: 'rowing', nom: 'Rowing barre', series: c.seriesSalle, reps: c.repsRowing, charge: true, astuce: 'Dos plat, tire la barre vers le nombril.' },
      { kind: 'series', id: 'sdt', nom: 'Soulevé de terre jambes tendues', series: 3, reps: '10', charge: true, astuce: 'Genoux légèrement fléchis, dos plat. Commence léger.' },
      c.tractionsNegatives
        ? { kind: 'series', id: 'tractions', nom: 'Tractions négatives', series: 3, reps: '4 (descente en 4 s)', noterReps: true, astuce: 'Saute en haut de la barre, puis descends le plus lentement possible.' }
        : { kind: 'series', id: 'tractions', nom: 'Tractions', series: 3, reps: 'max', noterReps: true, astuce: 'Note tes reps : ça sert pour ton graphique.' },
      { kind: 'series', id: 'gainage', nom: 'Gainage', series: 3, reps: `${c.gainage} s`, duree: c.gainage, repos: 45 },
    ],
  }

  const recupMardi: Seance = {
    id: 'mardi-recup',
    nom: 'Récup active',
    creneau: 'Soir',
    type: 'footing',
    difficulte: 1,
    dureeMin: c.footing + 10,
    note: 'Allure où tu peux parler. Marcher 1 min quand ça tire, c’est autorisé : le but est de récupérer, pas de te tuer.',
    exercices: [
      { kind: 'simple', id: 'footing', nom: `Footing tranquille ${c.footing} min`, detail: 'Allure conversation' },
      { kind: 'simple', id: 'etirements', nom: 'Étirements 10 min' },
    ],
  }

  const semaineType: Record<number, Seance[]> = {
    // LUNDI — journée chargée, 3 séances
    1: [
      {
        id: 'lundi-eps',
        nom: `EPS — ${reglages.epsNom}`,
        creneau: 'Cours',
        type: 'eps',
        difficulte: 2,
        dureeMin: 120,
        exercices: [{ kind: 'simple', id: 'eps', nom: `${reglages.epsNom} — 2 h` }],
      },
      salle,
      {
        id: 'lundi-natation',
        nom: 'Natation tranquille',
        creneau: 'Soir',
        type: 'natation',
        difficulte: 1,
        dureeMin: 30,
        note: 'Rythme tranquille : c’est de la récup après la salle.',
        exercices: [{ kind: 'simple', id: 'nage', nom: 'Natation 30 min' }],
      },
    ],
    // MARDI — récup active
    2: [recupMardi],
    // MERCREDI — haut du corps au poids du corps
    3: [
      {
        id: 'mercredi-circuit',
        nom: 'Haut du corps — poids du corps',
        creneau: 'Après-midi',
        type: 'circuit',
        difficulte: 2,
        dureeMin: 35,
        note: "Pompes piquées : mains sur une chaise calée contre un mur, fesses en haut, tête vers le bord de la chaise. Si tu bloques avant la fin : descends lentement (3 s) et remonte comme tu peux. Quand tu en fais 8 propres, passe les mains au sol.",
        exercices: [
          {
            kind: 'circuit',
            id: 'circuit-haut',
            nom: 'Circuit haut du corps',
            tours: 4,
            repos: 90,
            mouvements: [
              `${c.pompes} pompes`,
              `${c.dips} dips sur chaise`,
              `${c.piquees} pompes piquées mains sur une chaise`,
              '20 mountain climbers',
              `Gainage ${c.gainage} s`,
            ],
          },
        ],
      },
    ],
    // JEUDI — cardio fractionné
    4: [
      {
        id: 'jeudi-fractionne',
        nom: 'Cardio fractionné',
        creneau: 'Soir',
        type: 'fractionne',
        difficulte: 3,
        dureeMin: 30,
        note: 'Sprint à environ 90 %, pas à 100 % : tu dois pouvoir tenir le même rythme jusqu’au dernier.',
        exercices: [
          { kind: 'simple', id: 'echauffement-footing', nom: 'Footing d’échauffement 10 min' },
          { kind: 'intervalles', id: 'sprints', nom: `${c.sprints} × (30 s sprint / 30 s marche)`, cycles: c.sprints, travail: 30, recup: 30, libelleTravail: 'SPRINT', libelleRecup: 'MARCHE' },
          { kind: 'simple', id: 'retour-calme', nom: 'Retour au calme 5 min' },
        ],
      },
    ],
    // VENDREDI — jambes intense
    5: [
      {
        id: 'vendredi-jambes',
        nom: 'Jambes intense',
        creneau: 'Soir',
        type: 'jambes',
        difficulte: 3,
        dureeMin: c.emom + 8,
        note: 'Atterris en douceur sur les squats sautés. Si tu ne finis plus dans la minute, enlève 2 squats sautés plutôt que de bâcler.',
        exercices: [
          {
            kind: 'emom',
            id: 'emom-jambes',
            nom: `EMOM ${c.emom} min`,
            minutes: c.emom,
            consigne: c.emomFort ? '10 squats sautés + 10 fentes + 5 burpees' : '8 squats sautés + 8 fentes + 4 burpees',
          },
          { kind: 'series', id: 'chaise', nom: 'Chaise contre un mur', series: 3, reps: `${c.chaise} s`, duree: c.chaise, repos: 60 },
        ],
      },
    ],
    // SAMEDI — natation 1 h
    6: [
      {
        id: 'samedi-natation',
        nom: 'Natation 1 h',
        creneau: 'Soir',
        type: 'natation',
        difficulte: 2,
        dureeMin: 60,
        exercices: [{ kind: 'simple', id: 'nage-1h', nom: 'Natation 1 h' }],
      },
    ],
    // DIMANCHE — repos (validé automatiquement)
    0: [],
  }
  return semaineType
}

/** Séance de remplacement proposée quand tu appuies sur « J'ai mal ». */
export function seanceRemplacement(niveau: Niveau | null, semaine: number, reglages: Reglages): Seance {
  const base = construireSemaine(niveau, semaine, reglages)[2][0]
  return {
    ...base,
    id: 'remplacement-recup',
    nom: 'Récup active (remplacement)',
    note: 'Si la douleur est dans les jambes, remplace le footing par de la marche. Arrête dès que ça fait mal. Si ça dure plus de 3-4 jours ou que ça gonfle : médecin.',
    exercices: base.exercices.map((e): Exercice => (e.kind === 'simple' && e.id === 'footing' ? { ...e, nom: 'Marche ou footing très doux 20-30 min' } : e)),
  }
}

/** Liste des quêtes de pénalité (tirée au hasard). */
export const PENALITES = [
  '50 squats + 2 min de gainage',
  '40 pompes (en plusieurs fois) + 1 min de chaise',
  '100 jumping jacks + 30 fentes',
  '30 burpees en moins de 10 min',
  '3 × 1 min de gainage + 30 squats',
]
export const XP_PENALITE = 60
