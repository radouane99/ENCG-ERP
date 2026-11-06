# Architecture Kubernetes (K8s / K3s) — ENCG Fès ERP

Ce dossier contient les manifestes Kubernetes déclaratifs (compatibles **Kubernetes standard** et **K3s**) conçus pour supporter la montée en charge lors des pics académiques critiques de l'ENCG Fès (publication des résultats de délibérations S1–S10, téléchargement massif des convocations d'examens, campagnes de réinscription).

> **Note** : Le développement local continue d'utiliser `docker-compose.yml` normalement (`docker compose up -d`). Ces manifestes sont prêts pour un déploiement Cloud / On-Premise USMBA ultérieur.

## Topologie des Composants

| Composant | Type K8s | Rôle & Scalabilité |
| :--- | :--- | :--- |
| `encg-backend` | `Deployment` + `HPA` (2 ➔ 10 pods) | API Laravel 12 (PHP 8.4-FPM) avec sonde de santé `/up` et **Auto-scaling automatique** dès que le CPU dépasse 70%. |
| `encg-horizon` | `Deployment` + `HPA` (2 ➔ 8 pods) | Workers de files d'attente Redis pour la génération asynchrone des PDF officiels, PV de délibérations et emails Resend (`noreply@encg-fes.ac.ma`). |
| `encg-reverb` | `Deployment` + `Service` | Serveur WebSocket temps réel (`/app/{key}`) pour les notifications et l'émargement dynamique. |
| `encg-scheduler` | `CronJob` (`* * * * *`) | Exécution périodique de `php artisan schedule:run` (`concurrencyPolicy: Forbid`). |
| `encg-frontend` | `Deployment` (2 pods) | Application React 19 / TypeScript PWA servie avec cache immutable. |
| `encg-postgres` | `StatefulSet` (PVC `20Gi`) | Base de données PostgreSQL 16 avec volume persistant. |
| `encg-redis` | `StatefulSet` (PVC `5Gi`) | Cache, sessions et files Horizon avec politique `noeviction`. |
| `encg-erp-ingress` | `Ingress` (Nginx + TLS) | Routage unifié (`erp.encg-fes.ac.ma`), limite d'upload à `100m`, et blocage strict (`404`) de `/horizon`, `/telescope`, et `/docs`. |

## Commandes de Déploiement (Pour usage futur)

```bash
# 1. Créer le secret à partir du modèle
cp k8s/secrets.example.yaml k8s/secrets.yaml
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml

# 2. Déployer toute l'architecture via Kustomize
kubectl apply -k k8s/

# 3. Vérifier l'état des Pods et du HorizontalPodAutoscaler (HPA)
kubectl get pods,hpa,svc,ingress -n encg-erp
```

