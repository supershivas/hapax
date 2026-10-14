// Le cycle de vie : écran titre → visiteurs → l'heure → fin ; pause,
// réglages, sauvegarde, mise à jour, debug. Les règles sont dans regles.js
// (pures) ; ce module ne fait que les appeler et dessiner leur état.
import { createLoop } from './lib/loop.js?v=0.1.0';
import { createKeys, stopTypeahead } from './lib/keys.js?v=0.1.0';
import { lockBrowserGestures } from './lib/pointer.js?v=0.1.0';
import { createGamepad } from './lib/gamepad.js?v=0.1.0';
import { createStore, autosave, pickJSONFile } from './lib/save.js?v=0.1.0';
import { createAudio } from './lib/audio.js?v=0.1.0';
import { startUpdateCheck, loadVersion, loadChangelog, downloadJSON } from './lib/app-update.js?v=0.1.0';
import { ROLES } from './palette.js?v=0.1.0';
import { nouvelleNuit, choisirVisiteurs, ecrire, froisser, bruler, evaluer, contexte, joker } from './regles.js?v=0.1.0';
import { fragment } from './data/fragments.js?v=0.1.0';
import { HEURES } from './data/heures.js?v=0.1.0';
import { chargerContenu } from './design-store.js?v=0.1.0';
import { definirSons } from './sons.js?v=0.1.0';
import { el, carteFragment, carteJoker, bougie, poserBougie, nombre, jouerSequence } from './ecran.js?v=0.1.0';

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
    partie: { version: 1 },                                   // la nuit en cours
    meta: { version: 1, defaults: { nuits: 0, pages: [] } },  // ce qui reste d'une nuit à l'autre
    prefs: { version: 1, debugWrites: false, defaults: { effets: 80 } },
  },
  secret: ['gh-token'],
});
const prefs = store.load('prefs');
const audio = createAudio({ sfx: prefs.effets / 100 });
definirSons(audio);
audio.unlockOn(document);

const { reglages: R } = await chargerContenu();
let etat = null;              // la nuit en cours
let choix = [];               // fragments (ou visiteurs) choisis, dans l'ordre du toucher
let enSequence = false;       // le score se joue : ni geste, ni bougie
const laBougie = bougie();
$('bougie').replaceWith(laBougie);
const bougieTitre = bougie();
$('titre-bougie').append(bougieTitre);

lockBrowserGestures($('ecran'));
stopTypeahead();

// ─── Écrans ────────────────────────────────────────────────────────────────
const ECRANS = ['titre', 'visiteurs', 'table', 'fin'];
function montrer(nom) {
  for (const e of ECRANS) $(e).hidden = e !== nom;
}
const enJeu = () => !!etat && etat.phase === 'manche' && !$('table').hidden;

function montrerTitre() {
  loop.pause();
  montrer('titre');
  $('continuer').hidden = !store.has('partie');
  ($('continuer').hidden ? $('nouvelle') : $('continuer')).focus();
}

function reprendre(nuit) {
  etat = nuit;
  choix = [];
  if (etat.phase === 'visiteurs') { montrerVisiteurs(); return; }
  montrer('table');
  dessinerTable();
  sauvegarder();
  loop.resume();
}

function sauvegarder() { if (etat && etat.phase !== 'fin') store.save('partie', etat); }
function pause() {
  if (!enJeu() || loop.paused) return;
  loop.pause();
  sauvegarder();
  $('dialogue-pause').showModal();
}

function nouvelleGraine() {
  return window.__seed ?? Date.now() % 1000000;   // la graine elle-même peut venir de l'horloge
}
function lancerNuit() { reprendre(nouvelleNuit(nouvelleGraine(), R)); }

