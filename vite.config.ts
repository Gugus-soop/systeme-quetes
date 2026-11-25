import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

/**
 * Petit plugin maison : génère le service worker au moment du build
 * avec la liste exacte des fichiers produits (noms avec empreinte),
 * pour que l'app fonctionne hors ligne dès la première visite.
 */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker-maison',
    apply: 'build',
    generateBundle(_options, bundle) {
      // On précharge le code et les polices latines (woff2) ; le reste se met en cache à la demande.
      const fichiers = Object.keys(bundle)
        .filter((f) => !/\.woff$/.test(f) && !/(cyrillic|greek|vietnamese)/.test(f))
        .map((f) => './' + f)
      const publics = [
        './',
        './index.html',
        './manifest.webmanifest',
        './icons/icon-192.png',
        './icons/icon-512.png',
        './icons/icon-maskable-512.png',
        './icons/apple-touch-icon.png',
      ]
      const modele = readFileSync('sw/sw.js', 'utf8')
      const code = modele
        .replace('__VERSION__', String(Date.now()))
        .replace('__PRECACHE__', JSON.stringify([...publics, ...fichiers.filter((f) => f !== './index.html')]))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: code })
    },
  }
}

export default defineConfig({
  // Chemins relatifs : marche sur GitHub Pages (sous-dossier) comme sur Vercel.
  base: './',
  plugins: [react(), tailwindcss(), serviceWorker()],
})
