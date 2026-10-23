# Corrections du diagnostic global — 22 octobre 2026

Les failles de compte, les contrôles d'accès identifiés, la concurrence des notes et les advisories ont été corrigés dans le checkout local. Les migrations additives ont été appliquées localement après sauvegarde et restauration de contrôle. Rien n'a été déployé sur un serveur distant.

Le traitement des défauts concrets ne signifie pas que toute la dette historique de l'ERP a disparu : les gros écrans, les 253 warnings restants et la validation sous charge demeurent des travaux distincts, détaillés ci-dessous.

## Résultats vérifiés

| Vérification | Résultat |
|---|---|
| Backend SQLite | 314 tests réussis, 1 024 assertions |
| Backend PostgreSQL isolé | 314 tests réussis, 1 024 assertions ; fichier `backend-postgres-after.txt` |
| Frontend Vitest | 36 tests réussis dans 17 fichiers ; `frontend-tests-after.txt` |
| Playwright, build production | 22 parcours desktop/mobile réussis ; `playwright-after.txt` |
| API réelle | Connexion, cookie HttpOnly, `/me`, refus d'écriture administrative et révocation à la déconnexion, dans une base E2E séparée |
| TypeScript | Application et configuration Node/Vite/Playwright validées |
| npm audit, toutes dépendances | 0 vulnerability signalée ; `npm-audit-after.json` |
| Composer audit runtime verrouillé | 0 advisory, aucun package abandonné signalé ; `composer-audit-after.json` |
| Composer validate strict | Valide ; les contraintes `*` ont été remplacées |
| Base locale après migrations | 342 contrôles, 0 erreur critique détectée ; `database-scan-after.txt` |
| Sauvegarde/restauration | 138 tables restaurées ; comparaison des volumes principaux : 104 utilisateurs, 74 étudiants, 1 721 notes |
| Image de production | Construction réussie ; PHP-FPM et PostgreSQL readiness testés dans un conteneur isolé sans port publié |
| Nginx | Configuration bootstrap validée ; `/api/health/ready` répond `{"ready":true}` via FastCGI |
| YAML | Workflows CI/deploy et compose prod parsés avec Symfony Yaml ; compose validé séparément |
| Lint | 253 warnings, 0 erreur ; avant : 643. Un plafond bloque désormais toute hausse au-delà de 253 |

Les tests navigateur des parcours métier historiques emploient encore des mocks. Les deux tests live n'utilisent pas de mocks. La suite backend PostgreSQL couvre les processus métier, mais ceci ne représente pas un test navigateur réel de chaque module, ni une validation de production distante.

## Correspondance avec les constats initiaux