$('continuer').onclick = () => { const p = store.load('partie'); if (p) reprendre(p); else lancerNuit(); };
$('nouvelle').onclick = () => {
  if (!store.has('partie')) return lancerNuit();
  const d = $('dialogue-confirmer');
  d.onclose = () => { if (d.returnValue === 'oui') lancerNuit(); };
  d.showModal();
};
$('pause').onclick = pause;
$('reprendre').onclick = () => { $('dialogue-pause').close(); };
$('dialogue-pause').addEventListener('close', () => { if (enJeu()) loop.resume(); });
$('quitter').onclick = () => { $('dialogue-pause').close(); sauvegarder(); montrerTitre(); };
$('pause-reglages').onclick = () => $('dialogue-reglages').showModal();
$('ouvrir-reglages').onclick = () => $('dialogue-reglages').showModal();
$('autre-nuit').onclick = lancerNuit;
$('fin-titre').onclick = montrerTitre;
// Fenêtre quittée : pause (section 9)
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// ─── Les visiteurs ─────────────────────────────────────────────────────────
function montrerVisiteurs() {
  loop.pause();
  montrer('visiteurs');
  $('consigne-visiteurs').textContent = `Garde-en ${R.visiteurs.choisis === 2 ? 'deux' : R.visiteurs.choisis}.`;
  const liste = $('visiteurs-liste');
  liste.replaceChildren(...etat.propositions.map(id => {
    const b = carteJoker(joker(id), { bouton: true, grand: true, choisi: choix.includes(id) });
    b.onclick = () => basculerVisiteur(id);
    return b;
  }));
  $('allumer').disabled = choix.length !== R.visiteurs.choisis;
  liste.querySelector(`[data-id="${choix.at(-1) || etat.propositions[0]}"]`)?.focus();
}
function basculerVisiteur(id) {
  if (choix.includes(id)) choix = choix.filter(x => x !== id);
  else { choix.push(id); if (choix.length > R.visiteurs.choisis) choix.shift(); }
  audio.sfx('feuille');
  montrerVisiteurs();
}
$('allumer').onclick = () => {
  const r = choisirVisiteurs(etat, choix, R);
  if (!r.ok) { audio.sfx('refus'); $('consigne-visiteurs').textContent = r.raison; return; }
  window.__jeu?.log('visiteurs', { jokers: etat.jokers });
  reprendre(etat);
};

// ─── L'heure ───────────────────────────────────────────────────────────────
function dessinerTable() {
  const m = etat.manche;
  $('heure').textContent = HEURES[etat.heure]?.nom || '';
  $('objectif').textContent = nombre(m.objectif);
  $('score').textContent = nombre(m.score);
  $('jokers').replaceChildren(...etat.jokers.map(id => carteJoker(joker(id))));
  dessinerMain();
  $('ecrire').replaceChildren('Écrire', el('small', { textContent: `${R.bougie.coutEcrire} de cire` }));
  $('froisser').replaceChildren('Froisser', el('small', { textContent: `${R.bougie.coutFroisser} de cire` }));
  poserBougie(laBougie, m.cire / R.bougie.cire);
}

function dessinerMain() {
  const m = etat.manche;
  const focus = document.activeElement?.dataset?.id;
  $('main').replaceChildren(...m.main.map(id => {
    const c = carteFragment(id, { choisi: choix.includes(id), hapax: !etat.degresEcrits.includes(fragment(id).degre) });
    c.onclick = () => basculerFragment(id);
    return c;
  }));
  if (focus) $('main').querySelector(`[data-id="${focus}"]`)?.focus();
  apercu();
}

// Ce que donnerait l'écriture choisie : la figure et son total (lecture claire du score)
function apercu() {
  const c = $('calcul');
  c.classList.remove('est-total');
  if (!choix.length) { c.innerHTML = '&nbsp;'; return; }
  const r = evaluer(choix, contexte(etat, R), R);
  c.replaceChildren(el('span', { class: 'nom-figure', textContent: r.figure.nom }), `${nombre(r.points)} × ${nombre(r.mult)}`);
}

function basculerFragment(id) {
  if (enSequence || etat.phase !== 'manche') return;
  if (choix.includes(id)) choix = choix.filter(x => x !== id);
  else if (choix.length >= R.manche.maxEcrits) { dire(`${R.manche.maxEcrits} fragments au plus.`); audio.sfx('refus'); return; }
  else choix.push(id);
  audio.sfx('feuille');
  dessinerMain();
}

function dire(texte) {
  const m = $('message');
  m.textContent = texte;
  clearTimeout(dire.t);
  dire.t = setTimeout(() => { m.textContent = ''; }, 2500);
}

async function gesteEcrire() {
  if (enSequence || !enJeu()) return;
  const ids = [...choix];
  const r = ecrire(etat, ids, R);
  if (!r.ok) { dire(r.raison); audio.sfx('refus'); return; }
  choix = [];
  audio.sfx('plume');
  window.__jeu?.log('ecrire', { ids, figure: r.resultat.figure.id, total: r.resultat.total, score: etat.manche.score });
  sauvegarder();
  await sequence(r.resultat);
  if (r.issue) finHeure(r.issue);
  else dessinerTable();
}

