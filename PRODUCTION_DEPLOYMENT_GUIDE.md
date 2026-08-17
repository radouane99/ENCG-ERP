# 🚀 Guide de Déploiement en Production — ENCG ERP

Ce guide détaille pas-à-pas la procédure complète pour déployer l'application **ENCG ERP** sur n'importe quel serveur VPS / Cloud (Ubuntu 22.04 / 24.04 LTS).

---

## 📋 Prérequis Serveur

- **Système d'exploitation** : Ubuntu 22.04 LTS ou Ubuntu 24.04 LTS.
- **Ressources minimales recommandées** :
  - **CPU** : 2 vCPUs
  - **RAM** : 4 Go (avec 2 Go Swap)
  - **Disque** : 40 Go SSD
- **Ports ouverts (Firewall / UFW)** : `80` (HTTP), `443` (HTTPS), `22` (SSH).

---

## 🛠️ Étape 1 : Préparation du Serveur & Installation de Docker

Connectez-vous à votre serveur en SSH et lancez l'installation de Docker & Docker Compose :

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des paquets essentiels
sudo apt install -y curl git ufw fail2ban

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Configuration des permissions utilisateur
sudo usermod -aG docker $USER
newgrp docker

# Vérification
docker --version
docker compose version
```

---

## 📥 Étape 2 : Clonage du Répertoire (Branche `docker-v2`)

```bash
cd /var/www
git clone https://github.com/radouane99/ENCG-ERP.git encg-erp
cd encg-erp

# Basculer sur la branche de production docker-v2
git checkout docker-v2
```

---

## 🔐 Étape 3 : Configuration des Variables d'Environnement

Créez le fichier de configuration de production :

```bash
cp .env.production.example backend/.env.production
nano backend/.env.production
```

> [!IMPORTANT]
> **Remplissez impérativement :**
> - `APP_URL` et `FRONTEND_URL` : Votre nom de domaine (ex: `https://erp.encg-fes.ac.ma`).
> - `DB_PASSWORD` : Un mot de passe robuste pour PostgreSQL 16.
> - `REDIS_PASSWORD` : Un mot de passe robuste pour Redis.
> - `RESEND_API_KEY` : Votre clé API Resend pour l'envoi des emails institutionnels.

---

## 🚀 Étape 4 : Déploiement en 1 Clic via `deploy.sh`

Rendez le script exécutable et lancez le déploiement :

```bash
chmod +x deploy.sh
./deploy.sh docker-v2
```

Le script s'occupe automatiquement de :
1. ✅ Télécharger les dernières modifications de `docker-v2`.
2. ✅ Compiler le bundle de production React / Vite PWA (`dist`).
3. ✅ Démarrer les conteneurs Docker (Nginx, PHP 8.4, Postgres 16, Redis 7, Horizon Queue, Scheduler).
4. ✅ Exécuter les migrations de base de données (`php artisan migrate --force`).
5. ✅ Mettre en cache la configuration, les routes et les vues (`config:cache`, `route:cache`, `view:cache`).
6. ✅ Redémarrer les workers de file d'attente (Horizon).

---

## 🔒 Étape 5 : Obtention du Certificat SSL / HTTPS Gratuit (Let's Encrypt)

Générez le certificat SSL pour votre domaine :

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d erp.encg-fes.ac.ma \
  --email contact@encg-fes.ac.ma \
  --agree-tos \
  --no-eff-email
```

Puis rechargez Nginx :
```bash
docker exec encg_prod_nginx nginx -s reload
```

---

## 🔄 Étape 6 : Mises à Jour Futures (CI/CD Automatisé)

Pour déployer n'importe quelle nouvelle version après un `git push` sur `docker-v2` :

```bash
cd /var/www/encg-erp
./deploy.sh docker-v2
```

---

## 🛡️ Sauvegardes Automatiques de la Base de Données

Ajoutez un cron job pour sauvegarder PostgreSQL tous les soirs à 2h00 du matin :

```bash
crontab -e
```

Ajoutez la ligne suivante :
```cron
0 2 * * * docker exec encg_prod_postgres pg_dump -U encg_prod_user encg_erp | gzip > /var/backups/encg_erp_$(date +\%F).sql.gz
```
