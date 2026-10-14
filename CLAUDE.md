@.claude/conventions-jeu.md

# HAPAX

<!-- Ce fichier ne décrit QUE le jeu actuel (section 15 des conventions).
     Ce qui a été essayé puis retiré part dans docs/archives/, avec sa raison.
     Chaque règle porte son coût : le bug, la mesure ou la raison qui l'a fait naître. -->

## Description

<!-- En quelques lignes : le jeu, pour qui, la boucle de jeu en une phrase.
     L'intention complète est dans DESIGN.md. -->

- **Production** : https://supershivas.github.io/hapax/
- **Aperçu** : https://supershivas.github.io/hapax/apercu.html
- **Genre** : <!-- famille et genre (GENRES.md de game-system), boucle principale si hybride -->
- **Vue et rendu** : <!-- de dessus, pixel 2D canvas… ; profil game-system : profils/… -->
- **Cible** : <!-- téléphone portrait / paysage / bureau / plusieurs ; cible principale -->
- **Public** : <!-- enfant non lecteur, famille, joueur averti… -->
- **Session** : <!-- partie courte qui recommence, partie longue continue, niveaux… -->
- **Steam** : <!-- navigateur seulement / porte ouverte (section 22) -->
- Jeu : pas de sous-titre (section 3 des conventions).

### Palette

<!-- Chaque couleur, sa lettre, sa valeur, son rôle. Identique entre canvas,
     HUD, commandes et écran titre. Source unique : js/palette.js. -->

| Lettre | Valeur | Rôle |
|---|---|---|
| `n` | `#14182e` | nuit — le fond |
| `g` | `#3d4670` | ombre |
| `b` | `#e9ecf5` | encre |
| `a` | `#e0573e` | accent |

### Échelle

<!-- Résolution logique, facteur, taille du héros en pixels, et ce qui en
     découle (porte ≈ héros…). La planche d'échelle est un sujet du labo. -->

- Résolution logique : 320 × 180, mode `extend`, facteur entier.
- Héros : 8 × 8 pixels.

### Commandes

| Action | Clavier | Doigt / souris | Manette |
|---|---|---|---|
| Se déplacer | flèches, ZQSD / WASD | toucher ou glisser vers le point | stick gauche, croix |
| Pause | Échap, P | bouton pause | Start |

## Stack

- Vanilla JS, modules ES, sans build ; GitHub Pages par le workflow
  `.github/workflows/pages.yml` (tests avant publication).
- Modules de game-system dans `js/lib/` (tenus à jour par
  `scripts/sync-game-system.sh` au début de chaque session) ; outils dans
  `outils/`.
- Données : `localStorage`, clés `hapax:partie`, `hapax:prefs`,
  `hapax:atelier` (brouillon de l'atelier), `hapax:gh-token` (jamais
  exporté). Export / import JSON dans les réglages.
- Dépendances : aucune. <!-- ou : Phaser 3.90.0 dans vendor/ (accord de Jérôme, vX.Y.Z) -->

## Structure

- `index.html` — écran titre, HUD, réglages, pause (dialogues rattachés au body).
- `apercu.html` — le jeu dans un cadre de téléphone (iframe à la vraie taille).
- `js/main.js` — cycle de vie : titre → partie → pause ; réglages ; sauvegarde ;
  mise à jour ; debug.
- `js/game.js` — les règles, pures (aucun hasard hors `rng`, aucune horloge).
- `js/render.js` — le dessin ; ne modifie jamais l'état.
- `js/palette.js`, `js/sprites-data.js`, `js/data/` — la donnée.
- `js/design-store.js` — le contenu publié par l'atelier (`assets/design/`)
  plus le brouillon de ce navigateur.
- `labo.html`, `js/labo.js` — le labo (section 16).
- `atelier.html`, `js/atelier.js`, `css/atelier.css` — l'atelier (section 17).
- `test/` — `node outils/test-run.mjs`.
- `lisibilite.config.mjs`, `playtest.parcours.mjs` — configuration des outils.

## Vérifier et livrer

```bash
node outils/test-run.mjs                 # règles, sauvegarde, dessins
node outils/captures.mjs                 # téléphone + bureau, sans erreur console
node outils/audit-ecran.mjs              # débordement, amputation, cibles
node outils/lisibilite.mjs               # contraste, silhouettes
node outils/stamp-version.mjs            # après chaque changement de version.json
```

## Exceptions aux conventions

<!-- Règles de .claude/conventions-jeu.md qui ne s'appliquent pas ici, et pourquoi. -->

## Ce qui a été retiré

<!-- | Quoi | Version | Pourquoi (ce que ça coûtait) | -->

## Pièges connus

<!-- Bugs déjà rencontrés, comportements surprenants, choses à ne pas refaire. -->