function gesteFroisser() {
  if (enSequence || !enJeu()) return;
  const ids = [...choix];
  const r = froisser(etat, ids, R);
  if (!r.ok) { dire(r.raison); audio.sfx('refus'); return; }
  choix = [];
  audio.sfx('froisser');
  window.__jeu?.log('froisser', { ids });
  sauvegarder();
  if (r.issue) finHeure(r.issue);
  else dessinerTable();
}
$('ecrire').onclick = gesteEcrire;
$('froisser').onclick = gesteFroisser;

// Le score se joue en séquence : la figure, chaque fragment, chaque visiteur, le total
async function sequence(res) {
  enSequence = true;
  const page = $('page');
  const cartes = res.compte;
  const ecrits = etat.manche.ecrits.at(-1).ids;
  page.replaceChildren(...ecrits.map(id => {
    const c = carteFragment(id, { bouton: false });
    if (!cartes.includes(id)) c.classList.add('compte-pas');
    return c;
  }));
  $('main').replaceChildren(...etat.manche.main.map(id => carteFragment(id, { bouton: false, hapax: !etat.degresEcrits.includes(fragment(id).degre) })));
  const calcul = $('calcul');
  await jouerSequence(res.etapes, {
    duree: R.sequence.duree,
    onEtape(e) {
      if (e.type === 'figure') calcul.replaceChildren(el('span', { class: 'nom-figure', textContent: e.nom }), `${nombre(e.points)} × ${nombre(e.mult)}`);
      else if (e.type === 'fragment') {
        const c = page.querySelector(`[data-id="${e.id}"]`);
        c?.classList.add('marque');
        c?.append(el('span', { class: `gain${e.hapax ? ' est-hapax' : ''}`, textContent: `+${e.gain.points}` }));
        audio.sfx(e.hapax ? 'hapax' : 'compte');
      } else if (e.type === 'joker') {
        const j = $('jokers').querySelector(`[data-id="${e.id}"]`);
        j?.classList.remove('agit'); void j?.offsetWidth; j?.classList.add('agit');
        audio.sfx('visiteur');
      } else if (e.type === 'total') {
        calcul.classList.add('est-total');
        calcul.replaceChildren(`${nombre(e.points)} × ${nombre(e.mult)} = ${nombre(e.total)}`);
        $('score').textContent = nombre(etat.manche.score);
        audio.sfx('total');
      }
      if (e.type !== 'figure' && e.type !== 'total') calcul.lastChild.textContent = `${nombre(e.points)} × ${nombre(e.mult)}`;
    },
  });
  await new Promise(f => setTimeout(f, 450));
  page.replaceChildren();
  enSequence = false;
}

function finHeure(issue) {
  loop.pause();
  const m = etat.manche;
  const meta = store.load('meta');
  meta.nuits++;
  meta.pages.push({ heure: HEURES[etat.heure]?.id, issue, score: m.score, objectif: m.objectif, jokers: etat.jokers, date: new Date().toISOString().slice(0, 10) });
  store.save('meta', meta);
  store.clear('partie');
  window.__jeu?.log('fin', { issue, score: m.score });
  audio.sfx(issue === 'sauvee' ? 'sauvee' : 'eteinte');
  $('fin-heure').textContent = HEURES[etat.heure]?.nom || '';
  $('fin-verdict').textContent = issue === 'sauvee' ? 'La page est écrite.' : issue === 'eteinte' ? 'La bougie s\'est éteinte.' : 'Il n\'y a plus rien à écrire.';
  $('fin-score').textContent = `${nombre(m.score)} sur ${nombre(m.objectif)}`;
  poserBougie(laBougie, m.cire / R.bougie.cire);
  montrer('fin');
  $('autre-nuit').focus();
}

// ─── Réglages ──────────────────────────────────────────────────────────────
$('vol-effets').value = prefs.effets;
$('vol-effets').oninput = e => {
  prefs.effets = Number(e.target.value);
  audio.setVolume('sfx', prefs.effets / 100);
  store.save('prefs', prefs);
  audio.sfx('feuille');
};
if (document.documentElement.requestFullscreen) {
  $('plein-ecran').hidden = false;
  $('plein-ecran').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
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
  $('changelog').replaceChildren(...entrees.flatMap(e => [
    el('h3', { textContent: `v${e.version} — ${e.date}` }),
    el('ul', {}, ...e.changes.map(c => el('li', { textContent: c }))),
  ]));
});

