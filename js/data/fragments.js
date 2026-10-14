// Les fragments : quatre sortes × treize degrés (le jeu de 52 de la nuit).
// Une sorte se reconnaît à son signe (la forme porte l'information, section 5) ;
// le degré s'écrit en chiffres romains.
export const SORTES = [
  { id: 'T', nom: 'Théorème', pluriel: 'Théorèmes' },
  { id: 'R', nom: 'Rature', pluriel: 'Ratures' },
  { id: 'I', nom: 'Intuition', pluriel: 'Intuitions' },
  { id: 'M', nom: 'Marginalia', pluriel: 'Marginalia' },
];

export const DEGRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const ROMAINS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
export const romain = n => ROMAINS[n] || String(n);

// Un fragment s'écrit « T7 » : sa sorte puis son degré
export const fragment = id => ({ id, sorte: id[0], degre: Number(id.slice(1)) });
export const toutLeJeu = () => SORTES.flatMap(s => DEGRES.map(d => `${s.id}${d}`));
