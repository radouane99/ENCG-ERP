# Supervision ENCG ERP

## Accès local

- Grafana : <http://127.0.0.1:3001/d/encg-operations>.
- Connexion Grafana : utilisateur `admin`, mot de passe dans `.monitoring-secrets/grafana-password`. Il n’est pas affiché dans les commandes ni enregistré dans Git.
- Prometheus : <http://127.0.0.1:9090> ; alertes : <http://127.0.0.1:9090/alerts>.

Les ports sont liés à `127.0.0.1`. Aucun hostname Cloudflare ni accès public n’est ajouté. Sur un serveur distant, utiliser un tunnel SSH/VPN ou un accès authentifié avec TLS. Le réseau Grafana est distinct du réseau applicatif ; aucun socket Docker ni montage racine de l’hôte n’est fourni aux outils.

## Installation et démarrage

Trouver le réseau de la stack ERP existante :

```sh
docker inspect --format '{{range $name, $value := .NetworkSettings.Networks}}{{$name}}{{end}}' encg_nginx
```

Puis, à la racine du projet :

```sh
python scripts/setup_monitoring.py --network encg-erp-v1_encgnet
docker compose --env-file .env.monitoring -f docker-compose.monitoring.yml config --quiet
docker compose --env-file .env.monitoring -f docker-compose.monitoring.yml up -d
```

Le script génère un token de scrape et un mot de passe Grafana, active les métriques dans l’environnement backend et préserve les autres secrets. Il est idempotent : les identifiants existants sont conservés. Si Laravel utilise un cache de configuration, recharger sa configuration lors du déploiement. Si les variables sont injectées dans les conteneurs au démarrage, leur environnement doit aussi être rechargé. Pour la production, utiliser `--backend-env backend/.env.production` et le vrai nom du réseau Docker de production.

Les commandes concernent un projet Compose séparé (`encg-observability`) ; elles ne recréent pas les services ERP. Pour arrêter uniquement la supervision, exécuter le même Compose avec `stop`. Conserver les volumes pour préserver les historiques. Le mot de passe Grafana persisté en base n’est pas remplacé en régénérant simplement son fichier : gérer une rotation avec Grafana.

## Données collectées

Le dashboard provisionné contient 16 panneaux : disponibilité, PostgreSQL, Redis, Horizon, débit HTTP, erreurs serveur, latence p95, durée de la sonde de disponibilité, profondeur de queue, jobs en échec sur 24 h, états OCR sur 24 h, âge de la plus ancienne extraction en attente et santé des collecteurs.

- Endpoint : `GET /api/internal/metrics`, désactivé par défaut, protégé par un bearer token dédié d’au moins 32 caractères. Un token d’utilisateur ou de session ne donne pas accès à cet endpoint. Le token n’est jamais placé dans une URL.
- Les labels HTTP sont limités à la méthode et à la classe de statut. Aucune URL, identité, CNE, CNIE, adresse email, pièce ou contenu OCR n’est exporté.
- Le temps HTTP mesure le traitement Laravel, pas le transfert complet d’un PDF ni le rendu React. Les fichiers statiques servis directement par Nginx ne sont pas comptés.
- Les compteurs HTTP sont partagés dans Redis ; ils peuvent repartir à zéro après effacement du cache ou expiration à 30 jours. Prometheus traite les remises à zéro des compteurs.
- Les jauges OCR/jobs sont des agrégats en lecture seule ; aucune ligne n’est corrigée ou supprimée par la supervision. Un collecteur en panne est signalé explicitement.
- La sonde `/api/health/ready` teste les dépendances applicatives. Elle ne prétend pas vérifier le fonctionnement de toutes les interfaces utilisateur.

## Alertes et rétention

Sept règles Prometheus surveillent les scrapes, la disponibilité, les dépendances, les erreurs HTTP, la queue, les OCR bloqués et les collecteurs. Les alertes sont visibles dans les outils ; aucun email ou message externe n’est configuré. Les seuils initiaux doivent être adaptés après observation du trafic réel. Sur un environnement peu utilisé, les courbes de débit/latence peuvent ne pas avoir assez de points au démarrage.

Prometheus conserve au maximum 15 jours ou environ 2 Go de blocs TSDB ; prévoir de l’espace supplémentaire pour le WAL et les volumes. Grafana et Prometheus ont des volumes persistants et des limites de ressources. Sauvegarder leurs volumes séparément de PostgreSQL pour conserver dashboards et historique.

## Validation

```sh
docker compose --env-file .env.monitoring -f docker-compose.monitoring.yml exec -T prometheus promtool check config /etc/prometheus/prometheus.yml
```

Les contrôles CI valident la configuration, les règles, le script de préparation et le module Terraform sans secret réel ni déploiement cloud. Les tests backend `ObservabilityTest` vérifient l’accès, les labels bornés, l’absence de données personnelles et la continuité des requêtes en cas de panne du stockage des métriques.

Contrôle du circuit local complet (ports par défaut), sans affichage d’identifiants :

```sh
python scripts/check_monitoring.py
```

Vérification réalisée le 29 octobre 2026 : quatre tests backend (25 assertions), deux tests du script de préparation, quatre tests Terraform, configuration Prometheus et sept règles valides. Les trois targets sont `up`, les jauges PostgreSQL/Redis/Horizon et les collecteurs sont disponibles, et Grafana interroge effectivement Prometheus sur les 16 expressions du dashboard. L’exécution du workflow GitHub n’est pas revendiquée : il sera lancé après publication des changements sur une branche concernée.

Terraform est préparé dans [infra/terraform](../infra/terraform/README.md). Le choix de l’hébergeur est nécessaire avant d’ajouter des ressources VM/réseau/DNS. Aucun serveur cloud n’a été créé.

Références : [Prometheus](https://prometheus.io/docs/introduction/overview/), [provisioning Grafana](https://grafana.com/docs/grafana/latest/administration/provisioning/), [Terraform](https://developer.hashicorp.com/terraform/intro).
