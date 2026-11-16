# TP : Optimisation d'une application Node.js et de son Dockerfile

Ce dépôt documente la démarche d'optimisation itérative d'un conteneur Docker et du code source pour une application Node.js, réalisée dans le cadre du cours d'intégration continue à l'Université Toulouse Capitole (encadré par Harold Parpex).

## 📋 Table des matières

1. [Analyse de la Baseline (État Initial)](#1-analyse-de-la-baseline-état-initial)
2. [Suivi de la taille des images (Tableau comparatif)](#2-suivi-de-la-taille-des-images-tableau-comparatif)
3. [Stratégie des commits atomiques](#3-stratégie-des-commits-atomiques)
4. [Optimisation du Code Applicatif (`server.js`)](#4-optimisation-du-code-applicatif-serverjs)
5. [Le Dockerfile Optimisé & `.dockerignore`] (#5-le-dockerfile-optimisé--dockerignore)
6. [Commandes utiles](#6-commandes-utiles)

## 1. Analyse de la Baseline (État Initial)

Le `Dockerfile` initial fourni présentait plusieurs anti-patterns majeurs corrigés au fil des étapes :
* **Utilisation de `node:latest`** : Image de base très lourde (basée sur Debian complet) et non figée.
* **Copie préalable de `node_modules` (`COPY node_modules ./node_modules`)** : Intégration de fichiers locaux non maîtrisés.
* **Ordre des instructions inefficace** : `RUN npm install` exécuté *après* `COPY . /app`, invalidant le cache inutilement.
* **Exécution en tant que `root`** : Risque de sécurité élevé.

## 2. Suivi de la taille des images (Tableau comparatif)

Voici l'évolution mesurée de la taille des images Docker après chaque étape d'optimisation :

| Étape | Description / Stratégie | Taille de l'image | Gains / Justifications | 
| ----- | ----- | ----- | ----- | 
| **0. Baseline** | `node:latest` + `COPY node_modules` + `apt-get` | ~1.1 Go | Image initiale non optimisée, lourde et non sécurisée. | 
| **1. Nettoyage & Alpine** | `node:20-alpine` + `npm ci --only=production` | ~180 Mo | Passage à une distribution Alpine ultra-légère et exclusion des dépendances de dev. | 
| **2. Sécurisation & Cache** | Optimisation du cache, `.dockerignore` et utilisateur non-root | ~120 Mo | Contexte de build réduit, exploitation du cache Docker et exécution en utilisateur non-privilégié (`USER node`). | 

## 3. Stratégie des commits atomiques

Conformément aux consignes du TP, le dépôt Git a été structuré avec des commits atomiques représentant chaque jalon :
1. `feat(docker): initial baseline setup` - Ajout de l'application et du Dockerfile non optimisé.
2. `refactor(docker): switch to node-alpine and fix npm install order` - Allègement de l'image de base et optimisation du cache.
3. `refactor(app): optimize big file route using streams` - Remplacement de la lecture synchrone bloquante par un flux asynchrone.
4. `security(docker): run container as non-root user and add dockerignore` - Renforcement de la sécurité et exclusion des fichiers superflus.

## 4. Optimisation du Code Applicatif (`server.js`)

L'analyse initiale du code a mis en évidence un point critique de performance corrigé :
* **Problème initial** : Utilisation de `fs.readFileSync` sur la route `/big`, ce qui bloque complètement la boucle d'événements (*Event Loop*) de Node.js lors d'une requête simultanée.
* **Correction appliquée** : Utilisation de `fs.createReadStream().pipe(res)` pour streamer le contenu du fichier de manière asynchrone, garantissant une scalabilité optimale sous forte charge.

## 5. Le Dockerfile Optimisé & `.dockerignore`

### `Dockerfile`
```dockerfile
# Utilisation d'une image LTS Alpine légère et figée
FROM node:20-alpine

WORKDIR /app

# Copie exclusive des fichiers de dépendances pour tirer parti du cache Docker
COPY package*.json ./

# Installation propre et stricte des dépendances de production
RUN npm ci --only=production

# Copie du code source minimal nécessaire au fonctionnement
COPY server.js ./

# Sécurité : Utilisation de l'utilisateur non-root natif d'Alpine
USER node

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
```

### `.dockerignore`
```text
node_modules
npm-debug.log
Dockerfile
docker-compose*.yml
.git
README.md
*.zip
*.pptx
*.py
```

## 6. Commandes utiles

Pour construire et tester l'image finale en local :
```bash
# Construction de l'image
docker build -t tp-node-optimized .

# Lancement du conteneur
docker run -d -p 3000:3000 --name app-optimisee tp-node-optimized

# Vérification de la taille des images
docker images
```