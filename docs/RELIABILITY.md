# Exploitation et vérification de fiabilité

## Sauvegardes

Deux protections complémentaires sont programmées dans Laravel : PostgreSQL custom
à 02:00 (empreinte SHA-256 et contrôle pg_restore), puis base **et documents** à
03:00 via Spatie. Cette seconde archive contient storage/app, pas les clés .env
ni le code source. Les répertoires de sauvegarde sont exclus pour éviter la récursion.
Le contrôle de l'archive ZIP est activé; la lecture approfondie de tous ses contenus est programmée à 03:45. Les horaires utilisent le fuseau Laravel.

Le scheduler doit réellement fonctionner : en production le service `scheduler`
de docker-compose.prod.yml le fait. Ne pas lancer plusieurs ordonnanceurs sur
la même installation. En développement, le profil `operations` fournit un scheduler limité aux backups
et au heartbeat, et un relais d'alertes indépendant. Il n'active aucun rappel
étudiant/professeur ni mutation académique. Les deux services sont activés localement.
Ne pas ajouter en parallèle un second scheduler Laravel complet.

```powershell
docker exec encg_backend php artisan db:backup-daily
docker exec encg_backend php artisan backup:run --disable-notifications --only-to-disk=local
docker exec encg_backend php artisan backup:verify-files
docker compose run --rm --no-deps --env-from-file .env.database-maintenance backend php artisan db:verify-restore NOM_ARCHIVE.dump encg_manual_20261104_restore_test
```

La restauration refuse tout nom de base métier et toute base déjà existante.
La base de contrôle restaurée reste disponible pour inspection; elle contient des
données sensibles et ne doit jamais servir de staging ni être accessible au public.
Le contrôle PostgreSQL actuel prouve la restauration SQL et la lecture de grades;
il ne constitue pas un test de tous les parcours de l'application restaurée.

`BACKUP_DISKS=local` reste le défaut. Une copie sur le même serveur ne protège pas
contre sa perte. Ajouter un stockage distant après choix du prestataire, installer
son adaptateur Laravel si nécessaire, configurer le disque, puis utiliser
`BACKUP_DISKS=local,s3` (ou le nom du disque choisi). Les erreurs d'une destination
ne sont pas ignorées. La surveillance Spatie utilise la même liste de disques.
Conserver APP_KEY et BACKUP_ARCHIVE_PASSWORD séparément, dans un gestionnaire de
secrets. Ne jamais publier ou committer une archive. `backup:verify-files` relit chaque entrée de la dernière archive locale, contrôle
sa taille et son CRC (authentification AES pour les archives AE-2), sans publier
les noms ni extraire dans le répertoire public. Le déchiffrement est testé avec
une archive synthétique. Il reste nécessaire de tester téléchargement et restauration
depuis le stockage distant choisi.

Pour des fichiers et SQL strictement cohérents, planifier une fenêtre sans écriture
ou utiliser des snapshots coordonnés; la sauvegarde courante n'est pas atomique
entre PostgreSQL et le stockage de fichiers.

## Staging indépendant

```powershell
python scripts/setup_staging.py
python scripts/configure_local_database_roles.py staging
docker compose --env-file .env.staging -f docker-compose.staging.yml build backend
# Construire frontend/dist avant d'ouvrir l'interface.
docker exec -e VITE_API_URL=/api encg_frontend npm run build
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d backend reverb nginx
docker compose --env-file .env.staging -f docker-compose.staging.yml run --rm --no-deps --env-from-file .env.staging.database-maintenance backend php artisan migrate --force
docker compose --env-file .env.staging -f docker-compose.staging.yml exec backend php artisan db:seed --class=StagingSmokeSeeder --force
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d worker scheduler
python scripts/check_staging.py
```

Pour tester la chaîne documentaire, relancer le seeder puis utiliser l'identifiant synthétique affiché dans `python scripts/check_staging.py --student-id ID`. Le contrôle appelle les API réelles avec les trois rôles et vérifie le fichier PDF téléchargé. Utiliser l'identifiant `document_request_id` renvoyé pour tester la restauration.

```powershell
docker compose --env-file .env.staging -f docker-compose.staging.yml run --rm --no-deps --env-from-file .env.staging.database-maintenance -e STAGING_RESTORE_DOCUMENT_ID=ID_DEMANDE backend php tests/Audit/StagingDocumentRestoreDrill.php
```

Le test restaure les données dans une nouvelle base de staging, retrouve le document dans le registre restauré et compare le PDF extrait de l'archive de fichiers à l'original. La base de contrôle reste disponible pour inspection.

