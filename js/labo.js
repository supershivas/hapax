// Le Labo (section 16) : il MONTRE et compare, il ne modifie rien.
// Chaque sujet utilise les mêmes modules que le jeu : ce qu'on voit ici est
// ce que le jeu dessinera. Ajouter un sujet ou une variante = ajouter une
// entrée dans GROUPES.
import { mountLabo } from './lib/labo-shell.js';
import { spriteCanvas, sheet, spriteToPNG, paletteToGPL, paletteToHex } from './lib/sprites.js';
import { createAudio } from './lib/audio.js';
import { PALETTE, ROLES } from './palette.js';
import { chargerContenu } from './design-store.js';
import { nouvellePartie, avancer } from './game.js';
import { dessiner } from './render.js';

document.documentElement.style.setProperty('--jeu-accent', ROLES.accent);
const NOM = document.title.replace(/^Labo — /, ''); // le nom vient de la page (une apostrophe ne casse rien)
const { sprites, reglages } = await chargerContenu();
const audio = createAudio();

const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
};
const telecharger = (blob, nom) => {
  const a = el('a', { href: URL.createObjectURL(blob), download: nom });
  document.body.append(a); a.click(); a.remove();
};

// La planche d'échelle : tout se mesure au héros (section 7)
function planche(stage, facteur) {
  const p = el('div', { className: 'planche' });
  for (const [nom, rows] of Object.entries(sprites)) {
    p.append(el('figure', {}, spriteCanvas(rows, PALETTE, { scale: facteur }), el('figcaption', { textContent: `${nom} ${rows[0].length}×${rows.length}` })));
  }
  stage.append(p);
}

// Une démo vivante du jeu, avec des réglages modifiés (variantes de réglage)
function demo(stage, modif = {}) {
  const r = structuredClone(reglages);
  for (const [k, v] of Object.entries(modif)) Object.assign(r[k], v);
  const c = el('canvas', { width: 240, height: 135 });
  c.style.cssText = 'width:480px;max-width:100%;image-rendering:pixelated';
  stage.append(c);
  const ctx = c.getContext('2d');
  const etat = nouvellePartie(7, r);
  let t = 0, raf;
  const vue = { width: 240, height: 135 };
  const boucle = () => {
    t += 1 / 60;
    // Le héros se promène tout seul : une boucle lente, toujours la même
    avancer(etat, 1 / 60, { x: Math.cos(t / 2), y: Math.sin(t / 1.3) }, r);
    dessiner(ctx, etat, vue, sprites, r);
    raf = requestAnimationFrame(boucle);
  };
  boucle();
  return () => cancelAnimationFrame(raf);
}

const GROUPES = [
  { id: 'dessin', title: 'Dessin', topics: [
    { id: 'echelle', title: 'Échelle', variants: [
      { title: 'Taille réelle ×4', note: 'Le héros et chaque élément, côte à côte.', status: 'actuelle', render: s => planche(s, 4) },
      { title: 'Taille réelle ×1', note: 'Ce que voit un joueur sur un écran sans agrandissement.', render: s => planche(s, 1) },
    ] },
    { id: 'palette', title: 'Palette', variants: [
      { title: 'Nuancier', note: 'Les couleurs du jeu, et rien d\'autre.', status: 'actuelle', render: s => {
        s.append(el('div', { className: 'nuancier' }, ...Object.entries(PALETTE).map(([k, hex]) => {
          const d = el('div', { textContent: `${k} ${hex}` });
          d.style.background = hex;
          const parLum = Object.values(PALETTE).sort((a, b) => lum(a) - lum(b));
          d.style.color = lum(hex) > 0.3 ? parLum[0] : parLum[parLum.length - 1];
          return d;
        })));
        s.append(el('p', {}, el('button', { className: 'essai', textContent: 'Palette .gpl', onclick: () => telecharger(new Blob([paletteToGPL(PALETTE, NOM)]), 'hapax.gpl') }),
          el('button', { className: 'essai', textContent: 'Palette .hex', onclick: () => telecharger(new Blob([paletteToHex(PALETTE)]), 'hapax.hex') })));
      } },
      { title: 'Contrastes', note: 'Rapport WCAG de chaque paire (4,5 pour du texte, 3 pour un signe).', render: s => {
        const ks = Object.keys(PALETTE);
        const t = el('table', { className: 'contraste' });
        t.append(el('tr', {}, el('th'), ...ks.map(k => el('th', { textContent: k }))));
        for (const a of ks) t.append(el('tr', {}, el('th', { textContent: a }), ...ks.map(b => el('td', { textContent: a === b ? '—' : contraste(PALETTE[a], PALETTE[b]).toFixed(1) }))));
        s.append(t);
      } },
    ] },
    { id: 'sprites', title: 'Sprites', variants: [
      { title: 'Planche', note: 'Tout ce que le jeu peint, à exporter pour le reprendre dans un éditeur.', status: 'actuelle', render: s => {
        const c = sheet(Object.values(sprites), PALETTE, { scale: 6, gap: 2 });
        c.style.imageRendering = 'pixelated';
        s.append(c, el('p'));
        for (const [nom, rows] of Object.entries(sprites)) {
          s.append(el('button', { className: 'essai', textContent: `${nom}.png`, onclick: async () => telecharger(await spriteToPNG(rows, PALETTE, 1), `${nom}.png`) }));
        }
      } },
    ] },
  ] },
  { id: 'jeu', title: 'Jeu', topics: [
    { id: 'vitesse', title: 'Vitesse du héros', variants: [
      { title: `${reglages.heros.vitesse} px/s`, note: 'La vitesse actuelle.', status: 'actuelle', render: s => demo(s) },
      { title: '90 px/s', note: 'Plus vif : le monde paraît plus petit.', render: s => demo(s, { heros: { vitesse: 90 } }) },
      { title: '35 px/s', note: 'Plus lent, plus contemplatif.', render: s => demo(s, { heros: { vitesse: 35 } }) },
    ] },
  ] },
  { id: 'son', title: 'Son', topics: [
    { id: 'bruitages', title: 'Bruitages', variants: [
      { title: 'Banque', note: 'Chaque son du jeu, à écouter.', status: 'actuelle', render: s => {
        audio.unlockOn(s);
        for (const nom of audio.names) s.append(el('button', { className: 'essai', textContent: nom, onclick: () => { audio.unlock(); audio.sfx(nom); } }));
      } },
    ] },
  ] },
];

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

mountLabo(document.getElementById('labo'), { game: NOM, home: './', atelier: 'atelier.html', groups: GROUPES });
