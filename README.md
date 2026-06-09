# 🔥 Carburant API

API REST et GraphQL pour le suivi des prix des carburants en France avec gestion de la consommation des véhicules.

## 📋 Table of Contents

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Scripts disponibles](#-scripts-disponibles)
- [Architecture](#-architecture)
- [API REST](#-api-rest)
- [API GraphQL](#-api-graphql)
- [Gestion des données](#-gestion-des-données)

---

## ✨ Fonctionnalités

### Suivi des prix
- 📍 Recherche des stations à proximité (rayon configurable)
- 📊 Statistiques nationales et départementales des prix
- 📈 Historique des fluctuations de prix par station
- 🔄 Import automatique quotidien des données

### Gestion des véhicules
- 🚗 CRUD véhicules (création, lecture, modification, suppression)
- ⛽ Suivi des pleins (date, km, litres, tarif)
- 📉 Statistiques de consommation et coûts
- 🔒 Isolation des données par utilisateur

### Authentification
- 👤 Inscription/Connexion
- 🔐 JWT pour sécuriser les routes protégées
- 👥 Rôles utilisateur

---

## 🚀 Installation

### Prérequis
- Node.js >= 18
- PostgreSQL >= 12
- npm ou yarn

### Étapes

```bash
# 1. Cloner le repository
git clone <repo-url>
cd carburant-api

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env

# 4. Configurer les variables d'environnement
# Voir section Configuration ci-dessous

# 5. Construire le projet
npm run build

# 6. Démarrer en développement
npm run dev
```

---

## ⚙️ Configuration

Créer un fichier `.env` à la racine du projet :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=carburant_db

# JWT
JWT_SECRET=your_super_secret_key_here

# Serveur
PORT=3000
NODE_ENV=development

# Import des villes (optionnel)
CITIES_CSV_URL=https://www.data.gouv.fr/...

# Cron jobs
ENABLE_CRON=true
```

---

## 📦 Scripts disponibles

```bash
# Développement
npm run dev              # Démarrer en mode watch avec ts-node-dev

# Build & Production
npm run build            # Compiler TypeScript en JavaScript
npm start                # Démarrer l'application compilée

# Import de données
npm run import:cities    # Importer les communes françaises
npm run import:prices    # Importer les prix des carburants
npm run import:all       # Importer tout

# Tests
npm test                 # Lancer les tests avec vitest
```

---

## 🏗️ Architecture

### Structure du projet

```
src/
├── app.ts                    # Point d'entrée principal
├── config/                   # Configuration (DB, Swagger)
├── controllers/              # Handlers HTTP (allégés)
├── services/                 # Logique métier isolée
├── routes/                   # Définition des endpoints
├── entities/                 # Modèles TypeORM
├── middleware/               # Authentification, etc.
├── graphql/                  # Schéma et resolvers GraphQL
├── scheduler/                # Tâches cron
├── scripts/                  # Scripts d'import de données
└── __tests__/                # Tests unitaires
```

### Pattern Services → Controllers → Routes

1. **Services** (`src/services/`) : Logique métier, requêtes BDD
2. **Controllers** (`src/controllers/`) : Gestion des requêtes HTTP
3. **Routes** (`src/routes/`) : Définition des endpoints

```typescript
// Service
export const getNationalStats = async (fuelType?: string, from?: string, to?: string) => {
  // Logique métier
};

// Controller
export const getNationalStatsHandler = async (req: Request, res: Response) => {
  const stats = await getNationalStats(fuelType, from, to);
  res.json({ scope: "national", stats });
};

// Route
router.get("/national", getNationalStatsHandler);
```

---

## 🔌 API REST

Base URL : `http://localhost:3000/api`

### Authentification

**POST** `/auth/register`
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**POST** `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
Response: { "token": "jwt...", "user": {...} }
```

**GET** `/auth/me` (protégé)

---

### Villes

**GET** `/cities?name=Bordeaux&dep=33&limit=20`
- `name` : Recherche par nom (optionnel)
- `dep` : Code département (optionnel)
- `limit` : Max résultats (défaut: 20)

**GET** `/cities/{codeInsee}`

---

### Stations

**GET** `/stations/nearby?city=Bordeaux&radius=10`
Alternatives:
- `?lat=44.8378&lon=-0.5792&radius=15`

**GET** `/stations/{id}`

**GET** `/stations/{id}/prices?dateDebPeriode=2026-01-01&dateFinPeriode=2026-06-01&fuelType=SP95`

---

### Prix & Statistiques

**GET** `/prices/national?fuelType=SP95&dateDebPeriode=2026-01-01&dateFinPeriode=2026-06-01`

**GET** `/prices/departement/{depCode}?fuelType=Gazole`
- Ex: `/prices/departement/33`

---

### Véhicules (protégé)

**GET** `/vehicles` - Liste mes véhicules

**POST** `/vehicles`
```json
{
  "nom": "Ma Peugeot",
  "marque": "Peugeot",
  "modele": "308",
  "annee": 2022,
  "fuelTypeNom": "SP95"
}
```

**GET** `/vehicles/{id}`

**PUT** `/vehicles/{id}`

**DELETE** `/vehicles/{id}`

**GET** `/vehicles/{id}/logs` - Historique des pleins

**POST** `/vehicles/{id}/logs`
```json
{
  "date": "2026-06-08",
  "kilometres": 45230,
  "litres": 42.5,
  "prix_litre": 1.789,
  "station_id": "33063001"
}
```

**GET** `/vehicles/{id}/stats?dateDebPeriode=2026-01-01&dateFinPeriode=2026-06-01`

---

## 📡 API GraphQL

Endpoint : `POST http://localhost:3000/graphiql`

### Exemple de queries

```graphql
# Villes
query {
  cities(name: "Bordeaux", limit: 10) {
    id
    nom_standard
    latitude
    longitude
    population
  }
}

# Stations à proximité
query {
  nearbyStations(city: "Bordeaux", radius: 10) {
    id
    adresse
    ville
    latitude
    longitude
  }
}

# Statistiques nationales
query {
  nationalStats(fuelType: "SP95", from: "2026-01-01", to: "2026-06-01") {
    stats {
      carburant
      moyenne
      min
      max
      ecart_type
    }
  }
}

# Mes véhicules
query {
  vehicles(userId: 1) {
    id
    nom
    marque
    modele
  }
  
  vehicleStats(vehicleId: 1, userId: 1) {
    vehicleNom
    consommationMoyenne_L100km
    coutParKm
    totalDepense
  }
}
```

---

## 📊 Gestion des données

### Import des villes

```bash
npm run import:cities
```

Récupère les communes depuis l'API data.gouv.fr avec :
- Code INSEE
- Nom standard et sans accent
- Code/Nom département
- Code/Nom région
- Latitude/Longitude
- Population

### Import des prix

```bash
npm run import:prices
```

Récupère les prix des carburants depuis le site gouvernemental :
- Stations françaises
- Tous les types de carburants (SP95, Gazole, E10, E85, SP98, GPLc)
- Mise à jour quotidienne via cron

### Scheduler (Cron)

Les tâches cron sont gérées automatiquement via `src/scheduler/cron.ts`

---

## 📚 Documentation

### Swagger UI

Accédez à : `http://localhost:3000/api/docs`

Tous les endpoints REST y sont documentés avec exemples.

---

## 🔐 Authentification

Les headers requis pour les routes protégées :

```
Authorization: Bearer <your_jwt_token>
```

Le token JWT contient :
- `id` : ID utilisateur
- `email` : Email utilisateur
- `role` : Rôle (user, admin, etc.)
- `expiresIn` : 7 jours

---

## 🐛 Dépannage

### Erreur de connexion BDD
```
Vérifier les credentials dans .env
Vérifier que PostgreSQL est lancé
Vérifier que la DB existe
```

### Erreur JWT invalid
```
Vérifier que le token n'a pas expiré
Vérifier la valeur de JWT_SECRET dans .env
```

### Pas de données après import
```
Vérifier les logs de npm run import:cities
Vérifier que les URLs d'import sont accessibles
```



**API démarrée** ✅  
- **REST** : http://localhost:3000/api
- **Swagger** : http://localhost:3000/api/docs
- **GraphQL** : http://localhost:3000/graphiql
