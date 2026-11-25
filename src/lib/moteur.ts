/**
 * MOTEUR DU SYSTÈME — toutes les règles du jeu.
 * Chaque fonction modifie une copie de l'état et ajoute des événements
 * (messages, montée de niveau) que l'interface affiche ensuite.
 */
import { PENALITES, XP_PENALITE, construireSemaine, seanceRemplacement } from '../config/programme'
import {
  GAIN_STATS, TITRES, XP_JOUR, XP_SEANCE, XP_SERIE, XP_SIMPLE, niveauDepuisXp, rangDuNiveau, type Compteurs,
} from '../config/progression'
import { ajouterJours, ecartJours, jourSemaine } from './date'
import type { Etat, Evenement, Exercice, Jour, Seance, SuiviSeance, TypeSeance } from './types'

/* ---------- Lecture ---------- */

/** Semaine du programme (1 = première semaine). */
export const semaineProgramme = (e: Etat, cle: string) => Math.max(1, Math.floor(ecartJours(e.debut, cle) / 7) + 1)

/** Séances prévues un jour donné, avec les remplacements « J'ai mal ». */
export function seancesDuJour(e: Etat, cle: string): Seance[] {
  const sem = semaineProgramme(e, cle)
  const prevues = construireSemaine(e.niveau, sem, e.reglages)[jourSemaine(cle)] ?? []
  const jour = e.jours[cle]
  return prevues.map((s) =>
    jour?.remplacements[s.id] ? { ...seanceRemplacement(e.niveau, sem, e.reglages), id: `${s.id}~recup`, creneau: s.creneau } : s,
  )
}

/** Nombre de cases à cocher d'un exercice. */
export const nbSeries = (ex: Exercice) => (ex.kind === 'series' ? ex.series : ex.kind === 'circuit' ? ex.tours : 1)

export const jourVide = (): Jour => ({ seances: {}, remplacements: {}, valide: false })

function suiviDe(e: Etat, cle: string, s: Seance): SuiviSeance {
  const jour = (e.jours[cle] ??= jourVide())
  const suivi = (jour.seances[s.id] ??= { sets: {}, logs: {}, terminee: false, xp: 0, nom: s.nom, type: s.type })
  for (const ex of s.exercices) {
    const n = nbSeries(ex)
    const sets = (suivi.sets[ex.id] ??= [])
    while (sets.length < n) sets.push(false)
    sets.length = n
    suivi.logs[ex.id] ??= []
  }
  return suivi
}

/** Lecture seule : suivi d'une séance (ou vide). */
export function lireSuivi(e: Etat, cle: string, s: Seance) {
  return e.jours[cle]?.seances[s.id]
}

export const seanceFinie = (suivi: SuiviSeance | undefined, s: Seance) =>
  !!suivi && s.exercices.every((ex) => (suivi.sets[ex.id] ?? []).length === nbSeries(ex) && suivi.sets[ex.id].every(Boolean))

/** XP rapportée par une case cochée. */
const xpCase = (s: Seance, ex: Exercice) =>
  (ex.kind === 'simple' ? XP_SIMPLE : ex.kind === 'intervalles' || ex.kind === 'emom' ? XP_SIMPLE * 2 : XP_SERIE) * s.difficulte

/* ---------- XP, niveaux, stats ---------- */

function ajouterXp(e: Etat, n: number, ev: Evenement[]) {
  const avant = niveauDepuisXp(e.xp).niveau
  e.xp = Math.max(0, e.xp + n)
  const apres = niveauDepuisXp(e.xp).niveau
  if (apres > avant) {
    const rangAvant = rangDuNiveau(avant).rang
    const rangApres = rangDuNiveau(apres).rang
    ev.push({ kind: 'niveau', niveau: apres, rang: rangApres !== rangAvant ? rangApres : undefined })
  }
}

