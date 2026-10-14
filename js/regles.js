// Les règles : du JS pur, sans DOM, sans hasard ni horloge du navigateur
// (sections 10 et 12). Même graine, mêmes gestes → même nuit. Se teste dans
// Node (test/). Chaque geste impossible est refusé avec sa raison.
//
// Une nuit : on choisit ses visiteurs (les jokers), puis chaque heure est une
// manche. Dans une manche, on a une main de fragments ; on en ÉCRIT 1 à 5
// (ils forment une figure qui marque des points × mult) ou on en FROISSE 1 à 5
// (pour en piocher d'autres). La bougie brûle avec le temps, et chaque geste
// lui coûte de la cire. L'heure est sauvée si le score atteint l'objectif
// avant que la bougie s'éteigne.
import { createRng } from './lib/rng.js';
import { REGLAGES } from './data/reglages.js';
import { FIGURES } from './data/figures.js';
import { JOKERS } from './data/jokers.js';
import { fragment, toutLeJeu } from './data/fragments.js';

const JOKER = Object.fromEntries(JOKERS.map(j => [j.id, j]));
export const joker = id => JOKER[id];

// ─── La nuit ───────────────────────────────────────────────────────────────
export function nouvelleNuit(seed = 1, r = REGLAGES) {
  const visiteurs = createRng(seed).fork('visiteurs').shuffle(JOKERS.map(j => j.id));
  return {
    seed,
    phase: 'visiteurs',           // visiteurs → manche → fin
    propositions: visiteurs.slice(0, r.visiteurs.proposes),
    jokers: [],
    heure: 0,
    degresEcrits: [],             // les degrés déjà écrits cette nuit (le hapax)
    manche: null,
  };
}

const refus = raison => ({ ok: false, raison });

export function choisirVisiteurs(etat, ids, r = REGLAGES) {
  if (etat.phase !== 'visiteurs') return refus('Les visiteurs sont déjà venus.');
  const uniques = [...new Set(ids)];
  if (uniques.some(id => !etat.propositions.includes(id))) return refus('Ce visiteur n\'est pas venu cette nuit.');
  if (uniques.length !== r.visiteurs.choisis) return refus(`Garde ${r.visiteurs.choisis} visiteurs.`);
  etat.jokers = uniques.slice(0, r.visiteurs.places);
  commencerHeure(etat, r);
  return { ok: true };
}

function commencerHeure(etat, r) {
  const pioche = createRng(etat.seed).fork(`heure-${etat.heure}`).shuffle(toutLeJeu());
  etat.manche = {
    objectif: r.manche.objectif,
    score: 0,
    cire: r.bougie.cire,
    pioche,                       // on pioche par la fin (pop)
    main: [],
    ecrits: [],                   // [{ ids, figure, total }]
    froisses: 0,                  // feuillets froissés dans l'heure
    issue: null,                  // 'sauvee' | 'eteinte' | 'epuisee'
  };
  etat.phase = 'manche';
  piocher(etat.manche, r);
}

function piocher(m, r) {
  while (m.main.length < r.manche.main && m.pioche.length) m.main.push(m.pioche.pop());
  m.main.sort(ordreMain);
}
export const ordreMain = (a, b) => fragment(a).degre - fragment(b).degre || a.localeCompare(b);

// ─── Le temps ──────────────────────────────────────────────────────────────
// dt en secondes de jeu (la boucle, jamais l'horloge). Rend l'issue si la
// bougie s'éteint pendant ce pas.
export function bruler(etat, dt, r = REGLAGES) {
  const m = etat.manche;
  if (etat.phase !== 'manche' || m.issue) return null;
  m.cire = Math.max(0, m.cire - r.bougie.combustion * dt);
  if (m.cire <= 0) return finir(etat, 'eteinte');
  return null;
}

function finir(etat, issue) {
  etat.manche.issue = issue;
  etat.phase = 'fin';
  return issue;
}

// ─── Les gestes ────────────────────────────────────────────────────────────
function verifierChoix(etat, ids, r) {
  if (etat.phase !== 'manche') return 'L\'heure est passée.';
  if (!ids.length) return 'Choisis d\'abord des fragments.';
  if (ids.length > r.manche.maxEcrits) return `${r.manche.maxEcrits} fragments au plus.`;
  if (new Set(ids).size !== ids.length || ids.some(id => !etat.manche.main.includes(id))) return 'Ce fragment n\'est pas en main.';
  return null;
}

export function ecrire(etat, ids, r = REGLAGES) {
  const pb = verifierChoix(etat, ids, r);
  if (pb) return refus(pb);
  const m = etat.manche;
  const resultat = evaluer(ids, contexte(etat, r), r);
  m.score += resultat.total;
  for (const id of ids) {
    const d = fragment(id).degre;
    if (!etat.degresEcrits.includes(d)) etat.degresEcrits.push(d);
  }
  m.main = m.main.filter(id => !ids.includes(id));
  m.ecrits.push({ ids: [...ids], figure: resultat.figure.id, total: resultat.total });
  m.cire = Math.max(0, m.cire - r.bougie.coutEcrire);
  piocher(m, r);
  let issue = null;
  if (m.score >= m.objectif) issue = finir(etat, 'sauvee');       // le dernier mot compte, même à la dernière goutte
  else if (m.cire <= 0) issue = finir(etat, 'eteinte');
  else if (!m.main.length) issue = finir(etat, 'epuisee');
  return { ok: true, resultat, issue };
}