Pour les migrations locales, lancer `docker compose run --rm --no-deps --env-from-file .env.database-maintenance backend php artisan migrate --force`. Les fichiers de maintenance restent à la racine du dépôt et hors des images et des montages PHP. Le compte Laravel garde les droits de lecture et d'écriture nécessaires, et les tâches de sauvegarde peuvent lire le schéma. La création de bases pour les tests de restauration exige les identifiants de maintenance.

Interface : http://127.0.0.1:8088. Projet `encg-staging`, volumes et réseau propres,
aucun port DB/Redis publié, aucun réseau de production partagé. Secrets générés
indépendamment, jamais copiés du .env réel. Les clés IA sont vides, AI_DRIVER=stub,
MAIL_MAILER=log. Le réseau applicatif est interne : pas d'envoi externe.
La passerelle Nginx seule possède un bridge pour son port loopback.
Le Dockerfile de production construit la même application sans dépendances dev.
Les tests de providers IA réels restent des tests séparés sur documents synthétiques.
Ne pas importer de sauvegarde réelle; créer uniquement des fixtures synthétiques.
StagingSmokeSeeder fournit student@staging.example.test, professor@staging.example.test
et institution-admin@staging.example.test. Leur mot de passe commun de smoke test
est généré dans .env.staging (STAGING_SMOKE_PASSWORD), sans aucune valeur publiée.
Le seeder refuse tout autre environnement/base. Ce sont des comptes de test
authentification et rôles, pas des dossiers académiques complets. Cookies auth
et session ont des noms propres au staging pour isoler aussi les sessions locales.
Ne pas utiliser `down -v` pour un autre projet.

## Tests des rôles et parcours

La CI existante couvre migrations PostgreSQL, Pest, sécurité des routes, Vitest,
TypeScript, build et Playwright. `live.spec.ts` se connecte à une API réellement
initialisée avec E2eSmokeSeeder dans encg_e2e_test. Les autres specs peuvent utiliser
des réponses simulées; leur réussite seule ne prouve pas l'intégration backend.
Le restore drill PostgreSQL s'exécute désormais sur chaque CI, pas seulement à la main.
Les outils staging et charge ont leurs tests Python dans scripts/tests.

Tests ciblés locaux, exclusivement sur base `_test` :

```powershell
docker exec -e ENCG_TEST_DATABASE=pgsql -e DB_DATABASE=encg_roles_remediation_test encg_backend php vendor/bin/pest -c phpunit.postgres.xml tests/Feature/OperationsReliabilityTest.php tests/Feature/ObservabilityTest.php tests/Feature/OperationalWorkspaceTest.php tests/Feature/AuditLogAndSecurityRegressionTest.php --compact
python -m unittest discover -s scripts/tests
```

## Alertes et procédures

Prometheus surveille désormais aussi la fraîcheur de la sauvegarde SQL (26 h),
sa vérification de restauration, le heartbeat scheduler et les jobs échoués.
Le heartbeat est stocké chaque minute; une absence persistante déclenche une alerte.
Une alerte restore concerne la **dernière** archive : une nouvelle sauvegarde doit
à son tour être vérifiée. Les métriques n'exposent ni chemins privés ni données étudiants.
Ces métriques ne prouvent pas la copie distante ou la restauration des documents.

Les alertes restent consultables dans Prometheus (11 règles) et Grafana (19 panneaux).
Le destinataire explicitement choisi est radouane.asri99@gmail.com. Le relais
`operations-alerts` interroge Prometheus toutes les cinq minutes : nouveaux incidents
firing et résolutions, aucun renvoi pour un état inchangé. Le transport et
l'expéditeur Resend existants sont conservés. En cas d'échec mail, l'état reste
non acquitté et pourra être réessayé. Une réponse Prometheus invalide n'annonce
pas de fausse résolution. La déduplication utilise le cache fichier, indépendant
de Redis, et un verrou contre les envois concurrents. Un cache effacé peut
entraîner un nouvel envoi d'incidents actifs. Aucun email aux étudiants/professeurs.

En production, le relais est aussi un service séparé. Après choix du réseau
d'hébergement, adapter OPERATIONS_PROMETHEUS_URL et connecter Prometheus au réseau
applicatif comme décrit dans OBSERVABILITY.md. Si la machine entière est arrêtée,
un service externe d'uptime est nécessaire pour alerter : le relais local ne peut
pas fonctionner sans son hôte. Procédures :