function gagnerStats(e: Etat, type: TypeSeance) {
  const gains: Partial<Record<string, number>> = { ...GAIN_STATS[type] }
  if (type === 'eps') for (const st of e.reglages.epsStats) gains[st] = (gains[st] ?? 0) + 2
  gains.VOLONTE = (gains.VOLONTE ?? 0) + 1
  const morceaux: string[] = []
  for (const [st, v] of Object.entries(gains)) {
    if (!v) continue
    e.stats[st as keyof Etat['stats']] += v
    morceaux.push(`${st === 'AGILITE' ? 'AGILITÉ' : st === 'VOLONTE' ? 'VOLONTÉ' : st} +${v}`)
  }
  return morceaux.join(' · ')
}

/* ---------- Actions ---------- */

/** Coche ou décoche une série. `log` = poids / reps notés. */
export function basculerSerie(
  e: Etat, cle: string, s: Seance, exId: string, index: number, ev: Evenement[], log?: { poids?: number; reps?: number }, forcer?: boolean,
) {
  const suivi = suiviDe(e, cle, s)
  const ex = s.exercices.find((x) => x.id === exId)
  if (!ex) return
  const etaitCoche = suivi.sets[exId][index]
  const coche = forcer ?? !etaitCoche
  if (log) suivi.logs[exId][index] = log
  if (coche === etaitCoche) return
  suivi.sets[exId][index] = coche
  const gain = xpCase(s, ex)
  suivi.xp += coche ? gain : -gain
  ajouterXp(e, coche ? gain : -gain, ev)

  if (coche && !suivi.terminee && seanceFinie(suivi, s)) terminerSeance(e, cle, s, suivi, ev)
}

function terminerSeance(e: Etat, cle: string, s: Seance, suivi: SuiviSeance, ev: Evenement[]) {
  suivi.terminee = true
  const bonus = XP_SEANCE * s.difficulte
  suivi.xp += bonus
  const gains = gagnerStats(e, s.type)
  ev.push({ kind: 'message', titre: 'LA QUÊTE A ÉTÉ ACCOMPLIE.', texte: `${s.nom} — +${bonus} XP bonus\n${gains}` })
  ajouterXp(e, bonus, ev)
  verifierJour(e, cle, ev)
  verifierTitres(e, ev)
}

/** Si toutes les séances du jour sont finies : jour validé, série +1. */
function verifierJour(e: Etat, cle: string, ev: Evenement[]) {
  const jour = (e.jours[cle] ??= jourVide())
  if (jour.valide) return
  const seances = seancesDuJour(e, cle)
  if (!seances.every((s) => jour.seances[s.id]?.terminee)) return
  jour.valide = true
  e.serie++
  e.meilleureSerie = Math.max(e.meilleureSerie, e.serie)
  e.stats.VOLONTE += 1
  ev.push({ kind: 'message', titre: '[QUÊTE QUOTIDIENNE TERMINÉE]', texte: `Série : ${e.serie} jour${e.serie > 1 ? 's' : ''}. VOLONTÉ +1 · +${XP_JOUR} XP`, tone: 'or' })
  ajouterXp(e, XP_JOUR, ev)
}

/** Remplace une séance par la récup active (« J'ai mal »). */
export function remplacerSeance(e: Etat, cle: string, seanceId: string, ev: Evenement[]) {
  const jour = (e.jours[cle] ??= jourVide())
  jour.remplacements[seanceId] = true
  ev.push({ kind: 'message', titre: '[QUÊTE MODIFIÉE]', texte: 'La séance a été remplacée par une récup active. Écoute ton corps.' })
}

export function annulerRemplacement(e: Etat, cle: string, seanceId: string) {
  delete e.jours[cle]?.remplacements[seanceId]
}

/** Valide la quête de pénalité. */
export function faireLaPenalite(e: Etat, cle: string, ev: Evenement[]) {
  const p = e.jours[cle]?.penalite
  if (!p || p.faite) return
  p.faite = true
  ev.push({ kind: 'message', titre: 'PÉNALITÉ ACCOMPLIE.', texte: `Ta série est sauvée. +${p.xp} XP`, tone: 'or' })
  ajouterXp(e, p.xp, ev)
  verifierTitres(e, ev)
}