export function froisser(etat, ids, r = REGLAGES) {
  const pb = verifierChoix(etat, ids, r);
  if (pb) return refus(pb);
  const m = etat.manche;
  m.main = m.main.filter(id => !ids.includes(id));
  m.froisses += ids.length;
  m.cire = Math.max(0, m.cire - r.bougie.coutFroisser);
  piocher(m, r);
  let issue = null;
  if (m.cire <= 0) issue = finir(etat, 'eteinte');
  else if (!m.main.length) issue = finir(etat, 'epuisee');
  return { ok: true, issue };
}

// Ce que le score d'une écriture doit savoir de la partie
export function contexte(etat, r = REGLAGES) {
  const m = etat.manche;
  return {
    jokers: etat.jokers,
    degresEcrits: etat.degresEcrits,
    bougie: m ? m.cire / r.bougie.cire : 1,
    froisses: m ? m.froisses : 0,
  };
}

// ─── Les figures ───────────────────────────────────────────────────────────
// Chaque forme rend les fragments qui comptent, ou null.
const FORMES = {
  suiteMemeSorte: f => (f.suite && f.memeSorte ? f.tous : null),
  carre: f => f.groupe(4),
  full: f => (f.groupes[0]?.length === 3 && f.groupes[1]?.length === 2 ? f.tous : null),
  memeSorte: f => (f.memeSorte ? f.tous : null),
  suite: f => (f.suite ? f.tous : null),
  brelan: f => f.groupe(3),
  deuxPaires: f => (f.groupes[0]?.length >= 2 && f.groupes[1]?.length >= 2 ? [...f.groupes[0].slice(0, 2), ...f.groupes[1].slice(0, 2)] : null),
  paire: f => f.groupe(2),
  seul: f => [f.tous.reduce((a, b) => (fragment(b).degre > fragment(a).degre ? b : a))],
};

export function reconnaitre(ids) {
  const frags = ids.map(fragment);
  const parDegre = new Map();
  for (const fr of frags) parDegre.set(fr.degre, [...(parDegre.get(fr.degre) || []), fr.id]);
  // Les groupes de même degré, les plus nombreux d'abord, puis les plus hauts
  const groupes = [...parDegre.entries()].sort((a, b) => b[1].length - a[1].length || b[0] - a[0]).map(([, g]) => g);
  const degres = [...parDegre.keys()].sort((a, b) => a - b);
  const info = {
    tous: ids,
    groupes,
    groupe: n => groupes.find(g => g.length >= n)?.slice(0, n) || null,
    memeSorte: ids.length === 5 && frags.every(fr => fr.sorte === frags[0].sorte),
    suite: ids.length === 5 && degres.length === 5 && degres[4] - degres[0] === 4,
  };
  for (const figure of FIGURES) {
    const compte = FORMES[figure.regle](info);
    if (compte) return { figure, compte };
  }
  throw new Error('Aucune figure : la Scolie convient toujours');
}

// ─── Le score ──────────────────────────────────────────────────────────────
// Rend le résultat ET ses étapes, dans l'ordre où le joueur les verra : la
// figure, chaque fragment qui compte (et les visiteurs qu'il réveille), puis
// les visiteurs d'ensemble, dans l'ordre de leurs places.
export function evaluer(ids, ctx, r = REGLAGES) {
  const { figure, compte } = reconnaitre(ids);
  let points = r.points[figure.id];
  let mult = r.mult[figure.id];
  const etapes = [{ type: 'figure', id: figure.id, nom: figure.nom, points, mult }];
  const jokers = ctx.jokers.map(joker).filter(Boolean);

  for (const id of compte) {
    const fr = fragment(id);
    const hapax = !ctx.degresEcrits.includes(fr.degre);
    const p = fr.degre * (hapax ? r.hapax.facteur : 1);
    points += p;
    etapes.push({ type: 'fragment', id, hapax, gain: { points: p }, points, mult });
    for (const j of jokers) {
      const e = j.effet;
      if (e.quand !== 'fragment') continue;
      if (e.sorte && e.sorte !== fr.sorte) continue;
      if (e.degres && !e.degres.includes(fr.degre)) continue;
      if (e.hapax && !hapax) continue;
      points += e.points || 0;
      mult += e.mult || 0;
      etapes.push({ type: 'joker', id: j.id, fragment: id, gain: { points: e.points || 0, mult: e.mult || 0 }, points, mult });
    }
  }

  for (const j of jokers) {
    const e = j.effet;
    let gain = null;
    if (e.quand === 'toujours') gain = { points: e.points || 0, mult: e.mult || 0 };
    else if (e.quand === 'froisses' && ctx.froisses > 0) gain = { mult: e.multPar * ctx.froisses };
    else if (e.quand === 'figure' && ((e.figures && e.figures.includes(figure.id)) || (e.taille && compte.length >= e.taille))) gain = { fois: e.fois };
    else if (e.quand === 'bougie' && ctx.bougie < e.sous) gain = { fois: e.fois };
    if (!gain) continue;
    points += gain.points || 0;
    mult += gain.mult || 0;
    if (gain.fois) mult *= gain.fois;
    etapes.push({ type: 'joker', id: j.id, gain, points, mult });
  }

  const total = Math.round(points * mult);
  etapes.push({ type: 'total', points, mult, total });
  return { figure, compte, points, mult, total, etapes };
}
