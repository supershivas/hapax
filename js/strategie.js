// Deux joueurs simulés, purs, pour MESURER l'équilibrage (section 19 : un
// chiffre se mesure, il ne se choisit pas) et pour le mode debug.
//   appliqué : cherche la meilleure figure, froisse quand elle ne suffira pas ;
//   hasard   : écrit 1 à 5 fragments pris au hasard, ne froisse jamais.
// `reflexion` : secondes de jeu qu'un joueur met à chaque geste (la bougie brûle).
import { createRng } from './lib/rng.js';
import { REGLAGES } from './data/reglages.js';
import { choisirVisiteurs, bruler, ecrire, froisser, evaluer, contexte, nouvelleNuit } from './regles.js';
import { fragment } from './data/fragments.js';

// Tous les choix de 1 à n fragments dans la main
function* choix(main, n) {
  const k = main.length;
  for (let masque = 1; masque < 1 << k; masque++) {
    let taille = 0;
    for (let b = masque; b; b >>= 1) taille += b & 1;
    if (taille <= n) yield main.filter((_, i) => masque & (1 << i));
  }
}

export function meilleureEcriture(etat, r = REGLAGES) {
  const ctx = contexte(etat, r);
  let best = null;
  for (const ids of choix(etat.manche.main, r.manche.maxEcrits)) {
    const res = evaluer(ids, ctx, r);
    // À total égal, écrire moins de fragments (garder les degrés pour plus tard)
    if (!best || res.total > best.total || (res.total === best.total && ids.length < best.ids.length)) best = { ids, total: res.total, compte: res.compte };
  }
  return best;
}

// Les visiteurs les plus sûrs d'abord : un ordre fixe, celui d'un joueur qui a lu leurs cartes
const PREFERENCE = ['chevalier', 'insomnie', 'abel', 'fourier', 'stephanie', 'cauchy', 'germain', 'corbeille'];

export function geste(etat, joueur, rng, r = REGLAGES, reflexion = 6) {
  const m = etat.manche;
  if (joueur === 'hasard') {
    const n = rng.int(1, Math.min(r.manche.maxEcrits, m.main.length));
    return { action: 'ecrire', ids: rng.shuffle([...m.main]).slice(0, n) };
  }
  const best = meilleureEcriture(etat, r);
  const besoin = m.objectif - m.score;
  const parEcriture = r.bougie.coutEcrire + r.bougie.combustion * reflexion;
  const ecrituresRestantes = Math.max(1, Math.floor(m.cire / parEcriture));
  if (best.total >= besoin || best.total * ecrituresRestantes >= besoin) return { action: 'ecrire', ids: best.ids };
  const apresFroisser = m.cire - r.bougie.coutFroisser - r.bougie.combustion * reflexion;
  const inutiles = m.main.filter(id => !best.compte.includes(id))
    .sort((a, b) => fragment(a).degre - fragment(b).degre).slice(0, r.manche.maxEcrits);
  if (inutiles.length && apresFroisser >= 2 * parEcriture) return { action: 'froisser', ids: inutiles };
  return { action: 'ecrire', ids: best.ids };
}

// Une nuit entière (aujourd'hui : une heure), jouée sans écran. Rend l'issue et le score.
export function simulerNuit(seed, joueur = 'applique', r = REGLAGES, reflexion = 6) {
  const etat = nouvelleNuit(seed, r);
  const rng = createRng(seed).fork(`joueur-${joueur}`);
  const visiteurs = joueur === 'hasard'
    ? rng.shuffle([...etat.propositions]).slice(0, r.visiteurs.choisis)
    : [...etat.propositions].sort((a, b) => PREFERENCE.indexOf(a) - PREFERENCE.indexOf(b)).slice(0, r.visiteurs.choisis);
  choisirVisiteurs(etat, visiteurs, r);
  let gestes = 0;
  while (etat.phase === 'manche' && gestes < 200) {
    if (bruler(etat, reflexion, r)) break;
    const g = geste(etat, joueur, rng, r, reflexion);
    (g.action === 'ecrire' ? ecrire : froisser)(etat, g.ids, r);
    gestes++;
  }
  const m = etat.manche;
  return { issue: m.issue, score: m.score, gestes, cire: m.cire, duree: (r.bougie.cire - m.cire) / r.bougie.combustion };
}
