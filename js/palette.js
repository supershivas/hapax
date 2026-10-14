// La palette du jeu : le SEUL endroit où vivent ses couleurs (section 5 des
// conventions). Papier, encre, flamme : la nuit du 29 au 30 mai 1832 est une
// chambre sombre où seules les feuilles et la bougie prennent la lumière.
// Déclarée aussi dans la section Description du CLAUDE.md.
export const PALETTE = {
  v: '#ece3cc', // vélin — les feuilles, le texte sur la nuit
  e: '#1d1915', // encre de noix — la chambre, l'écriture sur les feuilles
  b: '#8a6a4a', // bistre — ce qui est secondaire : marges, coûts, ce qui est déjà écrit
  f: '#d4902a', // flamme — la bougie et le hapax, rien d'autre
};

// Les rôles, lus par le CSS (variables --jeu-*) et par le labo
export const ROLES = {
  fond: PALETTE.e,
  encre: PALETTE.v,
  papier: PALETTE.v,
  ecriture: PALETTE.e,
  ombre: PALETTE.b,
  accent: PALETTE.f,
};