/**
 * PASSAGE DE MINUIT — traite tous les jours écoulés depuis la dernière ouverture.
 *  - dimanche : validé automatiquement (série +1) ;
 *  - jour raté : quête de pénalité le lendemain ;
 *  - pénalité ignorée : la série est cassée.
 */
export function passageMinuit(e: Etat, aujourdhui: string, ev: Evenement[]) {
  let d = e.dernierJour || aujourdhui
  while (d < aujourdhui) {
    const jour = (e.jours[d] ??= jourVide())
    if (jourSemaine(d) === 0 && !jour.valide) validerDimanche(e, d)
    if (jour.penalite && !jour.penalite.faite && e.serie > 0) {
      e.serie = 0
      ev.push({ kind: 'message', titre: '[SÉRIE BRISÉE]', texte: 'La quête de pénalité a été ignorée. Ta série repart de zéro.', tone: 'danger' })
    }
    const lendemain = ajouterJours(d, 1)
    if (!jour.valide) {
      const demain = (e.jours[lendemain] ??= jourVide())
      if (!demain.penalite) {
        const texte = PENALITES[Math.abs(hash(lendemain)) % PENALITES.length]
        demain.penalite = { texte, xp: XP_PENALITE, faite: false }
        if (lendemain === aujourdhui)
          ev.push({ kind: 'message', titre: '[AVERTISSEMENT]', texte: 'La quête d’hier n’a pas été accomplie. Une quête de pénalité a été ajoutée.', tone: 'danger' })
      }
    }
    d = lendemain
  }
  e.dernierJour = aujourdhui
  if (jourSemaine(aujourdhui) === 0 && !(e.jours[aujourdhui]?.valide)) validerDimanche(e, aujourdhui)
}

function validerDimanche(e: Etat, d: string) {
  const jour = (e.jours[d] ??= jourVide())
  jour.valide = true
  jour.auto = true
  e.serie++
  e.meilleureSerie = Math.max(e.meilleureSerie, e.serie)
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)

/* ---------- Titres ---------- */

export function compteurs(e: Etat): Compteurs {
  const parType: Record<TypeSeance, number> = { salle: 0, natation: 0, footing: 0, fractionne: 0, circuit: 0, jambes: 0, eps: 0, recup: 0 }
  let seances = 0, series = 0, penalitesFaites = 0, maxTractions = 0, joursValides = 0
  let lundiComplet = false
  for (const [cle, jour] of Object.entries(e.jours)) {
    if (jour.valide && !jour.auto) joursValides++
    if (jour.penalite?.faite) penalitesFaites++
    if (jour.valide && !jour.auto && jourSemaine(cle) === 1 && Object.keys(jour.remplacements).length === 0) lundiComplet = true
    for (const suivi of Object.values(jour.seances)) {
      for (const sets of Object.values(suivi.sets)) series += sets.filter(Boolean).length
      for (const l of suivi.logs.tractions ?? []) maxTractions = Math.max(maxTractions, l?.reps ?? 0)
      if (suivi.terminee) {
        seances++
        parType[suivi.type]++
      }
    }
  }
  maxTractions = Math.max(maxTractions, e.niveau?.tractions ?? 0)
  return { seances, parType, series, serie: e.serie, lundiComplet, penalitesFaites, maxTractions, niveau: niveauDepuisXp(e.xp).niveau, joursValides }
}

export function verifierTitres(e: Etat, ev: Evenement[]) {
  const c = compteurs(e)
  for (const t of TITRES) {
    if (e.titres[t.id] || !t.test(c)) continue
    e.titres[t.id] = new Date().toISOString()
    e.titreActif = t.id
    ev.push({ kind: 'message', titre: '[TITRE DÉBLOQUÉ]', texte: `« ${t.nom} »`, tone: 'or' })
  }
}
