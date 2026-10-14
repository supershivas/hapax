// Les règles du jeu, sans navigateur : node outils/test-run.mjs
import { readFileSync } from 'node:fs';
import { nouvelleNuit, choisirVisiteurs, ecrire, froisser, bruler, reconnaitre, evaluer } from '../js/regles.js';
import { REGLAGES as R } from '../js/data/reglages.js';
import { FIGURES } from '../js/data/figures.js';
import { JOKERS } from '../js/data/jokers.js';
import { toutLeJeu } from '../js/data/fragments.js';

const ctxVide = { jokers: [], degresEcrits: [], bougie: 1, froisses: 0 };
const nuit = (seed = 1) => { const e = nouvelleNuit(seed); choisirVisiteurs(e, e.propositions.slice(0, R.visiteurs.choisis)); return e; };

group('figures');
const cas = {
  resolvante: ['T3', 'T4', 'T5', 'T6', 'T7'],
  quaternion: ['T9', 'R9', 'I9', 'M9', 'T2'],
  syzygie: ['T4', 'R4', 'I4', 'M8', 'T8'],
  monographie: ['I1', 'I4', 'I6', 'I9', 'I12'],
  progression: ['T9', 'R10', 'I11', 'M12', 'T13'],
  triade: ['T5', 'R5', 'I5', 'M1'],
  dilemme: ['T5', 'R5', 'I8', 'M8', 'T1'],
  lemme: ['T12', 'R12', 'I3'],
  scolie: ['T2', 'R9', 'I4'],
};
for (const [id, ids] of Object.entries(cas)) {
  test(`${id} se reconnaît`, () => assert.equal(reconnaitre(ids).figure.id, id));
}
test('chaque figure a ses points et son mult', () => {
  for (const f of FIGURES) { assert.ok(R.points[f.id] > 0, f.id); assert.ok(R.mult[f.id] > 0, f.id); }
});
test('seuls les fragments de la figure comptent', () => {
  assert.deepEqual(reconnaitre(['T12', 'R12', 'I3']).compte.sort(), ['R12', 'T12']);
  assert.deepEqual(reconnaitre(['T2', 'R9', 'I4']).compte, ['R9']);
});
test('pas de suite par le bout (XIII puis I)', () => assert.notEqual(reconnaitre(['T11', 'R12', 'I13', 'M1', 'T2']).figure.id, 'progression'));

group('score');
test('une Lemme de VII sans visiteur, hapax : (10 + 2×7×2) × 2', () => {
  const r = evaluer(['T7', 'R7'], ctxVide);
  assert.equal(r.total, (R.points.lemme + 7 * R.hapax.facteur * 2) * R.mult.lemme);
});
test('un degré déjà écrit n\'est plus un hapax', () => {
  const r = evaluer(['T7', 'R7'], { ...ctxVide, degresEcrits: [7] });
  assert.equal(r.total, (R.points.lemme + 14) * R.mult.lemme);
  assert.ok(r.etapes.filter(e => e.type === 'fragment').every(e => !e.hapax));
});
test('les étapes finissent sur le total, et le total = points × mult', () => {
  const r = evaluer(['T3', 'T4', 'T5', 'T6', 'T7'], { ...ctxVide, jokers: JOKERS.map(j => j.id), bougie: 0.2, froisses: 3 });
  const fin = r.etapes.at(-1);
  assert.equal(fin.type, 'total');
  assert.equal(fin.total, r.total);
  assert.equal(r.total, Math.round(r.points * r.mult));
});
test('chaque visiteur a un effet que le code connaît, et agit quelque part', () => {
  const quand = new Set(['toujours', 'fragment', 'figure', 'bougie', 'froisses']);
  for (const j of JOKERS) {
    assert.ok(quand.has(j.effet.quand), j.id);
    const sans = evaluer(['T2', 'T3', 'T5', 'T7', 'T11'], { ...ctxVide, bougie: 0.2, froisses: 2 }).total;
    const avec = evaluer(['T2', 'T3', 'T5', 'T7', 'T11'], { ...ctxVide, jokers: [j.id], bougie: 0.2, froisses: 2 }).total;
    const lemme = evaluer(['T2', 'R2'], { ...ctxVide, jokers: [j.id], bougie: 0.2, froisses: 2 }).total;
    assert.ok(avec > sans || lemme > evaluer(['T2', 'R2'], { ...ctxVide, bougie: 0.2, froisses: 2 }).total, j.id);
  }
});
test('l\'ordre des visiteurs compte (+mult avant ×mult)', () => {
  const a = evaluer(['T2', 'R2'], { ...ctxVide, jokers: ['chevalier', 'stephanie'] }).total;
  const b = evaluer(['T2', 'R2'], { ...ctxVide, jokers: ['stephanie', 'chevalier'] }).total;
  assert.ok(a > b);
});

