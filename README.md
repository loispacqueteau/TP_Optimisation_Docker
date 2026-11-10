# Optimisation Docker - TP Node.js

Ce dépôt documente l'optimisation itérative d'un conteneur Docker pour l'application Node.js.

## Suivi de la taille des images (Tableau comparatif)

| Étape | Image de base / Méthode | Taille de l'image | Explications / Gains |
| :--- | :--- | :--- | :--- |
| **0. Baseline (Initial)** | `node:latest` + `COPY node_modules` | ~1.1 Go | Utilisation de `latest`, absence de cache, paquets Debian complets et `node_modules` local copié. |
| **1. Nettoyage de base** | `node:20-alpine` + `npm ci` | ~180 Mo | Passage à Alpine, séparation du cache des dépendances et suppression de `apt-get`. |
| **2. Multi-stage (Final)** | `node:20-alpine` (Builder + Runner) | ~95 Mo | Séparation de l'environnement de build et de production, utilisateur non-root. |

## Commandes de mesure
Pour vérifier la taille des images en local :
```bash
docker images