function toast(texte) {
  const t = $('toast');
  t.textContent = texte;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2500);
}

// ─── Commandes : clavier, doigt/souris, manette (section 8) ────────────────
// Chaque fragment et chaque visiteur est un bouton : le doigt, la souris, Tab
// et Espace marchent tout seuls. Le clavier ajoute 1 à 8, E, F, les flèches.
function deplacerFocus(sens) {
  const zone = !$('visiteurs').hidden ? $('visiteurs-liste') : $('main');
  const cartes = [...zone.querySelectorAll('button')];
  if (!cartes.length) return;
  const i = cartes.indexOf(document.activeElement);
  cartes[(i + sens + cartes.length) % cartes.length].focus();
}
function action(nom) {
  if (nom === 'pause') return pause();
  if (nom === 'gauche') return deplacerFocus(-1);
  if (nom === 'droite') return deplacerFocus(1);
  if (nom === 'choisir') return document.activeElement?.click();
  if (!$('visiteurs').hidden) {
    if (nom.startsWith('carte')) { const id = etat.propositions[Number(nom.slice(5)) - 1]; if (id) basculerVisiteur(id); }
    if (nom === 'ecrire' && !$('allumer').disabled) $('allumer').click();
    return;
  }
  if (!enJeu()) return;
  if (nom === 'ecrire') return gesteEcrire();
  if (nom === 'froisser') return gesteFroisser();
  if (nom.startsWith('carte')) { const id = etat.manche.main[Number(nom.slice(5)) - 1]; if (id) basculerFragment(id); }
}
const touchesCartes = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(n => [`carte${n}`, [`Digit${n}`, `Numpad${n}`]]));
createKeys({
  actions: { pause: ['Escape', 'p'], ecrire: 'e', froisser: 'f', gauche: 'ArrowLeft', droite: 'ArrowRight', ...touchesCartes },
  onAction: action,
});
const pad = createGamepad({
  actions: { pause: 'start', gauche: 'left', droite: 'right', choisir: 'a', ecrire: 'x', froisser: 'y' },
  onAction: action,
});

// ─── Boucle : la bougie brûle en temps de jeu (jamais pendant la séquence) ──
const loop = createLoop({
  update(dt) {
    pad.poll();
    if (!etat || etat.phase !== 'manche' || enSequence) return;
    const issue = bruler(etat, dt, R);
    if (issue) finHeure(issue);
  },
  render() {
    if (etat?.manche && !$('table').hidden) poserBougie(laBougie, etat.manche.cire / R.bougie.cire);
  },
});
loop.start();
autosave(sauvegarder, { everyMs: 5000 });

// ─── Mise à jour automatique : jamais en pleine heure (section 4) ──────────
startUpdateCheck({
  isBusy: () => enJeu() && !loop.paused,
  beforeReload: sauvegarder,
  onUpdated: v => toast(`Mis à jour en v${v}`),
});

// ─── Mode debug (section 18) : chargé seulement avec ?debug=1 ──────────────
if (DEBUG) {
  const { installDebug, seedFromUrl } = await import('./lib/debug.js?v=0.1.0');
  const { meilleureEcriture } = await import('./strategie.js?v=0.1.0');
  window.__seed = seedFromUrl() ?? undefined;
  installDebug({
    state: () => etat && {
      phase: etat.phase, seed: etat.seed, jokers: etat.jokers, degresEcrits: etat.degresEcrits,
      ...(etat.manche && { score: etat.manche.score, objectif: etat.manche.objectif, cire: +etat.manche.cire.toFixed(2), main: etat.manche.main, issue: etat.manche.issue }),
      choix, enSequence, pause: loop.paused,
    },
    setTimeScale: s => loop.setTimeScale(s),
    setSeed: n => reprendre(nouvelleNuit(n, R)),
    reset: () => { store.clear('partie'); etat = null; montrerTitre(); },
    extra: {
      // Choisit la meilleure écriture (le joueur appliqué) : pour les captures et les tests
      choisirMeilleur: () => { choix = meilleureEcriture(etat, R).ids; dessinerMain(); return choix; },
      visiteurs: ids => { choix = ids || etat.propositions.slice(0, R.visiteurs.choisis); $('allumer').click(); },
    },
  });
}

montrerTitre();
