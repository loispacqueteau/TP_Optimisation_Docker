# TP : Optimisation Docker - TP Node.js

Ce dépôt documente la démarche d'optimisation itérative d'un conteneur Docker pour une application Node.js, réalisée dans le cadre du cours d'intégration continue à l'Université Toulouse Capitole (encadré par Harold Parpex).

--- 

## 1. Analyse de la Baseline (État Initial)

Le `Dockerfile` initial fourni présentait plusieurs anti-patterns majeurs :
- **Utilisation de `node:latest`** : Image de base très lourde (basée sur Debian complet), non figée, entraînant des risques de rupture de build et une surface d'attaque sécurité importante.
- **Copie préalable de `node_modules` (`COPY node_modules ./node_modules`)** : Intégration de fichiers locaux non maîtrisés et alourdissement massif du contexte de build.
- **Ordre des instructions inefficace** : `RUN npm install` exécuté *après* `COPY . /app`, ce qui invalide le cache Docker à la moindre modification de code.
- **Installation superflue de paquets système** : `apt-get install build-essential ...` inutile pour cette application simple.
- **Exécution en tant que `root`** : Risque de sécurité élevé en cas de compromission du conteneur.

---

## 2. Suivi de la taille des images (Tableau comparatif)

Voici l'évolution mesurée de la taille des images Docker après chaque étape d'optimisation :

| Étape | Description / Stratégie | Taille de l'image | Gains / Justifications |
| :--- | :--- | :--- | :--- |
| **0. Baseline** | `node:latest` + `COPY node_modules` + `apt-get` | ~1.1 Go | Image initiale non optimisée, lourde et non sécurisée. |
| **1. Nettoyage & Alpine** | `node:20-alpine` + `npm ci --only=production` | ~180 Mo | Passage à une distribution Alpine ultra-légère et exclusion des dépendances de dev. |
| **2. Sécurisation & Cache** | Optimisation de l'ordre des `COPY` et utilisateur non-root | ~120 Mo | Exploitation optimale du cache de build Docker et exécution en utilisateur non-privilégié (`USER node`). |

---

## 3. Le Dockerfile Optimisé (Version Finale)

```dockerfile
# --- Étape unique optimisée (ou multi-stage si build requis) ---
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

---

## 4. Analyse du code applicatif (`server.js`) et pistes d'amélioration

L'analyse du serveur Node.js a mis en évidence un point critique de performance :
- **Utilisation de `fs.readFileSync` sur la route `/big`** : Cette opération synchrone bloque complètement la boucle d'événements (Event Loop) de Node.js lors d'une requête, impactant la scalabilité. 
- *Piste d'amélioration* : Remplacer par un flux de lecture asynchrone (`fs.createReadStream`) pour fluidifier le traitement des requêtes simultanées.

---

## 5. Commandes utiles

Pour construire et tester l'image finale en local :
```bash
# Construction de l'image
docker build -t tp-node-optimized .

# Lancement du conteneur
docker run -d -p 3000:3000 --name app-optimisee tp-node-optimized

# Vérification de la taille des images
docker images
```