# Neon Miner

Un jeu idle/clicker de navigateur, mobile-first, conçu en HTML, CSS et JavaScript vanilla. Tailwind CSS est chargé par CDN pour les utilitaires de mise en page; les styles du jeu et ses mécaniques restent dans des fichiers lisibles, sans compilation ni dépendance serveur.

## Jouer en local

Ouvrez `index.html` dans un navigateur récent connecté à Internet (le CDN Tailwind et les polices Web sont chargés à distance). Pour servir localement, lancez `python3 -m http.server 8000` dans ce dossier, puis ouvrez `http://localhost:8000`.

## Publier gratuitement sur GitHub Pages

Le dépôt public de ce projet est `Toshi703/toshi703.github.io`. Pour publier le site, ouvrez **Settings → Pages** et choisissez sous **Build and deployment** la branche `main` et le dossier `/(root)`, puis cliquez sur **Save**. L’adresse du site utilisateur est [https://toshi703.github.io/](https://toshi703.github.io/).

## Jouabilité

Cliquez sur **Miner des crédits** pour obtenir une ressource immédiate. Achetez les six infrastructures; chaque achat augmente la production passive et son prix progresse. Le reboot quantique devient disponible après un million de crédits cumulés : il remet à zéro crédits et améliorations, ajoute des fragments permanents et augmente les gains futurs de 10 % par niveau. La génération hors ligne est plafonnée à huit heures.

La progression est sauvegardée dans le stockage local du navigateur toutes les cinq secondes, à la fermeture de l’onglet et lors des changements d’onglet. Les sauvegardes restent sur cet appareil/navigateur et ne sont pas synchronisées entre appareils.

## Publicité

Les emplacements banner et rewarded sont des placeholders; aucune publicité réelle n’est téléchargée ni récompense simulée. Un fournisseur compatible devra être intégré avant une monétisation réelle. `ads.txt` est un modèle : remplacez-le avec les valeurs vérifiées fournies par votre réseau publicitaire; ne laissez pas l’exemple fictif en production.

## Fichiers

- `index.html` — structure de page et composants.
- `styles.css` — thème, responsive design et animations.
- `game.js` — boucle de jeu, améliorations, prestige et persistance.
- `sw.js` — service worker configuré et enregistré par le jeu.
- `ads.txt` — modèle à compléter si un réseau publicitaire est utilisé.
