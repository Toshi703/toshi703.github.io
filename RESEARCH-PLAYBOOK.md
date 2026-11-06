# Neon Miner — playbook de recherche et de conception

## Diagnostic : où se trouve le trou de plaisir ?

**Constat produit (brief) :** Neon Miner propose crédits, six générateurs, prestige, achats groupés, multiplicateurs de palier et gains hors ligne; le joueur signale l’ennui après cinq minutes. Les études fournies ne mesurent pas Neon Miner et ne permettent pas d’attribuer cet ennui à une cause unique.

**Diagnostic de conception (inférence à tester) :** la boucle actuelle semble principalement convertir l’attente en crédits, puis les crédits en débit supérieur. Une fois les six générateurs et les achats groupés compris, les opérations risquent de se réduire à comparer un prix et acheter. Le prestige et les multiplicateurs peuvent amplifier les nombres sans changer ce que le joueur fait. Le système répond peut-être à « combien vais-je produire ? », mais offre trop peu de réponses intéressantes à « que vais-je décider maintenant ? ». À cinq minutes, il faut un objectif proche, une intervention facultative ayant un effet lisible et un arbitrage dont le coût d’opportunité soit perceptible — pas simplement plus de croissance numérique.

Les références soutiennent des **principes**, non des promesses d’engagement : Cookie Clicker rend visibles stock et débit et introduit des événements; Antimatter Dimensions articule achats et seuils/reset; Realm Grinder distingue des styles d’activité et des pouvoirs temporaires; NGU Idle combine allocation, seuils et progression de run; Universal Paperclips fait évoluer les systèmes par projets et ressources contraintes; Vampire Survivors montre des choix de construction sous pression. Aucune source fournie n’apporte de données internes comparatives de rétention, d’effet causal ou de cadence optimale.

## Principes transposés et anti-patterns

### À transposer

- **Lisibilité immédiate :** stock, débit/s, coût complet, effet prévu de l’achat et prochain seuil accessibles sans calcul mental. C’est cohérent avec l’interface décrite de Cookie Clicker et Antimatter Dimensions [1][5].
- **Une action manuelle, une production automatique :** l’action directe donne une réponse instantanée; les générateurs prolongent le progrès sans exiger un clic constant. Le clic est une option active, non un péage [1][14].
- **Choix d’allocation concret :** investir maintenant dans un rendement modeste ou conserver sa réserve pour un palier; faire apparaître ce compromis plutôt que multiplier les achats quasi-identiques [1][5][12].
- **Progression par phases :** un seul nouveau mécanisme à la fois, déclenché par un seuil compréhensible. Les références montrent des changements de systèmes, mais aussi le coût de leur ampleur [5][9][12].
- **Feedback de décision :** animation courte, delta de débit et progression vers un jalon; un effet temporaire doit être annoncé, compréhensible et non obligatoire [2][8].
- **Reset explicite et facultatif, seulement si la boucle initiale le justifie :** avant confirmation, distinguer ce qui est perdu de ce qui est conservé et montrer le bénéfice concret [3][6][11].

### À éviter

Ne pas reprendre noms, visuels, textes, formules, interface ou univers des références. Ne pas importer leur contenu tardif (factions, arbres, dizaines de systèmes, centaines d’objets, vagues de prestige). Ne pas confondre des achats nombreux avec des choix substantiels, ni ajouter de réinitialisation au seul motif que d’autres jeux en ont une. Éviter les clics répétitifs obligatoires, les événements opaques ou manqués qui punissent l’absence, les resets imposés, les ressources sans usage clair et les chiffres exponentiels comme unique récompense. Les descriptions disponibles n’étayent aucune affirmation de rétention ou de succès commercial.

## Proposition de boucle active jouable — « surcharge de forage »

**Recommandation à prototyper, non fonctionnalité déjà existante :** garder les crédits et générateurs. Ajouter une action active unique appelée ici *Surcharge* : le joueur choisit un des trois nœuds de forage visibles et y consacre une charge d’énergie limitée; pendant une courte durée, le nœud produit davantage, mais accumule de la chaleur. À chaleur élevée, son rendement revient au niveau de base jusqu’au refroidissement. Un clic de minage/salvage reste toujours possible et donne un petit montant fixe. La production passive continue, même si le joueur ne touche à rien.

