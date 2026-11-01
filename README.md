# Neon Miner

Un jeu idle/clicker de navigateur, mobile-first, conçu en HTML, CSS et JavaScript vanilla. Tailwind CSS est chargé par CDN pour les utilitaires de mise en page; les styles du jeu et ses mécaniques restent dans des fichiers lisibles, sans compilation ni dépendance serveur.

## Jouer en local

Ouvrez `index.html` dans un navigateur récent connecté à Internet (le CDN Tailwind et les polices Web sont chargés à distance). Pour servir localement, lancez `python3 -m http.server 8000` dans ce dossier, puis ouvrez `http://localhost:8000`.

## Publier gratuitement sur GitHub Pages

Le dépôt public de ce projet est `Toshi703/toshi703.github.io`. Pour publier le site, ouvrez **Settings → Pages** et choisissez sous **Build and deployment** la branche `main` et le dossier `/(root)`, puis cliquez sur **Save**. L’adresse du site utilisateur est [https://toshi703.github.io/](https://toshi703.github.io/).

## Jouabilité

Cliquez sur **Miner des crédits** pour obtenir une ressource immédiate. Achetez les six infrastructures; chaque achat augmente la production passive et son prix progresse. Le reboot quantique devient disponible après un million de crédits cumulés : il remet à zéro crédits et améliorations, ajoute des fragments permanents et augmente les gains futurs de 10 % par niveau. La génération hors ligne est plafonnée à huit heures.

La progression est sauvegardée dans le stockage local du navigateur toutes les cinq secondes, à la fermeture de l’onglet et lors des changements d’onglet. Les sauvegardes restent sur cet appareil/navigateur et ne sont pas synchronisées entre appareils.

## Publicité et distributions

Le site direct charge le tag Monetag In-Page Push (zone `12167433`). Le bouton de boost « publicité récompensée » reste un placeholder : aucune récompense n’est accordée après visionnage d’une pub. `ads.txt` est encore un modèle, pas une entrée d’éditeur Monetag vérifiée.

`sw.js` est enregistré sur le site direct et importe le script externe `https://3nbf4.com/act/files/service-worker.min.js?r=sw`; cette dépendance n’a pas été auditée. Pour les portails qui refusent les publicités tierces ou les requêtes externes, construisez une archive propre avec `python3 scripts/build_portal_package.py`. Cette archive retire Monetag, les CDN/polices externes et le service worker; elle n’inclut pas le SDK d’un portail particulier.

Les métadonnées de partage, le JSON-LD, `robots.txt` et `sitemap.xml` améliorent la description technique du site, mais ne garantissent ni indexation ni résultats enrichis.

## Fichiers

- `index.html` — structure de page et composants.
- `styles.css` — thème, responsive design et animations.
- `game.js` — boucle de jeu, améliorations, prestige et persistance.
- `og-image.jpg` — visuel optimisé pour les cartes de partage.
- `robots.txt` et `sitemap.xml` — fichiers simples pour l’exploration du site.
- `sw.js` — service worker du site direct; importe un script tiers.
- `ads.txt` — modèle à compléter si un réseau publicitaire est utilisé.
- `scripts/build_portal_package.py` — fabrique le ZIP propre pour portails compatibles; sans SDK portail.
