// Le cycle de vie : écran titre → partie → pause ; réglages, sauvegarde,
// mise à jour, debug. Les règles sont dans game.js, le dessin dans render.js.
import { createPixelCanvas } from './lib/pixel-canvas.js';
import { createLoop } from './lib/loop.js';
import { createKeys, stopTypeahead } from './lib/keys.js';
import { createPointer, lockBrowserGestures } from './lib/pointer.js';
import { createGamepad } from './lib/gamepad.js';
import { createStore, autosave, pickJSONFile } from './lib/save.js';
import { createAudio } from './lib/audio.js';
import { startUpdateCheck, loadVersion, loadChangelog, downloadJSON } from './lib/app-update.js';
import { ROLES } from './palette.js';
import { nouvellePartie, avancer } from './game.js';
import { dessiner } from './render.js';
import { chargerContenu } from './design-store.js';

const JEU = 'hapax';
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

// Une seule source pour les couleurs : la palette, posée en variables CSS
for (const [role, couleur] of Object.entries(ROLES)) document.documentElement.style.setProperty(`--jeu-${role}`, couleur);

const store = createStore({
  game: JEU,
  debug: DEBUG,
  entries: {
    partie: { version: 1 },
    prefs: { version: 1, debugWrites: false, defaults: { musique: 70, effets: 80 } },
  },
  secret: ['gh-token'],
});
const prefs = store.load('prefs');
const audio = createAudio({ music: prefs.musique / 100, sfx: prefs.effets / 100 });
audio.unlockOn(document);

const contenu = await chargerContenu();
let etat = null;          // la partie en cours
let cible = null;         // le point visé au doigt (coordonnées du monde)
let camera = { x: 0, y: 0 };

const px = createPixelCanvas($('canvas'), { width: 320, height: 180, mode: 'extend', maxZoom: 2 });
lockBrowserGestures($('ecran'));
stopTypeahead();

// ─── Écrans ────────────────────────────────────────────────────────────────
const enJeu = () => !!etat && $('titre').hidden;
function montrerTitre() {
  loop.pause();
  $('titre').hidden = false;
  $('hud').hidden = true;
  $('continuer').hidden = !store.has('partie');
  ($('continuer').hidden ? $('nouvelle') : $('continuer')).focus();
}
function jouer(partie) {
  etat = partie;
  $('titre').hidden = true;
  $('hud').hidden = false;
  $('score').textContent = etat.score;
  sauvegarder();
  loop.resume();
}
function sauvegarder() { if (etat) store.save('partie', etat); }
function pause() {
  if (!enJeu() || loop.paused) return;
  loop.pause();
  sauvegarder();
  $('dialogue-pause').showModal();
}

$('continuer').onclick = () => jouer(store.load('partie') || nouvellePartie(1, contenu.reglages));
$('nouvelle').onclick = () => {
  const graine = window.__seed ?? Date.now() % 100000; // la graine elle-même peut venir de l'horloge
  if (!store.has('partie')) return jouer(nouvellePartie(graine, contenu.reglages));
  const d = $('dialogue-confirmer');
  d.onclose = () => { if (d.returnValue === 'oui') jouer(nouvellePartie(graine, contenu.reglages)); };
  d.showModal();
};
$('pause').onclick = pause;
$('reprendre').onclick = () => { $('dialogue-pause').close(); };
$('dialogue-pause').addEventListener('close', () => { if (enJeu()) loop.resume(); });
$('quitter').onclick = () => { $('dialogue-pause').close(); sauvegarder(); montrerTitre(); };
$('pause-reglages').onclick = () => $('dialogue-reglages').showModal();
$('ouvrir-reglages').onclick = () => $('dialogue-reglages').showModal();
// Fenêtre quittée : pause (section 9)
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// ─── Réglages ──────────────────────────────────────────────────────────────
for (const [id, cle, canal] of [['vol-musique', 'musique', 'music'], ['vol-effets', 'effets', 'sfx']]) {
  $(id).value = prefs[cle];
  $(id).oninput = e => {
    prefs[cle] = Number(e.target.value);
    audio.setVolume(canal, prefs[cle] / 100);
    store.save('prefs', prefs);
    if (canal === 'sfx') audio.sfx('clic');
  };
}
$('exporter').onclick = () => { sauvegarder(); downloadJSON(store.exportAll(), `${JEU}-sauvegarde.json`); };
$('importer').onclick = async () => {
  try {
    const n = store.importAll(await pickJSONFile());
    toast(`${n} élément(s) importé(s)`);
    setTimeout(() => location.reload(), 800);
  } catch (e) { toast(e.message); }
};
loadVersion().then(v => { $('version').textContent = v ? `v${v}` : ''; });
loadChangelog().then(entrees => {
  $('changelog').replaceChildren(...entrees.flatMap(e => {
    const h = document.createElement('h3'); h.textContent = `v${e.version} — ${e.date}`;
    const ul = document.createElement('ul');
    for (const c of e.changes) { const li = document.createElement('li'); li.textContent = c; ul.append(li); }
    return [h, ul];
  }));
});

