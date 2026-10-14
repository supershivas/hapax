// Les signes dessinés du jeu (pas des caractères typographiques) : une forme
// par sorte, reconnaissable en niveaux de gris (section 5). viewBox 24 × 24,
// couleur héritée (currentColor).
export const SIGNES = {
  // Théorème : le carré plein de la démonstration achevée
  T: '<rect x="6" y="6" width="12" height="12" fill="currentColor"/>',
  // Rature : trois traits qui biffent
  R: '<path d="M4 17 20 7M4 12.5l16-3M5 20 19 13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  // Intuition : un cercle ouvert, un point au centre
  I: '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
  // Marginalia : le crochet de la marge et ses lignes
  M: '<path d="M9 4H5v16h4M12 8h7M12 12h7M12 16h4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/>',
};

// La flamme : la bougie, et la marque du hapax
export const FLAMME = '<path d="M12 2c1 4 6 7 6 13a6 6 0 0 1-12 0c0-4 3-6 3-9 1.5 1 2.2 2.4 2.4 4C13 8 13 5 12 2z"/>';

export function svg(contenu, { taille = 24, classe = '' } = {}) {
  return `<svg class="${classe}" viewBox="0 0 24 24" width="${taille}" height="${taille}" aria-hidden="true">${contenu}</svg>`;
}