| Constat | Modification | État |
|---|---|---|
| A01 — inscription et prise de compte | L'inscription publique refuse une identité ou un dossier préexistant, y compris les comptes supprimés logiquement. Aucun remplacement de password. Réponses de validation 422 préservées. Les nouveaux comptes reçoivent seulement le rôle étudiant et une institution explicite ; aucune campagne n'est créée automatiquement | Corrigé, tests négatifs et positifs |
| A02 — chat | Suppression de la route dupliquée ; contrôle d'appartenance filière/groupe/affectation enseignant ; filtrage de conversation. Protection également appliquée aux lectures et écritures LMS concernées | Corrigé |
| A03 — dates officielles | Rôles administratifs requis, vraies dates JJ/MM/AAAA, ordre chronologique contrôlé. Stockage SQL dans les settings de l'institution, indexé par année active, sous verrou transactionnel | Corrigé |
| A04 — optimistic locking | UPDATE atomique avec condition sur la version d'origine, contrôle de la ligne touchée et erreur 409. Initialisation des nouvelles entités à version 1. Le batch de notes exige une version cohérente et les trois écrans de saisie la transmettent | Corrigé, tests de copies périmées et client périmé |
| A05 — dépendances | Mises à jour des lockfiles ; Vitest passé à une version corrigée et compatible après tests | Corrigé pour les advisories signalées à la date du contrôle |
| A06 — gates | Audit Composer bloquant ; audit npm bloquant pour high/critical ; tests PostgreSQL réels ; contrôles TypeScript/tests/budget dans le gate frontend et le déploiement. Le workflow déploie le SHA testé | Corrigé pour les gates de sécurité et tests |
| A07 — candidature | FormRequest, liste de champs autorisés, scores bornés, champs de revue/campagne/référence interdits et vérification de l'institution de la campagne | Corrigé |
| A08 — caméra/micro | Permissions-Policy autorise la même origine pour les fonctionnalités demandées ; géolocalisation reste désactivée | Corrigé dans les configurations Nginx |
| A09 — DDL HTTP | Création/altération du schéma retirée des contrôleurs et remplacée par une migration additive idempotente | Corrigé |
| A10 — valeurs inventées ciblées | Fin de la date de naissance fictive et du genre masculin imposé. Campagne explicitement rattachée à l'institution. Les PDF d'emploi du temps ne fabriquent plus de CNE/CIN, section, grade ou identité. La dictée restitue la transcription réelle sans faux chapitre ni affirmation de conformité | Corrigé sur les chemins identifiés |
| A11 — institution | L'instance est explicitement mono-établissement via ERP_INSTITUTION_ID. Refus des comptes sans institution ou d'un autre établissement sur les groupes de routes concernés ; pas de rattachement implicite à 1 dans le middleware | Sécurisé en mode mono-établissement ; pas de revendication multi-tenant |
| A12 — taille des fichiers | Extraction des normalisations, types et composants de saisie/clavier de l'inscription ; imports inutilisés supprimés avec le compilateur TypeScript, sans supprimer les expressions ni les hooks | Amélioration partielle ; refactor global restant |
| A13 — index | Migration ciblée sur les FK opérationnelles, sans dupliquer un index existant ayant déjà la colonne en tête. Trois index supplémentaires réellement nécessaires créés sur la base locale | Amélioration ciblée ; autres index à justifier par les requêtes |
| A14 — faux zéros | Une panne analytique affiche une erreur et permet de réessayer, au lieu d'inventer des statistiques nulles | Corrigé, test frontend |
| A15 — chargement et dette frontend | Suppression du bundle global forçant toutes les dépendances ensemble, Sentry chargé à la demande, asset absent remplacé, double hydration de session retirée, délai borné et contrôle du format de réponse auth, nettoyage des imports, budget de taille | Amélioration mesurée ; dette résiduelle précisée ci-dessous |
| A16 — CSP | Politique transférée des meta aux headers Nginx ; script-src self, origines réseau restreintes, frame-ancestors cohérent avec X-Frame-Options | Corrigé dans les configurations production |
| A17 — tests | Configuration PostgreSQL explicite, protection des noms de bases de test, suite exécutée sur PostgreSQL ; tests live d'auth/cookie/capacités ; frontend testé sur le build production et mobile | Corrigé pour l'écart SQLite/PG et début de couverture live |
| A18 — exploitation | Image avec code et vendor, retrait des bind mounts de code et cache bootstrap partagé ; erreurs Composer bloquantes ; startup sans installation réseau ; readiness PHP-FPM/base ; Reverb et proxy WebSocket ; Redis AOF/noeviction ; restauration réellement testée et drill CI ; proxies configurables ; audit récursivement expurgé et URL sans query ; secrets préservés par le sanitizer | Corrections dépôt effectuées ; configuration distante et exploitation à valider avant déploiement |

## Autres défauts révélés par les tests

- Les migrations historiques inséraient des identifiants explicites sans avancer les séquences PostgreSQL. Une migration remet les séquences des tables non vides au moins au maximum déjà utilisé, sans les faire reculer. Ce défaut était invisible avec SQLite.
- Une recherche de registration par `module_id` était incorrecte sur le schéma canonique PostgreSQL. L'accès classroom utilise la filière de l'inscription et une année active ; la protection par parcours courant et groupe est conservée.
- Le routage Nginx passe maintenant par un emplacement FastCGI nommé qui exécute uniquement `public/index.php`. Cela évite qu'un fallback vers `/index.php` quitte l'emplacement API et retombe sur la SPA.
- `artisan serve` élimine normalement certaines variables transmises au processus enfant en mode reload. Le serveur E2E utilise `--no-reload` et une connexion PostgreSQL explicite ; les tests live ne se connectent pas à une base SQLite vide.
- Les mots de passe contenant des chevrons restent inchangés. Un HTML ou un payload inattendu reçu par `/me` ne crée plus une fausse session authentifiée et le chargement ne reste pas indéfini.
- Les métadonnées de groupes PHPUnit des cinq classes signalées ont été converties en attributs.

## Performance observée

