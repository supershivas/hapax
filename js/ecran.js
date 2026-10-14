// Les éléments de l'écran, en DOM : un fragment, un visiteur, la bougie.
// Ils DESSINENT l'état, ils ne le modifient jamais (section 12). Partagés par
// le jeu et le labo : ce qu'on voit au labo est ce que le jeu affiche.
import { fragment, romain, SORTES } from './data/fragments.js?v=0.1.0';
import { SIGNES, FLAMME, svg } from './signes.js?v=0.1.0';

const SORTE = Object.fromEntries(SORTES.map(s => [s.id, s]));

export function el(tag, props = {}, ...enfants) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('data-') || k.startsWith('aria-')) e.setAttribute(k, v);
    else e[k] = v;
  }
  e.append(...enfants.filter(x => x != null && x !== false));
  return e;
}

// Un fragment : son degré, son signe, sa sorte ; la flamme s'il serait un hapax
export function carteFragment(id, { hapax = false, choisi = false, bouton = true } = {}) {
  const f = fragment(id);
  const sorte = SORTE[f.sorte];
  return el(bouton ? 'button' : 'div', {
    class: `fragment${choisi ? ' est-choisi' : ''}${hapax ? ' est-hapax' : ''}`,
    'data-id': id,
    'aria-label': `${sorte.nom} ${romain(f.degre)}${hapax ? ', hapax' : ''}`,
    ...(bouton ? { 'aria-pressed': String(choisi), type: 'button' } : {}),
  },
  el('span', { class: 'fragment-degre', textContent: romain(f.degre) }),
  el('span', { class: 'fragment-signe', html: svg(SIGNES[f.sorte], { taille: 26 }) }),
  el('span', { class: 'fragment-sorte', textContent: sorte.nom }),
  hapax ? el('span', { class: 'fragment-hapax', html: svg(FLAMME, { taille: 14 }) }) : null);
}

// Un visiteur (joker) : son nom, ce qu'il fait ; la note seulement en grand
export function carteJoker(j, { choisi = false, bouton = false, grand = false } = {}) {
  return el(bouton ? 'button' : 'div', {
    class: `joker${grand ? ' joker-grand' : ''}${choisi ? ' est-choisi' : ''}`,
    'data-id': j.id,
    ...(bouton ? { 'aria-pressed': String(choisi), type: 'button' } : {}),
  },
  el('span', { class: 'joker-nom', textContent: j.nom }),
  el('span', { class: 'joker-effet', textContent: j.texte }),
  grand ? el('span', { class: 'joker-note', textContent: j.note }) : null);
}

// La bougie : sa hauteur suit la cire (--cire, de 0 à 1), posée par poserBougie
export function bougie() {
  return el('div', { class: 'bougie', 'aria-hidden': 'true' },
    el('div', { class: 'bougie-flamme', html: svg(FLAMME, { taille: 22 }) }),
    el('div', { class: 'bougie-cierge' }),
    el('div', { class: 'bougie-bougeoir' }));
}
export function poserBougie(b, part) {
  const p = Math.max(0, Math.min(1, part));
  b.style.setProperty('--cire', p.toFixed(4));
  b.classList.toggle('est-basse', p > 0 && p < 0.25);
  b.classList.toggle('est-eteinte', p <= 0);
}

// Un nombre écrit à la française, espace fine : 2 200
export const nombre = n => Math.round(n).toLocaleString('fr-FR').replace(/[   ]/g, ' ');

// La séquence du score (Frères : on voit d'où viennent les points) : chaque
// étape à son tour, le tout en `duree` secondes au plus ; d'un coup si le
// mouvement est réduit. Rend une promesse résolue à la fin.
export function jouerSequence(etapes, { duree = 1.6, onEtape }) {
  const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pas = reduit ? 0 : Math.min(0.24, duree / Math.max(1, etapes.length)) * 1000;
  return new Promise(fin => {
    let i = 0;
    const suivant = () => {
      if (i >= etapes.length) return fin();
      onEtape(etapes[i], i);
      i++;
      if (pas) setTimeout(suivant, pas); else suivant();
    };
    suivant();
  });
}
