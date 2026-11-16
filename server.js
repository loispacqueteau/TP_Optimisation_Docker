const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware de journalisation
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello world — serveur optimisé');
});

app.get('/big', (req, res) => {
  const filePath = path.join(__dirname, 'maybe-big-file.txt');
  
  if (fs.existsSync(filePath)) {
    // Utilisation d'un stream pour ne pas bloquer l'Event Loop de Node.js
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const stream = fs.createReadStream(filePath, 'utf8');
    
    stream.on('error', (err) => {
      console.error(err);
      res.status(500).send('Erreur lors de la lecture du fichier');
    });

    stream.pipe(res);
  } else {
    res.status(404).send('Fichier introuvable');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});