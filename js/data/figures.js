// Les figures : ce que forment les fragments écrits ensemble, de la plus haute
// à la plus basse (la première qui convient l'emporte). Leurs valeurs (points
// et mult de base) sont dans les réglages, pour que l'atelier puisse les régler.
// `regle` est un nom que le code connaît (regles.js, FORMES).
export const FIGURES = [
  { id: 'resolvante', nom: 'Résolvante', regle: 'suiteMemeSorte', dit: 'cinq degrés qui se suivent, d\'une seule sorte' },
  { id: 'quaternion', nom: 'Quaternion', regle: 'carre', dit: 'quatre fragments du même degré' },
  { id: 'syzygie', nom: 'Syzygie', regle: 'full', dit: 'trois d\'un degré, deux d\'un autre' },
  { id: 'monographie', nom: 'Monographie', regle: 'memeSorte', dit: 'cinq fragments d\'une seule sorte' },
  { id: 'progression', nom: 'Progression', regle: 'suite', dit: 'cinq degrés qui se suivent' },
  { id: 'triade', nom: 'Triade', regle: 'brelan', dit: 'trois fragments du même degré' },
  { id: 'dilemme', nom: 'Dilemme', regle: 'deuxPaires', dit: 'deux fois deux du même degré' },
  { id: 'lemme', nom: 'Lemme', regle: 'paire', dit: 'deux fragments du même degré' },
  { id: 'scolie', nom: 'Scolie', regle: 'seul', dit: 'le plus haut fragment, seul' },
];
