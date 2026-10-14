// Les nombres du jeu : aucun nombre magique dans la logique (section 12).
// L'atelier peut les régler ; la version publiée est lue au lancement dans
// assets/design/reglages.json. Deux niveaux seulement (groupe.clé).
export const REGLAGES = {
  manche: {
    objectif: 2200,      // mesuré : appliqué ~9 sur 10, hasard ~0 (test/equilibrage.test.mjs)
    main: 8,             // fragments en main
    maxEcrits: 5,        // fragments écrits ou froissés d'un coup, au plus
  },
  bougie: {
    cire: 100,           // la bougie neuve
    combustion: 0.6,     // cire brûlée par seconde de jeu
    coutEcrire: 12,      // cire d'une écriture
    coutFroisser: 6,     // cire d'un froissement
  },
  hapax: {
    facteur: 2,          // un fragment hapax compte ses points autant de fois
  },
  visiteurs: {
    proposes: 3,         // visiteurs proposés au début de la nuit
    choisis: 2,          // visiteurs gardés
    places: 5,           // visiteurs au plus
  },
  points: { resolvante: 100, quaternion: 60, syzygie: 40, monographie: 35, progression: 30, triade: 30, dilemme: 20, lemme: 10, scolie: 5 },
  mult: { resolvante: 8, quaternion: 7, syzygie: 4, monographie: 4, progression: 4, triade: 3, dilemme: 2, lemme: 2, scolie: 1 },
  sequence: {
    duree: 1.6,          // secondes au plus pour jouer le score (Frères : au-delà, on décroche)
  },
};