L’interface présente sur chaque nœud son débit, sa chaleur, la durée de surcharge et le gain supplémentaire estimé. L’action ne dépend pas d’un réflexe à la seconde : le joueur choisit quand l’activer, et la chaleur redescend sans surveillance active. Pour une version encore plus réduite, supprimer la charge séparée et limiter la surcharge par un temps de recharge; ne pas introduire les deux ressources avant d’avoir vérifié la compréhension.

**Choix réels :** surcharger le meilleur nœud maintenant pour accélérer l’achat prochain, ou garder sa capacité pour un nœud qui s’ouvre bientôt; acheter un générateur bon marché pour le débit immédiat, ou épargner pour le palier. Le coût (charge/chaleur ou délai) et le bénéfice prévu doivent être visibles avant l’action.

**Tension :** risque limité de mauvais tempo et de coût d’opportunité, pas de perte de crédits accumulés ni d’événement à fenêtre punitive. L’absence ne doit pas faire manquer une récompense essentielle. La chaleur crée une contrainte temporaire compréhensible, sans demander des clics frénétiques.

**Récompense :** réponse visuelle/audio légère à l’activation, hausse du compteur et du débit effectivement attribuée à la surcharge, puis un jalon proche (nouvel outil ou secteur) qui change l’option disponible. Ces effets sont des propositions de prototype, pas des résultats démontrés par les études.

## Progression par horizon

| Horizon | Expérience proposée | Signal et choix |
|---|---|---|
| **5 minutes** | Comprendre le stock et le débit, effectuer un premier achat, essayer la Surcharge et atteindre le premier jalon de forage. | Chaque achat affiche son effet; le prochain seuil est visible; aucune présence continue n’est requise. |
| **30 minutes** | Débloquer une seule spécialisation parmi deux modules clairement distincts, par exemple refroidissement plus rapide ou surcharge plus efficace; ouvrir un second secteur avec une autre contrainte simple. | Le joueur choisit un style d’investissement, compare l’économie générale au rendement local et voit un objectif de run atteignable. |
| **Plusieurs sessions** | Conserver quelques déblocages de plan/secteur et reprendre avec une prochaine étape explicite. Tester ensuite, si la première boucle tient, un reset de run optionnel donnant un module permanent déterminé et compréhensible. | Expliquer les pertes et gains avant reset; permettre aussi de continuer sans reset. Aucun contenu, délai ou bonus de prestige n’est considéré validé à ce stade. |

Cette table est une **cible de design**, pas un engagement de durée ni une prévision de rétention. Les durées et seuils doivent être ajustés par tests de compréhension et de rythme.

## Tranche verticale raisonnable en vanilla JS

**Recommandation initiale de périmètre :** un écran responsive, un secteur, trois nœuds, les six générateurs actuels conservés si déjà implémentés, un clic de salvage, une Surcharge, une jauge de chaleur/recharge, deux jalons, deux modules mutuellement exclusifs et sauvegarde locale. Boucle complète : démarrer → produire/clicker facultativement → choisir un achat ou une surcharge → atteindre un jalon → débloquer un module → sauvegarder et reprendre. Le prototype Neon Miner a ensuite dépassé cette tranche minimale avec des contrats, une monnaie secondaire et plusieurs branches de recherche; cet élargissement n’est pas en soi une preuve de meilleur rythme.

Implémentation JS simple : état de jeu centralisé; boucle temporelle basée sur delta de temps plutôt que sur hypothèse de frame fixe; fonction de simulation séparée du rendu; calcul déterministe du débit, coût, chaleur et recharge; sauvegarde versionnée dans `localStorage` et validation des données chargées. Limiter les intervalles hors ligne à une durée explicitement décidée pour éviter des gains absurdes. Contrôles clavier/tactiles accessibles, texte explicatif près de chaque valeur et boutons désactivés avec raison affichée. Ce sont des recommandations d’ingénierie, non des faits issus des études.

**À observer au test, sans prétendre à une métrique de rétention :** le joueur peut-il expliquer le débit, le coût d’opportunité et la chaleur? choisit-il volontairement entre modules? la Surcharge ajoute-t-elle une décision que le joueur comprend, ou seulement une routine? Si incompréhensible ou redondante, réduire ou retirer la mécanique plutôt que l’empiler.

### État du prototype Neon Miner (6 novembre 2026)

