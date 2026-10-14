# HAPAX — Bible du jeu

Il décrit **l'intention**. La technique est dans `CLAUDE.md`. Les décisions
de Jérôme sont datées par version ; les propositions pas encore tranchées
portent `[À VALIDER]`.

## Intention

La nuit du 29 au 30 mai 1832. Évariste Galois, vingt ans, se bat en duel à
l'aube et le sait. Il a une nuit pour écrire ce qu'il a trouvé. On joue
cette nuit : une chambre noire, une bougie, des feuilles. Chaque heure, on
assemble des fragments (théorèmes, ratures, intuitions, marginalia) en
figures qui comptent, avant que la bougie ne baisse. Ce qu'on ressent :
l'élégance d'une combinaison qui tombe juste, et le compte à rebours qui ne
s'arrête pas. On y revient parce qu'une nuit est courte et qu'aucune ne
ressemble à une autre.

## Piliers

1. **Le score se lit.** Chaque point a une origine visible : la figure,
   chaque fragment, chaque visiteur, puis le total, joués en séquence.
   Aucun hasard caché dans le score.
2. **Le temps est la seule ressource.** La cire, c'est le temps : il brûle
   quand on réfléchit, et chaque geste en coûte.
3. **Ce qui n'est écrit qu'une fois vaut plus.** Le hapax : un degré écrit
   pour la première fois de la nuit compte double.
4. **Papier, encre, flamme.** Rien d'autre à l'écran ; la flamme ne désigne
   que ce qui compte.
5. **Un jeu court et fermé.** Une nuit, une chambre, une aube (Le Feu
   follet).

## La boucle de jeu

- **Seconde** : toucher des fragments ; la figure et son calcul s'affichent
  aussitôt ; la flamme vacille.
- **Minute** (une heure de la nuit, ~1 à 2 min) : écrire ou froisser, jusqu'à
  l'objectif ou jusqu'à ce que la bougie s'éteigne.
- **Partie** (une nuit, ~10 min à terme) : les visiteurs choisis au début,
  les heures qui montent jusqu'à l'aube, le boss final.
- **Entre deux parties** : l'œuvre sauvée garde une page par nuit perdue ;
  de nouveaux fragments, visiteurs et mathématiciens se débloquent.

## Le lot minimal (v0.1.0)

1. Une heure complète (« Dix heures du soir ») : main de 8 fragments,
   écrire 1 à 5, froisser 1 à 5, repioche.
2. Les 9 figures, du plus bas au plus haut : Scolie, Lemme, Dilemme,
   Triade, Progression, Monographie, Syzygie, Quaternion, Résolvante.
3. 8 visiteurs (jokers) : trois proposés, deux gardés.
4. Un score à atteindre, la bougie qui brûle en temps réel et à chaque geste.

**Critère de validation** (Jérôme, v0.1.0) : sur 400 graines, un joueur
appliqué sauve l'heure environ 8 fois sur 10, un joueur au hasard au plus
1 fois sur 10. Mesuré : 90 % et 0 % à 6 s par geste, 83 % à 9 s ; une heure
dure ~110 s (`test/equilibrage.test.mjs`).

## Les systèmes

### Les fragments

52 : quatre sortes (Théorème, Rature, Intuition, Marginalia) × treize
degrés (I à XIII). La sorte se reconnaît à son signe, le degré à son
chiffre romain.

### Les figures

Les combinaisons du poker, nommées dans le lexique rare des mathématiques.
Points et mult de base dans les réglages.

### Les visiteurs

Personnes et idées de la nuit de Galois (Chevalier, Cauchy, Sophie
Germain, Abel, Stéphanie D., Fourier, l'insomnie, la corbeille). Chacun a
un effet lisible en une ligne ; l'ordre de leurs places compte.

### Le hapax

Interprétation retenue pour le lot minimal : le **degré** est le « mot ».
Un fragment dont le degré n'a jamais été écrit cette nuit compte double ;
froisser n'use pas un degré. La nuit avance, les hapax se raréfient.
`[À VALIDER]` : la lecture littérale (une même carte, employée une seule
fois de la nuit) ne se distingue qu'à partir de la deuxième heure.

### La bougie

100 de cire ; 0,6 par seconde ; écrire 12, froisser 6. Elle se fige en
pause et pendant la séquence du score.

## Le monde, le récit

Une chambre, une table, une bougie, des feuilles. Les noms sont réels (la
nuit de Galois est historique) ; tout le reste se dit en peu de mots, dans
le lexique rare (scolie, syzygie, résolvante…). Aucun texte n'explique : le
calcul s'affiche et se rejoue.

## Palette, échelle, son

La chambre est noire (encre de noix), les feuilles prennent la lumière
(vélin), le bistre marque les marges, la flamme désigne ce qui compte.
Typographie : une didone des années 1830 (Bodoni) et un Garamond.
Son : la plume qui gratte, la feuille, le froissement, un clavecin grave
pour chaque fragment qui compte, une quinte pour le hapax, un souffle quand
la bougie s'éteint.

## Public et accessibilité

Joueur averti, au pouce, en portrait, quelques minutes. Tout se fait aussi
au clavier et à la manette. La forme porte l'information (signe des sortes,
flamme du hapax cernée d'encre).

## Ce que le jeu refuse

- **Aucun tutoriel bavard** (Jérôme, v0.1.0) : la figure et son calcul
  s'affichent dès qu'on touche une carte ; la séquence enseigne le barème.
- **Pas de loot aléatoire sans lecture claire du score** (Jérôme, v0.1.0) :
  les visiteurs se choisissent, leurs effets tiennent en une ligne, et le
  calcul se montre avant d'écrire.
- Aucune couleur hors des quatre ; aucune illustration qui ne serait pas un
  signe.
- Pas de temps qui file pendant que le jeu compte (pause, séquence).

## Questions ouvertes

- Le hapax : lecture par degré (actuelle) ou littérale ? `[À VALIDER]`
- La nuit entière : combien d'heures avant l'aube, et quel boss est l'aube ?
- La cire qui reste à la fin d'une heure : rien, ou une monnaie ?
