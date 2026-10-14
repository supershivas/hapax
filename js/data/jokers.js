// Les visiteurs de la nuit (les jokers) : des personnes et des idées.
// L'effet est de la donnée ; le code ne connaît que les sortes d'effet
// (`quand`), jamais les noms (section 12) :
//   toujours  — { mult } ou { points } ajoutés à chaque écriture
//   fragment  — pour chaque fragment qui compte, s'il a la `sorte`, un degré
//               de `degres`, ou s'il est `hapax` : { mult } ou { points }
//   figure    — si la figure est dans `figures`, ou compte `taille` fragments : × `fois`
//   bougie    — si la bougie est sous `sous` (part de la cire) : × `fois`
//   froisses  — + `multPar` mult pour chaque feuillet froissé dans l'heure
export const JOKERS = [
  { id: 'chevalier', nom: 'Auguste Chevalier', genre: 'personne', texte: '+4 mult',
    note: 'L\'ami à qui l\'on écrit la lettre.', effet: { quand: 'toujours', mult: 4 } },
  { id: 'cauchy', nom: 'Augustin Cauchy', genre: 'personne', texte: 'Chaque Théorème : +3 mult',
    note: 'Il a égaré le premier mémoire.', effet: { quand: 'fragment', sorte: 'T', mult: 3 } },
  { id: 'germain', nom: 'Sophie Germain', genre: 'personne', texte: 'Degré premier : +12 points',
    note: 'Les nombres premiers portent son nom.', effet: { quand: 'fragment', degres: [2, 3, 5, 7, 11, 13], points: 12 } },
  { id: 'abel', nom: 'Niels Abel', genre: 'personne', texte: 'Figure de cinq : ×2 mult',
    note: 'L\'équation du cinquième degré.', effet: { quand: 'figure', taille: 5, fois: 2 } },
  { id: 'stephanie', nom: 'Stéphanie D.', genre: 'personne', texte: 'Lemme ou Dilemme : ×2 mult',
    note: 'La cause du duel, dit-on.', effet: { quand: 'figure', figures: ['lemme', 'dilemme'], fois: 2 } },
  { id: 'fourier', nom: 'Joseph Fourier', genre: 'personne', texte: 'Bougie sous la moitié : ×2 mult',
    note: 'La théorie de la chaleur ; mort avant d\'avoir lu.', effet: { quand: 'bougie', sous: 0.5, fois: 2 } },
  { id: 'insomnie', nom: 'L\'insomnie', genre: 'idée', texte: 'Chaque hapax : +2 mult',
    note: 'Ce qui n\'est écrit qu\'une fois.', effet: { quand: 'fragment', hapax: true, mult: 2 } },
  { id: 'corbeille', nom: 'La corbeille', genre: 'idée', texte: '+1 mult par feuillet froissé dans l\'heure',
    note: 'Ce qu\'on jette compte aussi.', effet: { quand: 'froisses', multPar: 1 } },
];
