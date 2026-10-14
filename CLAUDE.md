@.claude/conventions-jeu.md

# HAPAX

## Description

La nuit du 29 au 30 mai 1832, Évariste Galois a une nuit pour tout écrire
avant le duel de l'aube. Chaque heure est une manche : on assemble des
fragments en figures qui marquent des points × mult, avant que la bougie
ne baisse. L'intention complète est dans `DESIGN.md`.

- **Production** : https://supershivas.github.io/hapax/
- **Aperçu** : https://supershivas.github.io/hapax/apercu.html (le jeu dans
  un cadre de téléphone ; sur bureau, l'adresse du jeu elle-même)
- **Genre** : rôle, cartes et roguelite → roguelite de cartes (Balatro) ;
  boucle principale : le score de combinaisons avec multiplicateurs.
- **Vue et rendu** : interface seule, DOM / cartes / texte (profil
  game-system `profils/dom-cartes.md`) ; presque aucune illustration, des
  signes dessinés en SVG.
- **Cible** : téléphone en portrait (375 × 667 d'abord) ; bureau et paysage
  tiennent aussi (colonne de 460 px ; deux colonnes en paysage bas).
- **Public** : joueur averti, sessions courtes (une nuit ≈ 10 min à terme).
- **Session** : partie courte qui recommence, avec progression permanente
  (`hapax:meta` ; aujourd'hui elle ne fait que noter les nuits).
- **Steam** : porte ouverte (section 22) : rien de distant, plein écran,
  manette, toutes tailles de fenêtre.
- **Langue** : français seulement (Jérôme, v0.1.0).
- Jeu : pas de sous-titre (section 3 des conventions).

### Palette

Source unique : `js/palette.js` (posée en variables `--jeu-*` par `main.js`).

| Lettre | Valeur | Rôle |
|---|---|---|
| `v` | `#ece3cc` | vélin — les feuilles, le texte sur la nuit |
| `e` | `#1d1915` | encre de noix — la chambre (fond), l'écriture sur les feuilles |
| `b` | `#8a6a4a` | bistre — bordures, bougeoir ; jamais du petit texte (3,9 sur vélin) |
| `f` | `#d4902a` | flamme — la bougie, le hapax, la sélection ; rien d'autre |

Contrastes mesurés : vélin/encre 13,7 ; flamme/encre 6,5 ; flamme/vélin 2,1
(d'où la flamme du hapax cernée d'encre sur une feuille).

### Typographie et échelle

- `fonts/` : **Bodoni Moda** (identité : titre, degrés, noms ; la didone des
  années 1830) et **EB Garamond** (texte, calculs), OFL, en woff2 latin
  (Fontsource, copiés : aucun CDN).
- **Piège** : le `×` et le `+` de Bodoni Moda se lisent comme un point à
  l'écran (vu dans les captures v0.1.0) : les calculs et les gains sont en
  Garamond.
- Échelle dans `css/style.css` (`--t-s` 14 → `--t-titre`, `--pas` 8 px,
  `--rayon`, `--duree`). Cibles de 44 px.
- Un fragment : rapport 3 / 4, quatre par rangée en portrait (≈ 80 px de
  large sur 375), huit par rangée en paysage.

### Commandes

| Action | Clavier | Doigt / souris | Manette |
|---|---|---|---|
| Choisir un fragment / visiteur | 1 à 8 (rangée des chiffres ou pavé) ; flèches puis Espace | toucher la carte | croix ←/→ puis A |
| Écrire (ou allumer la bougie) | E | bouton Écrire | X |
| Froisser | F | bouton Froisser | Y |
| Pause | Échap, P | bouton pause | Start |

Les cartes sont des `<button>` : Tab et Espace marchent tout seuls.

## Stack

- Vanilla JS, modules ES, sans build ; GitHub Pages par le workflow
  `.github/workflows/pages.yml` (tests avant publication).
- Modules de game-system dans `js/lib/` : `app-update`, `audio`, `debug`,
  `game.css`, `gamepad`, `gh-publish`, `keys`, `labo-shell`, `loop`,
  `pointer`, `rng`, `save` (retirés : `pixel-canvas`, `sprites`,
  `pixel-editor`, `i18n` — jeu en DOM, en français). Outils : `test-run`,
  `captures`, `audit-ecran`, `icones`, `stamp-version`.
- Données : `localStorage` par `save.js`, clés `hapax:partie` (la nuit en
  cours, effacée à la fin de l'heure), `hapax:meta` (les nuits jouées),
  `hapax:prefs` (volume des effets), `hapax:atelier` (brouillon de
  l'atelier), `hapax:gh-token` (jamais exporté). Export / import JSON dans
  les réglages.
- Dépendances : aucune.
- Onglet caché ou fenêtre quittée : pause (la bougie ne brûle pas).

## Structure

- `index.html` — titre, visiteurs, l'heure, fin ; dialogues (pause,
  réglages, confirmation) rattachés au body.
- `js/main.js` — cycle de vie, commandes, séquence du score, sauvegarde,
  mise à jour, debug. N'a aucune règle.
- `js/regles.js` — **les règles, pures** : `nouvelleNuit`,
  `choisirVisiteurs`, `ecrire`, `froisser`, `bruler`, `reconnaitre`,
  `evaluer` (rend aussi les étapes de la séquence). Un geste impossible rend
  `{ ok: false, raison }`.
- `js/strategie.js` — deux joueurs simulés (appliqué, hasard) : mesure de
  l'équilibrage et `__jeu.choisirMeilleur()` du debug.
- `js/data/` — fragments (4 sortes × 13 degrés), figures (9), jokers (8,
  effets en données : `toujours`, `fragment`, `figure`, `bougie`,
  `froisses`), heures, réglages (tous les nombres).
- `js/ecran.js` — fragment, visiteur, bougie, séquence en DOM ; partagé
  avec le labo. `js/signes.js` — les signes SVG des sortes et la flamme.
  `js/sons.js` — les bruitages synthétisés.
- `js/design-store.js` — réglages publiés (`assets/design/reglages.json`)
  + brouillon de l'atelier.
- `labo.html`, `js/labo.js` — fragments, visiteurs, bougie, séquence du
  score, palette, bruitages.
- `atelier.html`, `js/atelier.js`, `css/atelier.css` — réglages chiffrés et
  publication.
- `apercu.html` — le jeu dans une iframe à la taille d'un téléphone.
- `test/` — règles, sauvegarde, et **le critère d'équilibrage**
  (`equilibrage.test.mjs`, 400 graines).

## Règles du jeu (ce que le code fait aujourd'hui)

- Score d'une écriture = (points de la figure + degrés des fragments qui
  comptent + visiteurs) × (mult de la figure + visiteurs), les visiteurs
  agissant dans l'ordre de leurs places (un +mult avant un ×mult rapporte
  plus). Seuls les fragments qui forment la figure comptent.
- **Hapax** : un fragment dont le degré n'a encore jamais été écrit cette
  nuit compte ses points × `hapax.facteur` (2). Les fragments froissés
  n'usent pas leur degré ; les fragments écrits sans compter, si.
- La bougie brûle `bougie.combustion` cire par seconde de jeu, et chaque
  geste coûte (`coutEcrire`, `coutFroisser`). Elle ne brûle ni en pause ni
  pendant la séquence du score. Le dernier mot compte : une écriture qui
  vide la bougie marque quand même.
- `manche.objectif` = 2 200 est **mesuré** : joueur appliqué 90 % (6 s par
  geste), 83 % (9 s), hasard 0 %, heure médiane 110 s. Tout changement des
  réglages, des figures ou des visiteurs se vérifie par
  `node outils/test-run.mjs` (le test échoue hors des bornes).

## Vérifier et livrer

```bash
node outils/test-run.mjs                 # règles, sauvegarde, équilibrage (~1 s)
node outils/captures.mjs --page index.html --page labo.html --page atelier.html
node outils/audit-ecran.mjs --page "index.html?debug=1&seed=7" --clic "#nouvelle" \
  --clic ".visiteurs-liste .joker:nth-child(1)" --clic ".visiteurs-liste .joker:nth-child(2)" --clic "#allumer"
node outils/stamp-version.mjs            # après chaque changement de version.json
```

Le mode debug (`?debug=1&seed=7`) expose `__jeu.state()`,
`__jeu.choisirMeilleur()`, `__jeu.visiteurs()`, `__jeu.timeScale(n)`.
F9 masque le panneau (pour les captures).

## Exceptions aux conventions

- Pas de volume « musique » dans les réglages : le jeu n'a pas de musique
  (bruitages seulement, Jérôme, v0.1.0). Il viendra avec elle.
- Pas de planche d'échelle au sens pixel : le jeu est en DOM ; le labo
  montre les cartes à leur taille réelle.

## Ce qui a été retiré

| Quoi | Version | Pourquoi |
|---|---|---|
| Le jeu des étoiles du jeu de départ (`game.js`, `render.js`, sprites) | 0.1.0 | remplacé par la boucle de HAPAX |

## Pièges connus

- Écran de l'heure : une grille à zones nommées (`grid-template-areas`).
  Placer deux éléments dans la même rangée par `grid-row` a fait créer des
  colonnes implicites par le placement automatique, et tout l'écran s'est
  défait (v0.1.0).
- Le portrait tient en 375 × 667 au pixel près : bougie de 80 px (120 au-delà
  de 760 px de haut) ; ajouter une rangée à l'heure demande d'en retirer une.
- `outils/audit-ecran.mjs` sur `index.html` seul ne voit que le titre : lui
  donner les clics jusqu'à l'heure (commande ci-dessus).
