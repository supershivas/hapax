// Le Labo (section 16) : il MONTRE et compare, il ne modifie rien.
// Chaque sujet utilise les mêmes modules que le jeu (ecran.js, regles.js,
// sons.js) : ce qu'on voit ici est ce que le jeu affiche. Ajouter un sujet ou
// une variante = ajouter une entrée dans GROUPES.
import { mountLabo } from './lib/labo-shell.js?v=0.1.0';
import { createAudio } from './lib/audio.js?v=0.1.0';
import { PALETTE, ROLES } from './palette.js?v=0.1.0';
import { chargerContenu } from './design-store.js?v=0.1.0';
import { evaluer } from './regles.js?v=0.1.0';
import { JOKERS } from './data/jokers.js?v=0.1.0';
import { SORTES, DEGRES } from './data/fragments.js?v=0.1.0';
import { definirSons } from './sons.js?v=0.1.0';
import { el, carteFragment, carteJoker, bougie, poserBougie, nombre, jouerSequence } from './ecran.js?v=0.1.0';

for (const [role, couleur] of Object.entries(ROLES)) document.documentElement.style.setProperty(`--jeu-${role}`, couleur);
const NOM = document.title.replace(/^Labo — /, ''); // le nom vient de la page (une apostrophe ne casse rien)
const { reglages: R } = await chargerContenu();
const audio = createAudio();
definirSons(audio);

const scene = (stage, ...enfants) => { const s = el('div', { class: 'scene' }, ...enfants); stage.append(s); return s; };

// Les 52 fragments, rangés par sorte ; la flamme du hapax sur une rangée sur deux
function planche(stage, { hapax }) {
  scene(stage, ...SORTES.map((s, i) => el('div', { class: 'rangee' },
    ...DEGRES.map(d => carteFragment(`${s.id}${d}`, { bouton: false, hapax: hapax === 'tous' || (hapax === 'alterne' && i % 2 === 0) })))));
}

// Une écriture d'exemple rejouée en séquence, avec les visiteurs donnés
function sequenceExemple(stage, ids, jokers, bougiePart = 1) {
  const jok = el('div', { class: 'rangee' }, ...jokers.map(id => carteJoker(JOKERS.find(j => j.id === id))));
  const page = el('div', { class: 'page' });
  const calcul = el('p', { class: 'calcul' }, ' ');
  const s = scene(stage, jok, page, calcul);
  const bouton = el('button', { class: 'essai', textContent: 'Rejouer', onclick: jouer });
  stage.append(bouton);
  async function jouer() {
    audio.unlock();
    const res = evaluer(ids, { jokers, degresEcrits: [], bougie: bougiePart, froisses: 2 }, R);
    page.replaceChildren(...ids.map(id => { const c = carteFragment(id, { bouton: false }); if (!res.compte.includes(id)) c.classList.add('compte-pas'); return c; }));
    calcul.classList.remove('est-total');
    await jouerSequence(res.etapes, { duree: R.sequence.duree, onEtape(e) {
      if (e.type === 'figure') calcul.replaceChildren(el('span', { class: 'nom-figure', textContent: e.nom }), `${nombre(e.points)} × ${nombre(e.mult)}`);
      else if (e.type === 'fragment') { const c = page.querySelector(`[data-id="${e.id}"]`); c?.classList.add('marque'); c?.append(el('span', { class: `gain${e.hapax ? ' est-hapax' : ''}`, textContent: `+${e.gain.points}` })); audio.sfx(e.hapax ? 'hapax' : 'compte'); }
      else if (e.type === 'joker') { const j = jok.querySelector(`[data-id="${e.id}"]`); j?.classList.remove('agit'); void j?.offsetWidth; j?.classList.add('agit'); audio.sfx('visiteur'); }
      else { calcul.classList.add('est-total'); calcul.replaceChildren(`${nombre(e.points)} × ${nombre(e.mult)} = ${nombre(e.total)}`); audio.sfx('total'); }
      if (e.type === 'fragment' || e.type === 'joker') calcul.lastChild.textContent = `${nombre(e.points)} × ${nombre(e.mult)}`;
    } });
  }
  jouer();
  return s;
}

