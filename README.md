# Neon Miner

Un jeu idle/clicker cyberpunk de navigateur, mobile-first, conçu en HTML, CSS et JavaScript vanilla. Le site direct charge des services externes (polices, Tailwind, AdSense et Monetag); le moteur du jeu et ses sauvegardes sont gérés dans des fichiers locaux sans framework.

## Jouer en local

Ouvrez `index.html` dans un navigateur récent connecté à Internet. Pour servir le projet localement, lancez `python3 -m http.server 8000` dans ce dossier, puis ouvrez `http://localhost:8000`.

## Publier gratuitement sur GitHub Pages

Le dépôt public est `Toshi703/toshi703.github.io`. Dans **Settings → Pages**, la source doit être la branche `main` et le dossier `/(root)`. L’adresse du site est [https://toshi703.github.io/](https://toshi703.github.io/).

## Mécaniques

Cliquez ou touchez **Miner des crédits**, puis achetez six types d’infrastructures pour faire croître la production passive. Les boutons ×1, ×10, ×100 et MAX achètent plusieurs unités d’un coup avec un calcul géométrique en temps constant. Chaque générateur double sa propre production quand il atteint 25, 50, 100 puis 250 unités.

Le reboot quantique reste la boucle de prestige : les fragments gagnés dépendent de la progression du cycle selon `floor(sqrt(crédits cumulés / 1 000 000))`. Le reboot conserve les fragments déjà obtenus, remet les crédits et infrastructures du cycle à zéro, puis augmente la production permanente de 10 % par fragment.

La production hors ligne est accordée au chargement et plafonnée à 12 heures. Une fenêtre récapitule la durée et les crédits gagnés. Les effets sonores sont synthétisés par Web Audio, désactivés par défaut et activables depuis l’icône sonore. Les sauvegardes restent locales au navigateur; les boutons d’export/import permettent de transférer un fichier JSON manuellement entre appareils.

Les anciennes sauvegardes `neonMinerSaveV1` sont migrées automatiquement. L’import remplace la sauvegarde locale après confirmation. Pour éviter les pertes, exportez une copie avant un import ou une réinitialisation.

## Publicité et distributions

Le site direct contient le chargeur Google AdSense du compte indiqué, ainsi qu’une zone Monetag In-Page Push. Le chargeur AdSense seul ne crée pas de bloc display; aucune unité `data-ad-slot` n’est configurée ici. Le bouton de boost récompensé reste un placeholder et ne remet aucune récompense réelle. `ads.txt` contient la ligne éditeur fournie pour AdSense; le statut d’autorisation doit être confirmé dans le compte AdSense.

`sw.js` est enregistré sur le site direct et importe un script externe (`3nbf4.com`) qui n’a pas été audité. Pour fabriquer un paquet sans publicité tierce ni appels réseau externes, lancez `python3 scripts/build_portal_package.py`. Le ZIP nettoyé enlève les tags publicitaires, les encarts publicitaires visibles, les CDN/polices et le service worker. Il ne contient pas de SDK Poki, CrazyGames ou autre portail; vérifiez les règles et instructions d’intégration du portail avant toute soumission.

## Fichiers principaux

- `index.html` — structure et composants d’interface.
- `styles.css` — thème, responsive design et animations.
- `game.js` — progression, améliorations, prestige, sauvegardes, sons et import/export.
- `scripts/build_portal_package.py` — construit le ZIP propre pour une intégration portail ultérieure.
- `ads.txt` — vendeur AdSense déclaré.