group('la nuit');
test('trois visiteurs proposés, deux gardés', () => {
  const e = nouvelleNuit(5);
  assert.equal(e.propositions.length, R.visiteurs.proposes);
  assert.equal(choisirVisiteurs(e, [e.propositions[0]]).ok, false);
  assert.equal(choisirVisiteurs(e, ['inconnu', e.propositions[0]]).ok, false);
  assert.equal(choisirVisiteurs(e, e.propositions.slice(0, 2)).ok, true);
  assert.equal(e.phase, 'manche');
  assert.equal(e.manche.main.length, R.manche.main);
});
test('un geste impossible est refusé avec sa raison', () => {
  const e = nuit();
  for (const ids of [[], e.manche.main.slice(0, 6), ['T99']]) {
    const r = ecrire(e, ids);
    assert.equal(r.ok, false); assert.ok(r.raison.length > 3);
  }
});
test('écrire marque, coûte de la cire, repioche, et use les degrés', () => {
  const e = nuit(3);
  const ids = e.manche.main.slice(0, 2);
  const r = ecrire(e, ids);
  assert.ok(r.ok && r.resultat.total > 0);
  assert.equal(e.manche.score, r.resultat.total);
  assert.equal(e.manche.cire, R.bougie.cire - R.bougie.coutEcrire);
  assert.equal(e.manche.main.length, R.manche.main);
  for (const id of ids) assert.ok(e.degresEcrits.includes(Number(id.slice(1))));
});
test('froisser coûte de la cire, ne marque pas, n\'use pas les degrés', () => {
  const e = nuit(4);
  froisser(e, e.manche.main.slice(0, 3));
  assert.equal(e.manche.score, 0);
  assert.equal(e.manche.froisses, 3);
  assert.equal(e.degresEcrits.length, 0);
  assert.equal(e.manche.cire, R.bougie.cire - R.bougie.coutFroisser);
});
test('la bougie s\'éteint avec le temps', () => {
  const e = nuit();
  let issue = null;
  for (let i = 0; i < 60 * 1000 && !issue; i++) issue = bruler(e, 1 / 60);
  assert.equal(issue, 'eteinte');
  assert.equal(e.phase, 'fin');
  assert.equal(ecrire(e, e.manche.main.slice(0, 1)).ok, false);
});
test('l\'heure est sauvée dès que le score atteint l\'objectif', () => {
  const e = nuit();
  e.manche.objectif = 1;
  assert.equal(ecrire(e, e.manche.main.slice(0, 1)).issue, 'sauvee');
});
test('aucun fragment ne se perd ni ne se double', () => {
  const e = nuit(11);
  for (let i = 0; i < 6; i++) (i % 2 ? froisser : ecrire)(e, e.manche.main.slice(0, 2));
  const m = e.manche;
  const tous = [...m.pioche, ...m.main, ...m.ecrits.flatMap(x => x.ids)];
  assert.equal(tous.length + m.froisses, 52);
  assert.equal(new Set(tous).size, tous.length);
  assert.ok(tous.every(id => toutLeJeu().includes(id)));
});
test('même graine, mêmes gestes : même nuit', () => {
  const a = nuit(42), b = nuit(42);
  for (const e of [a, b]) { ecrire(e, e.manche.main.slice(0, 3)); bruler(e, 2.5); froisser(e, e.manche.main.slice(-2)); }
  assert.deepEqual(a, b);
});
test('aucun hasard ni horloge dans les règles', () => {
  for (const f of ['regles.js', 'strategie.js']) {
    const src = readFileSync(new URL(`../js/${f}`, import.meta.url), 'utf8');
    assert.ok(!/Math\.random|Date\.now|performance\.now|crypto\./.test(src), `${f} doit rester pur (section 10)`);
  }
});

group('sauvegarde');
test('une nuit relue est la même, et se joue pareil', () => {
  const a = nuit(9);
  ecrire(a, a.manche.main.slice(0, 2)); bruler(a, 10);
  const b = JSON.parse(JSON.stringify(a));
  assert.deepEqual(b, a);
  for (const e of [a, b]) { froisser(e, e.manche.main.slice(0, 4)); ecrire(e, e.manche.main.slice(2, 5)); bruler(e, 3); }
  assert.deepEqual(b, a);
});