| Alerte | Vérification et action |
|---|---|
| BackupOverdue | Vérifier espace disque, scheduler et logs; relancer la sauvegarde, contrôler l'archive |
| RestoreUnverified | Restaurer la dernière archive dans une nouvelle base `_restore_test` |
| SchedulerStopped | Vérifier le service scheduler et le cache partagé; éviter deux ordonnanceurs |
| JobsFailed / OcrStalled | Inspecter Horizon et le statut métier avant toute relance; aucun retry massif aveugle |
| DependencyDown / NotReady | Contrôler PostgreSQL, Redis, Horizon et les logs sans publier leurs secrets |

## Historique et tâches longues

L'audit existant conserve acteur, date, statut HTTP et les événements sensibles.
Les clés API, Authorization et cookies sont maintenant masqués, même imbriqués.
Les tests existants vérifient aussi l'intégrité des entrées d'audit et les accès.
La capture générale d'une requête ne remplace pas les historiques métier avant/après.

OCR utilise déjà des statuts consultables, une relance contrôlée et une prise de
travail atomique en base. Un ancien job failed/retried/processing ne peut plus
reprendre ni même charger le document; seul queued peut démarrer. Les emails de
documents ont une déduplication testée. Les exports synchrones restent synchrones :
il n'y a pas de progression artificielle ajoutée à l'interface.

## Charge : smoke test, puis capacité réelle

```powershell
python scripts/load_smoke.py --requests 30 --workers 3
# Pour staging : ajouter --url http://127.0.0.1:8088/api/health/ready
```

Le script autorise seulement localhost et les endpoints read-only /up ou readiness,
refuse les redirections, limite à 200 requêtes et 8 workers. Il vérifie ready=true,
compte les erreurs et échoue si p95 dépasse 3 secondes (seuil ajustable).
Cela teste la disponibilité sous faible concurrence, **pas** la capacité d'accueil
des inscriptions, les PDF ou la publication des notes. Ces scénarios nécessitent
des fixtures volumétriques, une infra de staging représentative et un budget de
charge validé avant le lancement. Aucun appel IA payant ni envoi email n'y participe.

## Résultats locaux du 4 novembre 2026

- Sauvegarde complète créée et ouverte : 682 entrées, environ 187 MB compressés.
- Lecture vérifiée de 651 fichiers, 222 499 320 octets décompressés, sans exposition de leurs noms.
- Dump PostgreSQL restauré dans une base nouvelle `_restore_test`; lecture de 1 721 notes.
- Premier lot : 16 tests réussis, 90 assertions. Lot opérations : 14 tests réussis, 76 assertions.
- Régression du récépissé détectée et corrigée : footer artisanal redondant supprimé,
  footer du registre conservé; document synthétique une page, photo et QR vérifiés.
- Relais email : cinq tests réussis (20 assertions); test réel accepté par le transport, réception Gmail à confirmer.
- Chaîne Laravel–Prometheus–Grafana vérifiée : trois cibles up et 19 panneaux interrogeables.
- Build frontend réussi; quatre tests Python réussis; onze règles Prometheus valides.
- Le premier smoke de charge sur le montage Windows a échoué (timeouts). Ce résultat
  est conservé; il ne permet pas de déclarer la capacité production validée.

Après réglage OPcache pour le montage Windows et rechargement gracieux de PHP-FPM,
une nouvelle mesure de neuf requêtes / trois workers a terminé sans erreur HTTP
ni timeout, avec p95 = 4,472 s. Le seuil de 3 s reste donc non atteint sur ce
montage de développement; aucun seuil n’a été assoupli pour masquer cet échec.

Staging final démarré sur http://127.0.0.1:8088 avec image sans dépendances dev,
base migrée et trois comptes synthétiques. Le smoke readiness de 30 requêtes /
3 workers a réussi : zéro erreur, p95 = 0,950 s. Ce résultat sous faible charge
ne préjuge pas de la capacité en période de rentrée. Les trois rôles ont passé
login, cookie HttpOnly isolé, lecture de session et révocation au logout via
la vraie API, avec refus des paramètres administratifs pour étudiant/professeur.
Les tests complémentaires de sécurité/cookies ont réussi : 18 tests, 56 assertions.

Le contrôle positif d’accès aux paramètres administratifs a également réussi
pour institution-admin. Les fixtures sont rattachées à ERP_INSTITUTION_ID, sans
désactiver le middleware de cloisonnement. Après recréation du backend staging,
recharger Nginx pour actualiser sa résolution DNS (`exec nginx nginx -s reload`).

Dernière mesure sur image finale et cache chaud : 30 requêtes, 3 workers,
zéro erreur, p95 = 0,193 s (1,122 s au total). Cette mesure est un smoke
de disponibilité, pas une simulation de rentrée ni un benchmark PDF/OCR.
