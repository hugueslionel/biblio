# Bibliothèque Pyrénéenne

Une application de gestion de bibliothèque personnelle avec Electron.

## Fonctionnalités

- Gestion de plusieurs bibliothèques
- Interface principale sommaire avec tableau des livres
- Fenêtre de détail pour chaque livre avec :
  - Description étendue
  - Galerie d'images multiples (drag & drop)
  - Informations complémentaires (éditeur, année, ISBN, pages)
  - Commentaires personnels
- Recherche en temps réel
- Import/Export des données en JSON
- Sauvegarde automatique

## Structure du projet
bibliotheque-pyreneenne/
├── index.html # Interface principale
├── styles/
│ └── main.css # Feuille de style
├── scripts/
│ ├── main.js # Point d'entrée
│ ├── utils.js # Fonctions utilitaires
│ ├── library.js # Gestion des bibliothèques
│ ├── table.js # Affichage du tableau
│ └── detailModal.js # Fenêtre de détail
└── main.js # Fichier principal Electron

## Installation

1. Cloner le dépôt
2. Installer les dépendances : `npm install`
3. Lancer l'application : `npm start`

## Développement

Pour développer, exécutez : `npm run dev`

## Licence

MIT
