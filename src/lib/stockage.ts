// Sauvegarde locale (localStorage), export / import JSON.
import { STATS_DEPART } from '../config/progression'
import { cleJour } from './date'
import type { Etat } from './types'

const CLE = 'systeme-quetes-v1'

export function etatNeuf(): Etat {
  const aujourdhui = cleJour()
  return {
    version: 1,
    reglages: { pseudo: 'Gugus', sons: true, vibrations: true, reposDefaut: 90, epsNom: 'Volley', epsStats: ['AGILITE', 'ENDURANCE'] },
    niveau: null,
    debut: aujourdhui,
    xp: 0,
    stats: { FORCE: STATS_DEPART, ENDURANCE: STATS_DEPART, AGILITE: STATS_DEPART, VOLONTE: STATS_DEPART },
    serie: 0,
    meilleureSerie: 0,
    titres: {},
    titreActif: null,
    jours: {},
    dernierJour: aujourdhui,
  }
}

/** Vérifie qu'un objet ressemble bien à une sauvegarde et complète les champs manquants. */
export function valider(brut: unknown): Etat | null {
  if (!brut || typeof brut !== 'object') return null
  const b = brut as Partial<Etat>
  if (b.version !== 1 || typeof b.xp !== 'number' || typeof b.jours !== 'object') return null
  const neuf = etatNeuf()
  return { ...neuf, ...b, reglages: { ...neuf.reglages, ...b.reglages }, stats: { ...neuf.stats, ...b.stats } } as Etat
}

export function charger(): Etat {
  try {
    const txt = localStorage.getItem(CLE)
    if (txt) return valider(JSON.parse(txt)) ?? etatNeuf()
  } catch {
    /* sauvegarde illisible : on repart de zéro */
  }
  return etatNeuf()
}

export function sauver(e: Etat) {
  try {
    localStorage.setItem(CLE, JSON.stringify(e))
  } catch {
    /* stockage plein ou bloqué */
  }
}

export function exporter(e: Etat) {
  const blob = new Blob([JSON.stringify(e, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `systeme-sauvegarde-${cleJour()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const effacer = () => localStorage.removeItem(CLE)