const GROUPES = [
  { id: 'cartes', title: 'Cartes', topics: [
    { id: 'fragments', title: 'Fragments', variants: [
      { title: 'Les 52, avec et sans hapax', note: 'Quatre sortes, treize degrés. La flamme marque un degré pas encore écrit cette nuit.', status: 'actuelle', render: s => planche(s, { hapax: 'alterne' }) },
      { title: 'Sans aucun hapax', note: 'Fin de nuit : tous les degrés ont déjà été écrits.', render: s => planche(s, { hapax: 'aucun' }) },
    ] },
    { id: 'visiteurs', title: 'Visiteurs', variants: [
      { title: 'En jeu', note: 'Les huit visiteurs, tels qu\'ils s\'alignent au-dessus de l\'heure.', status: 'actuelle', render: s => scene(s, el('div', { class: 'rangee' }, ...JOKERS.map(j => carteJoker(j)))) },
      { title: 'Au choix', note: 'Tels qu\'on les choisit au début de la nuit, avec leur note.', render: s => scene(s, el('div', { class: 'visiteurs-liste' }, ...JOKERS.map((j, i) => carteJoker(j, { grand: true, choisi: i < 2 })))) },
    ] },
  ] },
  { id: 'heure', title: 'L\'heure', topics: [
    { id: 'bougie', title: 'Bougie', variants: [
      { title: 'Quatre moments', note: 'Neuve, à moitié (Fourier s\'éveille), basse (la flamme s\'affole), éteinte.', status: 'actuelle', render: s => scene(s, el('div', { class: 'rangee' }, ...[1, 0.5, 0.18, 0].map(p => { const b = bougie(); poserBougie(b, p); return el('figure', {}, b, el('figcaption', { textContent: `${Math.round(p * 100)} %` })); }))) },
    ] },
    { id: 'sequence', title: 'Séquence du score', variants: [
      { title: 'Une Lemme, deux visiteurs', note: 'Chevalier puis Stéphanie D. : le +mult avant le ×mult.', status: 'actuelle', render: s => sequenceExemple(s, ['T7', 'R7', 'I2'], ['chevalier', 'stephanie']) },
      { title: 'Une Résolvante, quatre visiteurs', note: 'Le cas long : la séquence doit tenir en 1,6 s.', render: s => sequenceExemple(s, ['I3', 'I4', 'I5', 'I6', 'I7'], ['insomnie', 'chevalier', 'abel', 'fourier'], 0.3) },
    ] },
  ] },
  { id: 'dessin', title: 'Dessin', topics: [
    { id: 'palette', title: 'Palette', variants: [
      { title: 'Nuancier', note: 'Les quatre couleurs du jeu, et rien d\'autre.', status: 'actuelle', render: s => {
        s.append(el('div', { class: 'nuancier' }, ...Object.entries(PALETTE).map(([k, hex]) => {
          const d = el('div', { textContent: `${k} ${hex}` });
          d.style.background = hex;
          d.style.color = lum(hex) > 0.3 ? PALETTE.e : PALETTE.v;
          return d;
        })));
      } },
      { title: 'Contrastes', note: 'Rapport WCAG de chaque paire (4,5 pour du texte, 3 pour un signe).', render: s => {
        const ks = Object.keys(PALETTE);
        const t = el('table', { class: 'contraste' });
        t.append(el('tr', {}, el('th'), ...ks.map(k => el('th', { textContent: k }))));
        for (const a of ks) t.append(el('tr', {}, el('th', { textContent: a }), ...ks.map(b => el('td', { textContent: a === b ? '—' : contraste(PALETTE[a], PALETTE[b]).toFixed(1) }))));
        s.append(t);
      } },
    ] },
  ] },
  { id: 'son', title: 'Son', topics: [
    { id: 'bruitages', title: 'Bruitages', variants: [
      { title: 'Banque', note: 'Chaque son du jeu, à écouter.', status: 'actuelle', render: s => {
        audio.unlockOn(s);
        for (const nom of audio.names) s.append(el('button', { class: 'essai', textContent: nom, onclick: () => { audio.unlock(); audio.sfx(nom); } }));
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