Le JavaScript nécessaire au premier chargement représente **591 569 octets**, environ **182 721 octets gzip**, contre plus de 1,6 MB pour les bundles initialement préchargés ensemble. Voir `bundle-stats-after.json`. Un budget CI de 750 KB empêche le retour au bundle initial massif.

Le precache PWA est passé d'environ **7 MB / 336 fichiers** à **1,2 MB / 9 fichiers**. Le shell est précaché ; les bundles des fonctionnalités sont téléchargés à leur première visite et ensuite mis en cache. Une fonctionnalité jamais visitée ne devient donc pas disponible hors ligne par anticipation. Les réponses API privées ne font pas partie de cette règle de cache.

Ces mesures sont des tailles d'artefacts, pas des Core Web Vitals ni des temps garantis sur des téléphones ou réseaux réels. Le CSS global reste autour de 630 KB non compressés.

## Travaux qui ne sont pas prétendus terminés

1. **Refactor des grands modules.** Le PV de notes, d'autres pages admin et PdfExportController restent volumineux. Leur découpage complet nécessite des scénarios métier et visuels plus larges ; l'extraction de l'inscription est une première étape, pas une réécriture de tout l'ERP.
2. **253 warnings frontend.** Ils restent visibles : principalement 184 déclarations inutilisées, 64 remarques sur les dépendances des hooks et 5 autres diagnostics. Ils n'ont pas été masqués en désactivant des règles. Les corrections automatiques ont été limitées aux imports et aux correctifs sûrs ; supprimer des hooks ou ajouter aveuglément leurs dépendances pourrait changer le comportement et créer des boucles réseau.
3. **Indexation de charge.** Le scanner recense encore 165 colonnes FK sans index repéré. Ce n'est pas une instruction de créer 165 index : leur utilité doit être mesurée avec des requêtes et volumes représentatifs. Aucun SLA de performance n'est établi avec une base de 30 MB.
4. **Validation métier et juridique.** Aucun seuil LMD, barème fiscal ou droit documentaire n'a été changé par supposition. Leur validation appartient aux responsables concernés.
5. **Opérations distantes.** La destination hors serveur des sauvegardes, les credentials, RPO/RTO, alertes et essais de charge du serveur cible ne sont pas configurés ou certifiés ici. Aucun site distant, DNS, certificat réel ni compte de service externe n'a été modifié.
6. **Bibliothèques QR.** Les versions courantes continuent d'émettre quelques dépréciations PHP 8.4 dans leurs signatures. Les PDF passent ; aucun patch non maintenable n'a été fait dans vendor.

## Revue avant mise en production

- Renseigner ERP_INSTITUTION_ID et TRUSTED_PROXIES avec l'identité et les adresses/CIDR réels de la frontière réseau. L'application ne fait plus confiance par défaut à tous les proxies.
- Vérifier REVERB_APP_ID/KEY/SECRET côté serveur, les valeurs VITE_REVERB_* côté frontend et l'origine HTTPS réelle. Le backend publie vers le service Reverb interne ; le navigateur utilise le domaine public.
- Ressaisir les dates officielles en JJ/MM/AAAA dans les paramètres de l'année active : l'ancienne clé cache n'est plus la source de vérité et aucune ancienne date de 2024 n'a été reprise automatiquement pour 2026-2027.
- Les comptes/candidatures déjà existants doivent utiliser la connexion, le reset vérifié ou le workflow administratif ; l'inscription publique n'est plus un mécanisme de réactivation.
- Établir une destination de backup externe et une supervision réelle des workers/Redis. Redis ne doit plus évincer des jobs pour faire de la place au cache ; surveiller l'usage mémoire et les échecs d'écriture.
- Exécuter les parcours caméra/audio et de génération documentaire dans l'environnement HTTPS cible. La syntaxe, l'image, le proxy et la readiness ont été testés localement ; les permissions de chaque navigateur distant ne peuvent pas être certifiées depuis le dépôt.

## Sauvegardes et isolation

La sauvegarde préalable est conservée localement dans `backend/storage/app/backups/audit-before-remediation-20261022.dump`, un emplacement ignoré par Git. Une copie gzip utilisée pour le drill est au même endroit. Aucune donnée personnelle de sauvegarde n'a été ajoutée au rapport ou envoyée vers un service externe.

Les bases et conteneurs temporaires créés pour les tests sont nettoyés après validation. L'image `encg-erp-audit:20261022` est conservée pour revue. Les fichiers de rapport sont les seuls artefacts d'audit destinés au dépôt ; les scripts temporaires de transformation ont été retirés.
