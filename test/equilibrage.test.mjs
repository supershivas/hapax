// Le critère de validation du lot minimal (DESIGN.md), mesuré sur 400 graines :
// un joueur appliqué sauve l'heure environ 8 à 9 fois sur 10, un joueur au
// hasard au plus 1 fois sur 10, et une heure dure de 1 à 2 minutes.
import { simulerNuit } from '../js/strategie.js';

const N = 400;
const mesurer = (joueur, reflexion) => {
  let sauvees = 0; const durees = [];
  for (let s = 1; s <= N; s++) {
    const x = simulerNuit(s * 7919, joueur, undefined, reflexion);
    if (x.issue === 'sauvee') sauvees++;
    durees.push(x.duree);
  }
  durees.sort((a, b) => a - b);
  return { taux: sauvees / N, duree: durees[N >> 1] };
};

group('équilibrage (critère du lot minimal)');
const applique = mesurer('applique', 6);
const hasard = mesurer('hasard', 6);
test(`appliqué : ${(applique.taux * 100).toFixed(0)} % (attendu 75 à 95 %)`, () => assert.ok(applique.taux >= 0.75 && applique.taux <= 0.95));
test(`hasard : ${(hasard.taux * 100).toFixed(0)} % (attendu au plus 10 %)`, () => assert.ok(hasard.taux <= 0.10));
test(`une heure dure ${applique.duree.toFixed(0)} s (attendu 60 à 150 s)`, () => assert.ok(applique.duree >= 60 && applique.duree <= 150));
test('un joueur lent (9 s par geste) passe encore 3 fois sur 4', () => assert.ok(mesurer('applique', 9).taux >= 0.75));
