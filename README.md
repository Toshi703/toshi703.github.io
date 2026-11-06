# Neon Miner

Neon Miner est un jeu idle/clicker cyberpunk jouable dans le navigateur, construit en HTML, CSS et JavaScript vanilla. La version 2 ajoute des choix de surcharge thermique, des contrats réclamables et un atelier de recherche persistant, tout en conservant les générateurs, le prestige et les sauvegardes locales.

## Jouer en local

Ouvre `index.html` dans un navigateur récent. Pour tester via HTTP local, lance `python3 -m http.server 8000` depuis ce dossier, puis visite `http://localhost:8000`.

## Publier gratuitement sur GitHub Pages

Le dépôt public est `Toshi703/toshi703.github.io`. Dans **Settings → Pages**, sélectionne la branche `main` et le dossier `/(root)`. Le site est accessible à [https://toshi703.github.io/](https://toshi703.github.io/). Une publication GitHub Pages peut nécessiter un court délai après le push.

## Boucle et mécaniques

Clique ou touche **Miner des crédits** pour amorcer la ferme, puis investis dans les six générateurs afin d’automatiser les gains. Les achats ×1, ×10, ×100 et MAX sont calculés par lots; chaque générateur double sa propre production aux paliers de 25, 50, 100 et 250 unités.

Trois circuits ciblent des groupes distincts de générateurs. Un circuit déployé offre un burst de 12 secondes; les circuits partagent une jauge de chaleur et un seul peut tourner à la fois. À 100 % de chaleur, ils se verrouillent jusqu’au refroidissement sous 40 %. Les contrats sans échéance proposent trois objectifs différents — production, achats et surcharges — et rapportent des données à réclamer. Dépense ces données au laboratoire pour améliorer définitivement la production, le refroidissement ou les circuits.

Le reboot quantique demeure la boucle de prestige : les fragments gagnés suivent `floor(sqrt(crédits cumulés du cycle / 1 000 000))`. Il remet à zéro les crédits et les générateurs, mais conserve le prestige, les données, les recherches, les statistiques de carrière et les contrats. Les gains hors ligne sont calculés au chargement et plafonnés à 12 heures. Les effets sonores Web Audio sont désactivés par défaut.

Les anciennes sauvegardes `neonMinerSaveV1` sont migrées automatiquement. Les sauvegardes restent locales au navigateur; exporte-les en JSON pour les transférer. L’import remplace la progression locale après confirmation. Les données localStorage ne sont pas un compte cloud et peuvent disparaître si le navigateur ou ses données de site sont effacés.

## Publicité et distributions

Le site direct conserve le chargeur Google AdSense et le tag de zone Monetag fournis par le propriétaire. Le chargeur AdSense seul ne crée pas de bloc display et aucune unité `data-ad-slot` n’est configurée ici. Le bouton de boost récompensé reste un placeholder sans récompense publicitaire réelle. `ads.txt` contient la ligne éditeur AdSense fournie; le statut d’autorisation et la mise en service des annonces doivent être contrôlés dans les comptes des régies.

`sw.js` est enregistré sur le site direct et importe un script externe (`3nbf4.com`) qui n’a pas été audité. Pour générer une archive HTML5 sans les tags publicitaires, espaces pub, CDN, polices externes et service worker, lance `python3 scripts/build_portal_package.py`. Le ZIP ne contient pas de SDK Poki, CrazyGames ni d’autre portail : adapte et teste chaque intégration selon les règles du portail avant toute soumission.

## Fichiers principaux

- `index.html` — structure, interface et métadonnées.
- `styles.css` — thème, animations et mise en page responsive.
- `game.js` — économie, circuits, contrats, recherche, prestige et sauvegardes.
- `scripts/build_portal_package.py` — génération du ZIP propre pour portails.
- `ads.txt` — déclaration éditeur AdSense.
- `RESEARCH-PLAYBOOK.md` — principes de conception, références et limites de validation.
