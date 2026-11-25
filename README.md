# Le Système — quêtes de sport (PWA)

App de sport façon jeu de rôle : quêtes quotidiennes, niveaux, rangs E → S, titres.
Données stockées uniquement sur le téléphone (localStorage). Fonctionne hors ligne.

## Commandes
- `npm install` : installe les dépendances
- `npm run dev` : version de développement
- `npm run build` : construit l'app dans `dist/`
- `npm run preview` : teste la version construite (http://localhost:8792)
- `npm run deploy` : met l'app en ligne (GitHub Pages, branche gh-pages)
- `npm run icons` : régénère les icônes depuis `scripts/logo.png`

## Modifier le programme
- Séances, séries, reps : `src/config/programme.ts`
- XP, niveaux, rangs, stats, titres : `src/config/progression.ts`

## Plan des fichiers
```
index.html                  page + liens manifest / icônes
vite.config.ts              config + génération du service worker
sw/sw.js                    modèle du service worker (hors ligne)
public/manifest.webmanifest PWA installable
public/icons/               icônes (logo ChatGPT)
scripts/icons.mjs           redimensionne le logo en icônes
src/main.tsx                démarrage, polices, service worker
src/App.tsx                 navigation entre les écrans
src/index.css               thème sombre, panneaux, animations
src/config/programme.ts     LE PROGRAMME (à modifier)
src/config/progression.ts   XP, rangs, stats, titres
src/lib/types.ts            types
src/lib/moteur.ts           règles : XP, séries, pénalités, minuit, titres
src/lib/store.tsx           état global + sauvegarde
src/lib/stockage.ts         localStorage, export / import JSON
src/lib/date.ts             dates
src/lib/sons.ts             bips (Web Audio) + vibrations
src/components/             Panneau, Minuteur, Graphique, Superposition
src/screens/                Statut, Quete, Seance, Planning, Historique, Reglages, TestNiveau

```