function toast(texte) {
  const t = $('toast');
  t.textContent = texte;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2500);
}

// ─── Commandes : clavier, doigt/souris, manette (section 8) ────────────────
const keys = createKeys({
  actions: { pause: ['Escape', 'p'] },
  onAction: nom => { if (nom === 'pause') pause(); },
});
const pad = createGamepad({ actions: { pause: 'start' }, onAction: nom => { if (nom === 'pause') pause(); } });
const versMonde = p => ({ x: p.x + camera.x, y: p.y + camera.y });
createPointer($('canvas'), {
  toLocal: (x, y) => px.toLogical(x, y),
  onTap: p => { cible = versMonde(p); },
  onDragStart: p => { cible = versMonde(p); },
  onDrag: p => { cible = versMonde(p); },
  onDragEnd: () => { cible = null; },
  onWheel: ({ delta }) => px.zoom(-delta),
});

// ─── Boucle ────────────────────────────────────────────────────────────────
const loop = createLoop({
  update(dt) {
    if (!etat) return;
    pad.poll();
    const k = keys.axis(), m = pad.axis();
    const entree = (k.x || k.y) ? k : (m.x || m.y) ? m : cible ? { cible } : {};
    if (entree === k || entree === m) cible = null;
    for (const ev of avancer(etat, dt, entree, contenu.reglages)) {
      if (ev.type === 'etoile') { audio.sfx('pièce'); $('score').textContent = ev.score; window.__jeu?.log('etoile', ev); }
    }
    if (cible && Math.hypot(cible.x - etat.heros.x, cible.y - etat.heros.y) < 2) cible = null;
  },
  render() {
    if (etat) camera = dessiner(px.ctx, etat, px, contenu.sprites, contenu.reglages);
    else { px.ctx.fillStyle = ROLES.fond; px.ctx.fillRect(0, 0, px.width, px.height); }
  },
});
loop.start();
autosave(sauvegarder, { everyMs: 10000 });

// ─── Mise à jour automatique : jamais en pleine partie (section 4) ─────────
startUpdateCheck({
  isBusy: () => enJeu() && !loop.paused,
  beforeReload: sauvegarder,
  onUpdated: v => toast(`Mis à jour en v${v}`),
});

// ─── Mode debug (section 18) : chargé seulement avec ?debug=1 ──────────────
if (DEBUG) {
  const { installDebug, seedFromUrl } = await import('./lib/debug.js');
  window.__seed = seedFromUrl() ?? undefined;
  installDebug({
    state: () => etat && { x: etat.heros.x, y: etat.heros.y, score: etat.score, temps: etat.temps, enJeu: enJeu(), pause: loop.paused },
    places: { centre: { x: contenu.reglages.monde.largeur / 2, y: contenu.reglages.monde.hauteur / 2 }, coin: { x: 10, y: 10 } },
    teleport: ({ x, y }) => { if (etat) { etat.heros.x = x; etat.heros.y = y; } },
    setTimeScale: s => loop.setTimeScale(s),
    setSeed: n => jouer(nouvellePartie(n, contenu.reglages)),
    reset: () => { store.clear('partie'); etat = null; montrerTitre(); },
    extra: { etoiles: () => etat?.etoiles },
  });
}

if (contenu.aPublier) toast(`${contenu.aPublier} retouche(s) de l'atelier pas encore publiée(s)`);
montrerTitre();
