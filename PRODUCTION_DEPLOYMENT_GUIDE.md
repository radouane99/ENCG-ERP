# Guide de déploiement production — ENCG ERP

Stack : Nginx + PHP 8.4-FPM + PostgreSQL 16 + Redis 7 + Horizon, sur un VPS Ubuntu 22.04/24.04.

Le déploiement **n’est pas automatique** au `git push`. CI (`.github/workflows/ci.yml`) valide la branche. La mise en ligne se fait **à la main** : `./deploy.sh` sur le VPS, ou **Actions → Deploy → Run workflow**.

---

## Prérequis VPS

- 2 vCPU / 4 Go RAM / 40 Go SSD (minimum)
- Ports `22`, `80`, `443`
- Docker Engine + Compose plugin
- DNS `A` : `erp.encg-fes.ac.ma` → IP du VPS (avant le certificat TLS)

```bash
sudo apt update && sudo apt install -y curl git ufw fail2ban
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

---

## Premier déploiement

```bash
sudo mkdir -p /var/www/encg-erp
sudo chown "$USER:$USER" /var/www/encg-erp
cd /var/www/encg-erp
git clone --branch docker-v2 https://github.com/radouane99/ENCG-ERP.git .
cp .env.production.example backend/.env.production
nano backend/.env.production
```

Remplir **sans placeholders** :

| Variable | Règle |
|---|---|
| `APP_KEY` | Laissé vide : `deploy.sh` le génère si `php` est installé sur l’hôte |
| `APP_DEBUG` | `false` |
| `DB_PASSWORD` / `REDIS_PASSWORD` | Secrets longs, **identiques** pour Compose et Laravel (`--env-file backend/.env.production`) |
| `APP_URL` / `FRONTEND_URL` | `https://erp.encg-fes.ac.ma` |
| `RESEND_API_KEY` | Domaine `encg-fes.ac.ma` vérifié chez Resend |
| `MAIL_FROM_ADDRESS` | `noreply@encg-fes.ac.ma` |

```bash
chmod +x deploy.sh scripts/*.sh
./deploy.sh docker-v2
```

Sans certificat, Nginx démarre en **HTTP** (`prod-bootstrap.conf`) pour Let’s Encrypt.

```bash
# DNS doit déjà pointer vers le VPS
./scripts/provision-ssl.sh
```

Cela émet le certificat, crée le lien `certbot/conf/live/encg-erp`, et bascule Nginx vers HTTPS (`prod.conf`).

---

## Mises à jour

Sur le VPS :

```bash
cd /var/www/encg-erp
./deploy.sh docker-v2
```

Depuis GitHub : environment **production** + secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`. Le job SSH fait `git pull --ff-only` puis `./deploy.sh --no-git`.

`deploy.sh` refuse de démarrer si `APP_DEBUG=true` ou si les mots de passe sont encore des placeholders (`scripts/deploy-preflight.sh`).

---

## Sauvegardes

```cron
0 2 * * * cd /var/www/encg-erp && DB_USERNAME=encg_prod_user DB_DATABASE=encg_erp ./scripts/backup-postgres.sh
```

Drill mensuel : `./scripts/restore-postgres-drill.sh backups/encg_erp_YYYYMMDD_HHMMSS.sql.gz`

---

## Contrôles après go-live

- `https://erp.encg-fes.ac.ma/up` → 200
- Login admin / prof / étudiant
- Un PDF guichet + une convocation
- Horizon : jobs mail / SMS `SMS_DRIVER=log` dans `notification_logs`

Checklist détaillée : [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
