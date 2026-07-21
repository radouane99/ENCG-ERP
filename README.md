# ENCG ERP — Plateforme de Gestion Universitaire

> Système ERP complet pour les Écoles Nationales de Commerce et de Gestion (ENCG) du Maroc.

---

## 🏗️ Stack Technique

| Couche | Technologie |
|---|---|
| **Backend** | Laravel 12 · PHP 8.4-FPM-Alpine |
| **Frontend** | React 19 · Vite 8 · TypeScript · TailwindCSS v4 |
| **Base de données** | PostgreSQL 16 |
| **Cache / Queue** | Redis 7 |
| **WebSocket** | Laravel Reverb |
| **Queue Worker** | Laravel Horizon |
| **File Storage** | MinIO (S3-compatible) |
| **Mail (dev)** | Mailpit |
| **Proxy** | Nginx Alpine |

---

## 🖥️ Services & Ports

| Service | Conteneur | Port exposé | Description |
|---|---|---|---|
| Nginx | `encg_nginx` | `:80` | Reverse proxy (API + Frontend) |
| Backend API | `encg_backend` | `:9000` (interne) | Laravel PHP-FPM |
| Frontend | `encg_frontend` | `:5173` | Vite dev server (React) |
| Reverb | `encg_reverb` | `:8080` | WebSocket server |
| PostgreSQL | `encg_postgres` | `:5432` | Base de données principale |
| Redis | `encg_redis` | `:6379` | Cache, sessions, queues |
| MinIO API | `encg_minio` | `:9000` | S3-compatible object storage |
| MinIO Console | `encg_minio` | `:9001` | Interface web MinIO |
| Mailpit SMTP | `encg_mailpit` | `:1025` | Serveur mail de développement |
| Mailpit UI | `encg_mailpit` | `:8025` | Interface web des emails |
| pgAdmin | `encg_pgadmin` | `:5050` | Interface web PostgreSQL |

---

## 🚀 Installation & Démarrage (Première fois)

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et en cours d'exécution
- Git

### 1. Cloner le projet

```bash
git clone <repo-url> ENCG-ERP-V1
cd ENCG-ERP-V1
```

### 2. Vérifier la configuration

Le fichier `backend/.env` est déjà présent avec les valeurs de développement.  
Si tu as besoin de le recréer :

```bash
cp .env.example backend/.env
```

### 3. Construire et démarrer les conteneurs

```bash
docker compose up --build -d
```

> La première fois, le build peut prendre 5-10 minutes (téléchargement des images + compilation PHP).

### 4. Générer la clé Laravel

```bash
docker exec encg_backend php artisan key:generate
```

### 5. Exécuter les migrations

```bash
docker exec encg_backend php artisan migrate --seed
```

### 6. Créer le lien de stockage

```bash
docker exec encg_backend php artisan storage:link
```

### 7. Vérifier que tout fonctionne

| URL | Description |
|---|---|
| http://localhost | Application principale (React + API) |
| http://localhost:5173 | Vite dev server direct |
| http://localhost:8025 | Mailpit — Boîte de réception dev |
| http://localhost:9001 | MinIO Console (user: `minioadmin` / pass: `minioadmin123`) |
| http://localhost:5050 | pgAdmin (email: `admin@encg.ma` / pass: `admin`) |
| http://localhost/horizon | Laravel Horizon dashboard |

---

## 📋 Commandes Docker Utiles

### Gestion des conteneurs

```bash
# Démarrer tous les services
docker compose up -d

# Arrêter tous les services
docker compose down

# Voir les logs en temps réel
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f queue-worker
```

### Laravel (via Docker)

```bash
# Artisan
docker exec encg_backend php artisan <command>

# Migrations
docker exec encg_backend php artisan migrate
docker exec encg_backend php artisan migrate:fresh --seed

# Cache
docker exec encg_backend php artisan config:clear
docker exec encg_backend php artisan cache:clear
docker exec encg_backend php artisan route:clear

# Tinker (REPL)
docker exec -it encg_backend php artisan tinker

# Vérifier la syntaxe d'un fichier PHP
docker exec encg_backend php -l app/Http/Controllers/ExampleController.php
```

### Rebuild après modifications

```bash
# Rebuild un seul service
docker compose up -d --build backend

# Rebuild tout
docker compose up --build -d
```

---

## 🛠️ Développement

### Structure du projet

```
ENCG-ERP-V1/
├── backend/          # Laravel 12 API
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── .env          # Environnement Docker local
├── frontend/         # React 19 + Vite
│   └── src/
├── docker/           # Configurations Docker
│   ├── nginx/        # Config Nginx
│   ├── php/          # Dockerfile PHP + php.ini
│   └── postgres/     # Script d'initialisation PostgreSQL
├── docker-compose.yml
└── .env.example      # Référence des variables d'environnement
```

### Hot Reload

- **Frontend** : Hot Module Replacement (HMR) activé par défaut via Vite. Les changements dans `frontend/src/` se reflètent instantanément.
- **Backend** : Les fichiers sont montés en volume. Les changements PHP sont immédiatement disponibles (pas besoin de rebuild).

### Accès à la base de données

**Via pgAdmin** (recommandé) :
1. Ouvre http://localhost:5050
2. Ajoute un nouveau serveur :
   - Host: `postgres`
   - Port: `5432`
   - Database: `encg_erp`
   - Username: `encg`
   - Password: `secret`

**Via CLI** :
```bash
docker exec -it encg_postgres psql -U encg -d encg_erp
```

---

## 🔧 Variables d'Environnement Clés

| Variable | Valeur par défaut (dev) | Description |
|---|---|---|
| `DB_HOST` | `postgres` | Nom du conteneur PostgreSQL |
| `REDIS_HOST` | `redis` | Nom du conteneur Redis |
| `REDIS_PASSWORD` | `secret` | Mot de passe Redis |
| `AWS_ENDPOINT` | `http://minio:9000` | Endpoint MinIO interne |
| `MAIL_HOST` | `mailpit` | Serveur SMTP local |
| `REVERB_HOST` | `0.0.0.0` | Écoute sur toutes les interfaces |

> **Important** : Les hostnames correspondent aux noms des services dans `docker-compose.yml`, pas à `localhost`.

---

## 📦 GitHub — Initialisation du dépôt

```bash
# Initialiser git (si pas encore fait)
git init

# Ajouter l'origine
git remote add origin https://github.com/<ton-username>/ENCG-ERP-V1.git

# Premier commit
git add .
git commit -m "chore: initial setup with Docker (PostgreSQL + MinIO + Redis)"
git push -u origin main
```

> **Note** : Le fichier `backend/.env` est ignoré par `.gitignore`. Ne jamais commit les credentials réels.

---

## 📄 Licence

Propriétaire — ENCG Fès. Tous droits réservés.