Le build actuel comprend les six générateurs et achats groupés, trois circuits avec groupes dédiés, multiplicateurs, durée fixe et chaleur partagée, trois catégories de contrats sans échéance (un objectif de chaque type à la fois), une monnaie de données à réclamer, trois branches de recherche persistantes, le prestige existant et des gains hors ligne plafonnés. Les tests automatisés ont couvert la migration d’une sauvegarde V1, l’achat MAX, les contrats (dont la réclamation unique), la recherche après prestige, le démarrage et l’expiration d’un burst, la surchauffe/le refroidissement, le plafond de 12 h et les interactions principales dans Chromium à 1440 px et 390 px sans débordement horizontal. Ils n’évaluent ni l’amusement perçu, ni l’équilibre sur plusieurs heures, ni la rétention réelle : une séance observée avec nouveaux joueurs, notamment autour de cinq minutes, reste indispensable.

## Études manquantes / limites

Les études fournies documentent des mécaniques publiques des six jeux cités; elles ne contiennent pas de test utilisateur de Neon Miner, de données de télémétrie, de comparaison contrôlée des boucles, ni d’étude sur les durées proposées. Il manque donc : observation de nouveaux joueurs autour de la minute 5; données de points de sortie et achats; test de compréhension de l’interface; comparaison de prototype avec/sans action active; essais clavier, tactile et accessibilité; calibration des coûts et du hors-ligne. Toute affirmation sur une amélioration de rétention devra attendre des données propres au jeu.

## Références

Les numéros entre crochets dans le texte renvoient aux sources vérifiées fournies dans le dossier. Les pages communautaires sont secondaires; les pages officielles constituent les sources primaires quand elles existent.

[1] **Cookie Clicker — jeu officiel**. https://orteil.dashnet.org/cookieclicker/

[2] **Cookie Clicker Wiki — Golden Cookie**. https://cookieclicker.wiki.gg/wiki/Golden_Cookie

[3] **Cookie Clicker Wiki — Ascension**. https://cookieclicker.wiki.gg/wiki/Ascension

[4] **Cookie Clicker Wiki — Minigames**. https://cookieclicker.wiki.gg/wiki/Minigames

[5] **Antimatter Dimensions — jeu web officiel jouable**. https://ivark.github.io/AntimatterDimensions/

[6] **Antimatter Dimensions — page officielle Steam**. https://store.steampowered.com/app/1399720/Antimatter_Dimensions/

[7] **IvarK/AntimatterDimensionsSourceCode — dépôt source du développeur**. https://github.com/IvarK/AntimatterDimensionsSourceCode

[8] **Realm Grinder — page officielle Steam, description par Divine Games/Kongregate**. https://store.steampowered.com/app/610080/Realm_Grinder/

[9] **Realm Grinder Wiki — Factions**. https://realm-grinder.fandom.com/wiki/Factions

[10] **Realm Grinder Wiki — Terminology**. https://realm-grinder.fandom.com/wiki/Terminology

[11] **G00F’s Not-a-Wiki — Spells**. http://musicfamily.org/realm/Spells/

[12] **NGU IDLE — Steam Store, page officielle du jeu par le développeur/éditeur 4G**. https://store.steampowered.com/app/1147690/NGU_IDLE/

[13] **NGU Idle Guide — Introduction**. https://sayolove.github.io/ngu-guide/en/intro/

[14] **NGU Idle Guide — Chapter 1: Start-HSB**. https://sayolove.github.io/ngu-guide/en/chapters/chapter-1/

[15] **Rebirths — NGU Idle Wiki**. https://ngu-idle.fandom.com/wiki/Rebirths

[16] **Universal Paperclips — jeu web officiel**. https://www.decisionproblem.com/paperclips/index2.html

[17] **Frank Lantz — Selected Games, Universal Paperclips**. https://www.franklantz.net/work

[18] **jgmize/paperclips — dépôt miroir du jeu**. https://github.com/jgmize/paperclips

[19] **Vampire Survivors — page officielle de poncle**. https://poncle.games/vampire-survivors

[20] **Vampire Survivors sur Steam — poncle**. https://store.steampowered.com/app/1794680/Vampire_Survivors/

[21] **Vampire Survivors — page officielle de poncle sur itch.io**. https://poncle.itch.io/vampire-survivors

[22] **Vampire Survivors Wiki — aperçu et gameplay**. https://vampire.survivors.wiki/w/Vampire_Survivors
