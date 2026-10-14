// Les bruitages du jeu, synthétisés (aucun fichier) : la plume, le papier,
// la flamme. Partagés par le jeu et le labo (section 14).
export const SONS = {
  plume: [{ type: 'noise', dur: 0.07, vol: 0.12, filter: 5200, to: 3000 }, { type: 'noise', dur: 0.09, vol: 0.1, filter: 4600, to: 2400, at: 0.09 }],
  feuille: { type: 'noise', dur: 0.08, vol: 0.16, filter: 1800, to: 900 },
  froisser: [{ type: 'noise', dur: 0.16, vol: 0.28, filter: 2600, to: 500 }, { type: 'noise', dur: 0.12, vol: 0.2, filter: 1500, to: 400, at: 0.11 }],
  compte: { type: 'triangle', freq: 220, to: 218, dur: 0.18, vol: 0.22 },
  hapax: [{ type: 'triangle', freq: 330, dur: 0.2, vol: 0.24 }, { type: 'sine', freq: 660, dur: 0.25, vol: 0.08 }],
  visiteur: { type: 'sine', freq: 392, to: 440, dur: 0.16, vol: 0.18 },
  total: [{ type: 'triangle', freq: 196, dur: 0.3, vol: 0.25 }, { type: 'triangle', freq: 294, dur: 0.4, vol: 0.18, at: 0.05 }],
  sauvee: [{ type: 'triangle', freq: 262, dur: 0.5, vol: 0.2 }, { type: 'triangle', freq: 330, dur: 0.5, vol: 0.18, at: 0.12 }, { type: 'triangle', freq: 392, dur: 0.9, vol: 0.2, at: 0.24 }],
  eteinte: { type: 'noise', dur: 0.9, vol: 0.3, filter: 900, to: 60 },
  refus: { type: 'triangle', freq: 150, to: 120, dur: 0.16, vol: 0.2 },
};

export function definirSons(audio) {
  for (const [nom, def] of Object.entries(SONS)) audio.define(nom, def);
}
