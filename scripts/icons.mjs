// Génère les icônes de l'app à partir de scripts/logo.png (logo fait avec ChatGPT).
// Sans dépendance : lit le PNG, le réduit (moyenne des pixels) et réécrit des PNG.
// Utilisation : npm run icons
import { deflateSync, inflateSync } from 'node:zlib'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

/* ---------- Lecture PNG (8 bits, RGB ou RGBA, non entrelacé) ---------- */
function lirePng(fichier) {
  const buf = readFileSync(fichier)
  let pos = 8, largeur = 0, hauteur = 0, type = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const nom = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (nom === 'IHDR') {
      largeur = data.readUInt32BE(0); hauteur = data.readUInt32BE(4); type = data[9]
      if (data[8] !== 8 || data[12] !== 0) throw new Error('PNG non pris en charge')
    } else if (nom === 'IDAT') idat.push(data)
    pos += 12 + len
  }
  const can = type === 6 ? 4 : type === 2 ? 3 : 0
  if (!can) throw new Error('PNG doit être RGB ou RGBA')
  const brut = inflateSync(Buffer.concat(idat))
  const ligne = largeur * can
  const px = Buffer.alloc(largeur * hauteur * 4)
  const prec = Buffer.alloc(ligne), cur = Buffer.alloc(ligne)
  for (let y = 0; y < hauteur; y++) {
    const f = brut[y * (ligne + 1)]
    brut.copy(cur, 0, y * (ligne + 1) + 1, (y + 1) * (ligne + 1))
    for (let i = 0; i < ligne; i++) {
      const a = i >= can ? cur[i - can] : 0, b = prec[i], c = i >= can ? prec[i - can] : 0
      let v = cur[i]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      cur[i] = v & 255
    }
    for (let x = 0; x < largeur; x++) {
      const o = (y * largeur + x) * 4
      px[o] = cur[x * can]; px[o + 1] = cur[x * can + 1]; px[o + 2] = cur[x * can + 2]; px[o + 3] = can === 4 ? cur[x * can + 3] : 255
    }
    cur.copy(prec)
  }
  return { largeur, hauteur, px }
}

/* ---------- Écriture PNG ---------- */
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]) }
function ecrirePng(fichier, taille, px) {
  const lignes = Buffer.alloc(taille * (taille * 4 + 1))
  for (let y = 0; y < taille; y++) px.copy(lignes, y * (taille * 4 + 1) + 1, y * taille * 4, (y + 1) * taille * 4)
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(taille, 0); ihdr.writeUInt32BE(taille, 4); ihdr[8] = 8; ihdr[9] = 6
  writeFileSync(fichier, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(lignes, { level: 9 })), chunk('IEND', Buffer.alloc(0))]))
}

/* ---------- Réduction (moyenne par zone) ---------- */
function reduire({ largeur, hauteur, px }, taille) {
  const out = Buffer.alloc(taille * taille * 4)
  const cote = Math.min(largeur, hauteur), ox = (largeur - cote) / 2, oy = (hauteur - cote) / 2
  const k = cote / taille
  for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) {
    const x0 = Math.floor(ox + x * k), x1 = Math.max(x0 + 1, Math.floor(ox + (x + 1) * k))
    const y0 = Math.floor(oy + y * k), y1 = Math.max(y0 + 1, Math.floor(oy + (y + 1) * k))
    const s = [0, 0, 0, 0]; let n = 0
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const o = (yy * largeur + xx) * 4; for (let c = 0; c < 4; c++) s[c] += px[o + c]; n++ }
    const o = (y * taille + x) * 4
    for (let c = 0; c < 4; c++) out[o + c] = Math.round(s[c] / n)
  }
  return out
}

const logo = lirePng('scripts/logo.png')
mkdirSync('public/icons', { recursive: true })
for (const [nom, taille] of [['icon-192', 192], ['icon-512', 512], ['icon-maskable-512', 512], ['apple-touch-icon', 180]])
  ecrirePng(`public/icons/${nom}.png`, taille, reduire(logo, taille))
console.log('Icônes générées depuis scripts/logo.png')
