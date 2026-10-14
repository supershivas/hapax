// L'Atelier (section 17) : il MODIFIE les réglages chiffrés que le jeu lit.
// Chaque modification est gardée tout de suite dans ce navigateur (brouillon),
// visible dans le jeu de ce navigateur, puis publiée d'un geste dans le dépôt
// (un commit sur main, par l'API de GitHub) : assets/design/reglages.json.
import { createPublisher, TOKEN_URL } from './lib/gh-publish.js?v=0.1.0';
import { chargerContenu, lireBrouillon, ecrireBrouillon, compterRetouches } from './design-store.js?v=0.1.0';

const REPO = 'supershivas/hapax';
const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const pub = createPublisher({ repo: REPO, tokenKey: 'hapax:gh-token' });
let contenu = await chargerContenu();

// Les groupes de réglages, dans l'ordre et avec un nom lisible
const GROUPES = {
  manche: 'L\'heure', bougie: 'La bougie', hapax: 'Le hapax', visiteurs: 'Les visiteurs',
  points: 'Points de base des figures', mult: 'Mult de base des figures', sequence: 'La séquence du score',
};

function aPublier() {
  const n = compterRetouches(lireBrouillon());
  $('a-publier').textContent = n ? `${n} à publier` : '';
  return n;
}
function toast(t) { const e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { e.hidden = true; }, 3000); }

// ─── Réglages chiffrés ─────────────────────────────────────────────────────
function ongletReglages(zone) {
  const b = lireBrouillon();
  const blocs = [];
  for (const [groupe, valeurs] of Object.entries(contenu.publie.reglages)) {
    const champs = [];
    for (const [cle, publie] of Object.entries(valeurs)) {
      if (typeof publie !== 'number') continue;
      const local = b.reglages?.[groupe]?.[cle];
      const input = el('input', { type: 'number', value: local ?? publie, step: 'any' });
      const etiquette = el('span', { textContent: cle, className: local != null ? 'at-modifie' : '' });
      input.onchange = () => {
        const v = Number(input.value);
        const br = lireBrouillon(); br.reglages = br.reglages || {}; br.reglages[groupe] = br.reglages[groupe] || {};
        if (v === publie) delete br.reglages[groupe][cle]; else br.reglages[groupe][cle] = v;
        if (!Object.keys(br.reglages[groupe]).length) delete br.reglages[groupe];
        ecrireBrouillon(br);
        etiquette.className = v === publie ? '' : 'at-modifie';
        aPublier();
      };
      champs.push(el('label', { className: 'at-field' }, etiquette, input));
    }
    blocs.push(el('h3', { textContent: GROUPES[groupe] || groupe }), ...champs);
  }
  zone.replaceChildren(el('h2', { textContent: 'Réglages' }),
    el('p', { className: 'at-note', textContent: 'Les nombres du jeu. En rouge : modifié dans ce navigateur, pas encore publié ; le jeu de ce navigateur les utilise déjà. L\'objectif de l\'heure a été mesuré (node outils/test-run.mjs) : le changer, c\'est changer la difficulté.' }), ...blocs);
}

// ─── Publier ───────────────────────────────────────────────────────────────
function ongletPublier(zone) {
  const jeton = el('input', { type: 'password', placeholder: 'github_pat_…', value: pub.getToken(), autocomplete: 'off' });
  const statut = el('p', { className: 'at-note' });
  const n = aPublier();
  zone.replaceChildren(
    el('h2', { textContent: 'Publier' }),
    el('p', { className: 'at-note' }, `Publier écrit les retouches dans le dépôt ${REPO} (un commit sur main) ; le jeu est à jour partout en une à dix minutes. Il faut un jeton GitHub limité à ce dépôt, avec le droit « Contents : Read and write ». Il reste dans ce navigateur et n'est jamais exporté. `,
      el('a', { href: TOKEN_URL, target: '_blank', rel: 'noopener', textContent: 'Créer un jeton' })),
    el('div', { className: 'at-row' }, jeton, el('button', { textContent: 'Enregistrer le jeton', onclick: () => { pub.setToken(jeton.value); toast('Jeton enregistré dans ce navigateur'); } })),
    el('div', { className: 'at-row' },
      el('button', { className: 'primaire', textContent: n ? `Publier (${n})` : 'Rien à publier', disabled: !n, onclick: publier }),
      el('button', { textContent: 'Oublier mes retouches', disabled: !n, onclick: () => { ecrireBrouillon({}); toast('Retouches oubliées'); ongletPublier(zone); } })),
    statut,
  );
  async function publier() {
    try {
      const b = lireBrouillon();
      const enLigne = (await pub.readJSON('assets/design/reglages.json')) || {};
      for (const [g, v] of Object.entries(b.reglages || {})) enLigne[g] = { ...(enLigne[g] || {}), ...v };
      await pub.publish([{ path: 'assets/design/reglages.json', json: enLigne }], { message: 'Les réglages de l\'atelier changent', progress: t => { statut.textContent = t; } });
      ecrireBrouillon({});
      contenu = await chargerContenu();
      toast('Publié');
      ongletPublier(zone);
    } catch (e) { statut.textContent = e.message; }
  }
}

const ONGLETS = { Réglages: ongletReglages, Publier: ongletPublier };
function ouvrir(nom) {
  for (const b of $('onglets').children) b.classList.toggle('is-on', b.textContent === nom);
  ONGLETS[nom]($('travail'));
  history.replaceState(null, '', `#${nom}`);
}
$('onglets').append(...Object.keys(ONGLETS).map(nom => el('button', { textContent: nom, onclick: () => ouvrir(nom) })));
const demande = decodeURIComponent(location.hash.slice(1));
ouvrir(ONGLETS[demande] ? demande : 'Réglages');
aPublier();
