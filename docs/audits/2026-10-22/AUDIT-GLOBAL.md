# Audit global ENCG ERP — 22 octobre 2026

> État initial avant corrections. Voir [REMEDIATION.md](REMEDIATION.md) pour les modifications et validations effectuées ensuite.

## Verdict

Le projet possède une base fonctionnelle substantielle et des tests qui passent. La base locale est cohérente sur les contrôles exécutés. En revanche, plusieurs défauts de contrôle d'accès et de concurrence empêchent de considérer cette version comme prête pour une exploitation sensible sans corrections. Priorité à la récupération de compte par inscription, à la confidentialité du chat, aux dates officielles modifiables par un simple utilisateur et aux dépendances signalées vulnérables.

Cet audit porte sur le checkout local et les conteneurs locaux. Il ne constitue ni une certification de sécurité, ni un audit juridique, ni une vérification exhaustive de chaque écran ou d'un serveur de production distant. Les constats de code ci-dessous ne sont pas tous reproduits par exploitation HTTP : cette distinction est précisée. Aucun correctif métier ni changement volontaire de données applicatives n'a été effectué. Les tests utilisent une base SQLite en mémoire. Le build a régénéré les fichiers ignorés de frontend/dist.

## Périmètre et preuves exécutées

Inventaire : 532 fichiers backend/app (~67 513 lignes), 428 fichiers frontend/src (~129 746 lignes), 141 migrations, 80 fichiers backend/tests, 5 fichiers frontend/e2e. Ces nombres décrivent des fichiers, pas un taux de couverture ni autant de modules indépendants.

| Contrôle | Résultat observé |
|---|---|
| Frontend Vitest | 16 fichiers, 34 tests réussis |
| TypeScript `npx tsc --noEmit` | Réussi, code de sortie 0 |
| Oxlint | 643 avertissements, 0 erreur, code 0 |
| Build Vite | Réussi ; avertissement asset `/assets/chat-bg.png` non résolu au build |
| Backend Unit | 69 tests réussis, 286 assertions |
| Backend Feature `--stop-on-failure` | Suite terminée : 234 tests réussis, 710 assertions |
| Playwright Chromium | 11 tests réussis, 1 test live ignoré ; parcours critiques et contrôles FR/AR avec API simulée |
| Migrations locales | Toutes les migrations listées sont appliquées |
| `encg:deep-scan`, sans `--fix` | 342 contrôles, 0 erreur critique signalée, 1 avertissement d'indexation |
| Snapshot SQL indépendant | 138 tables publiques, base de 30 MB |
| npm audit `--omit=dev` | 10 packages signalés : 8 high, 1 moderate, 1 low |
| Composer audit `--locked --no-dev` | 32 advisories réparties sur 9 packages |

Les résultats des audits de dépendances sont conservés dans `npm-audit.json` et `composer-audit.json`. Un package signalé n'implique pas que chaque advisory soit exploitable dans cette application. Certaines dépendances npm sont liées au build/PWA même avec `--omit=dev` : distinguer navigateur, serveur de développement et chaîne de compilation avant de qualifier l'exposition réelle.

Les avertissements backend incluent les métadonnées PHPUnit dans les docblocks et des dépréciations PHP des bibliothèques QR. Ils ne sont pas des échecs de tests.

## Points solides

- Stack cohérente : Laravel 12, React 19, TypeScript, PostgreSQL, Redis, Sanctum et Spatie.
- Routes par acteurs, services métier, composants partagés, chargement différé et TanStack Query déjà présents.
- Cookie d'authentification HttpOnly ; pas de token retourné par la réponse normale de connexion ; refus des tokens en query string pour l'authentification générale.
- Expiration des tokens de connexion, protections de rôles sur de nombreuses routes admin, contrôles de dossiers, URLs documentaires signées et tests de sécurité existants.
- Référentiel `LmdRules` partagé côté backend ; tests de seuils, compensation, documents enseignants et processus académiques.
- Migrations, sauvegardes planifiées, outils de diagnostic, Sentry et pipeline CI existent.

Ces protections ne compensent pas les routes ou chemins d'écriture qui les contournent.

## Constats prioritaires

### A01 — P0 — L'inscription publique peut remplacer le mot de passe d'un compte candidat existant

**Preuves :** `backend/routes/api/auth.php`, `backend/app/Presentation/Api/Controllers/Auth/AuthController.php::register`, `backend/app/Domain/Auth/Services/RegisterUserService.php::registerUser` et `isSameCandidate`.

La route d'inscription est publique. Le service retrouve un utilisateur par email, accepte un rapprochement par CNE ou CIN, puis remplace son mot de passe via `forceFill` lorsque le compte existe. Le contrôleur génère ensuite un token et un cookie de connexion. Il n'y a dans ce chemin ni vérification du mot de passe existant, ni validation par email/OTP de la propriété du compte. Connaître des identifiants administratifs d'un candidat ne prouve pas qu'on est ce candidat.

Le service exclut certains rôles privilégiés, mais les comptes étudiants restent concernés. Rectification après vérification de `uniqueIds()` : la clé `id` de User est numérique, `uuid` est une colonne distincte. La conversion `(int)` évoquée initialement n'est donc pas une vulnérabilité démontrée ; le défaut établi est la réinitialisation publique du mot de passe sans preuve de propriété.

**Impact :** prise de contrôle potentielle d'un compte étudiant/candidat et modification d'identité. Constat établi par lecture du chemin complet ; aucune prise de contrôle d'un vrai compte n'a été tentée.

**Correction :** séparer création et activation d'un compte préexistant. Refuser de remplacer un mot de passe depuis l'inscription publique. Utiliser une invitation à usage unique ou un reset vérifié, limiter dans le temps les jetons et comparer les UUID comme chaînes. Ajouter des tests négatifs : bon CNE sans preuve de propriété, mauvais CIN, email d'un autre candidat et UUID différents qui donnent le même entier.

### A02 — P1 — Fuite transversale de messages dans le chat classroom

**Preuves :** `backend/routes/api/shared.php` route `/classroom/chat/{group}/{module}/messages`, `backend/app/Http/Controllers/Api/InternalApiController.php::chatMessages`, `backend/app/Models/Message.php`.

La déclaration partagée exige seulement une authentification, mais une déclaration dupliquée dans admin.php, chargée ensuite, impose également ses rôles de personnel/enseignant. La méthode reçoit `$group` et `$module`, mais ne les utilise pas. Elle retourne les 50 derniers messages de `Message` avec le nom de leur auteur, sans filtre de conversation ni vérification d'appartenance.

**Impact :** un utilisateur admis par les rôles de la route effective peut recevoir des messages d'autres conversations. Un étudiant était bloqué par la route dupliquée ; cela ne rendait pas le filtrage des messages correct. Constat statique ; aucun contenu personnel n'a été extrait pour le démontrer.

**Correction :** déterminer la conversation liée au groupe/module, vérifier l'inscription ou l'affectation de l'enseignant, puis filtrer par `conversation_id`. Tester les accès entre groupes, utilisateurs, matières et établissements.

### A03 — P1 — Un compte connecté peut modifier les dates officielles

**Preuves :** `backend/routes/api/shared.php`, `backend/app/Http/Controllers/Api/TimetableExportController.php::saveDatesConfig`.

`POST /api/timetable/dates-config` se trouve dans le groupe `auth:sanctum`. La méthode valide deux chaînes puis exécute `Cache::forever`, sans permission ni rôle administratif. Le contrôleur de base n'ajoute aucun contrôle automatique. Les dates sont globales et ne sont pas validées comme dates.

**Impact :** altération des dates affichées sur les emplois du temps par un utilisateur ordinaire disposant d'un compte autorisé à continuer sa session.

**Correction :** permission explicite de gestion des calendriers, validation de dates, audit avant/après et persistance SQL par établissement/année. Le cache doit dériver de la donnée durable, pas servir de stockage unique.

### A04 — P1 — Optimistic locking non atomique et contournable

**Preuves :** `backend/app/Traits/OptimisticLocking.php`, `backend/app/Services/Academic/GradeService.php::storeBatch`, `backend/tests/Feature/ConcurrentGradeSubmissionAndLockingTest.php`.

Le trait compare la version en base seulement si `version` est dirty. Sans version dans les modifications, il incrémente simplement la valeur du modèle en mémoire. Deux objets chargés à version 1 peuvent chacun sauvegarder une valeur différente et finir tous deux à version 2. Même la branche qui vérifie utilise une lecture suivie d'une écriture distincte, sans condition de version atomique dans l'UPDATE. `storeBatch` ne transmet pas la version client.

Les tests nommés « Concurrent » vérifient la version initiale et une mise à jour successive, sans deux rédacteurs concurrents. La présence des colonnes `version`, confirmée par le scan SQL, ne prouve donc pas la protection contre les pertes d'écriture.

**Correction :** `UPDATE ... WHERE id = ? AND version = ?`, incrément en SQL, vérification du nombre de lignes touchées et retour 409. Imposer la version attendue sur les écritures sensibles. Tester deux copies périmées puis une vraie concurrence PostgreSQL.

### A05 — P1 — Dépendances avec advisories connues

**Preuves :** fichiers JSON d'audit joints, exécutés le 22/10/2026 contre les dépendances locales.

Backend : dompdf/dompdf (6), guzzlehttp/guzzle (6), laravel/framework (1), league/commonmark (12), league/flysystem (1), maatwebsite/excel (1), phpoffice/phpspreadsheet (3), phpseclib/phpseclib (1), symfony/http-foundation (1). Les nombres sont des advisories, pas des vulnérabilités distinctes démontrées dans l'ERP.

Frontend/chaîne npm : axios, baseline-browser-mapping, brace-expansion, browserslist, fast-uri, follow-redirects, i18next-http-backend, nanoid, source-map-js, vite.

**Correction :** qualifier les chemins réellement utilisés, mettre à jour les versions verrouillées vers des versions corrigées compatibles, puis rejouer PDF, import Excel, authentification, routes et build. Ne pas appliquer aveuglément un `audit fix --force`. Les exports PDF et imports de fichiers méritent une attention particulière compte tenu de leur usage dans l'ERP.

### A06 — P1 — Le pipeline peut rester vert malgré des advisories Composer

**Preuve :** `.github/workflows/ci.yml`, job `code-quality-and-security`.

Le step Composer Audit a `continue-on-error: true`. Le script exécute aussi `exit 0` lorsque le statut est différent de 0 et de 100, ce qui neutralise les retours d'advisories. Le commentaire « fail ... on real advisories » ne correspond pas au comportement.

**Correction :** retourner le statut des advisories et faire échouer le gate de sécurité. Traiter séparément une indisponibilité réseau avec un état explicite. Définir des exceptions temporaires documentées si nécessaire. Ajouter npm audit/SCA et PHPStan au gate selon un seuil adopté.

### A07 — P1 — Modifications de candidature sans validation des champs

**Preuves :** `backend/app/Http/Controllers/Api/AdmissionController.php::update`, `backend/app/Models/Application.php`.

La méthode utilise `$application->update($request->all())` ; le modèle protège seulement `id`. Un opérateur ayant accès à cette route peut modifier des colonnes au-delà du besoin du formulaire, notamment rattachement de campagne, scores ou champs de revue. L'exposition HTTP dépend des rôles de la route ; il ne s'agit pas ici d'une route anonyme démontrée.

**Correction :** FormRequest, liste blanche de champs, permissions séparées pour score/statut/revue et transitions métier explicites. Journaliser les modifications sensibles.

### A08 — P1 — La configuration HTTPS désactive caméra et microphone

**Preuves :** `docker/nginx/prod.conf`, header `Permissions-Policy`; `frontend/src/features/exams/pages/AdminExamScanPage.tsx`, `frontend/src/features/ai/pages/AiAssistantPage.tsx`.

Le header `camera=(), microphone=(), geolocation=()` interdit l'accès caméra et micro, y compris pour la même origine. Des pages appellent pourtant `navigator.mediaDevices.getUserMedia` pour le scan et l'audio.

**Impact :** fonctionnalités présentes en développement mais susceptibles d'être bloquées une fois cette configuration HTTPS activée. La configuration réellement chargée sur un serveur distant n'a pas été inspectée.

**Correction :** autoriser `(self)` pour les capacités requises, conserver la demande de permission navigateur et vérifier les parcours sur la configuration de production.

## Architecture backend et intégrité métier

### A09 — P2 — Des contrôleurs modifient le schéma pendant une requête

**Preuves :** `AdmissionController.php` contient `Schema::table` ; `Professor/ProfessorPortalController.php::getDocumentRequests` crée la table si elle manque.

Cela masque les migrations manquantes, impose des droits DDL au compte runtime, ouvre des courses entre requêtes et rend les environnements difficiles à reproduire.

**Correction :** déplacer les changements dans des migrations, vérifier le schéma au déploiement et limiter les privilèges runtime. Une table absente doit devenir une erreur opérationnelle visible.

### A10 — P2 — Données fictives et valeurs de repli peuvent être présentées comme officielles

**Preuves :** `AdmissionController::store` attribue `gender = M`, `birth_date = 2006-01-01` et choisit la première campagne ; `TimetableExportController::exportPdf` contient des noms/grades/départements de repli ; `ProfessorPortalController` contient une réponse pédagogique fixe avec chapitre, concepts et mention de conformité.

Ces mécanismes évitent parfois un écran vide mais peuvent produire un dossier, un document ou une recommandation incorrects. Leur activation dépend du chemin et des données manquantes.

**Correction :** distinguer démo et réel, préserver les valeurs inconnues, refuser la génération officielle si les informations obligatoires manquent et rattacher explicitement la campagne/année. Ne pas annoncer une conformité calculée quand le résultat est fixe.

### A11 — P2 — Multi-établissement non isolé par défaut

**Preuves :** `BelongsToInstitution` ne fournit qu'une relation ; `EnsureInstitutionContext` affecte un contexte par défaut sans filtre de requête ; les dates utilisent une clé cache globale et le scan impose institution 1.

Pour un déploiement exclusivement ENCG Fès, cela peut être un choix assumé. Pour plusieurs établissements dans la même base, cette structure ne garantit pas la séparation des données. De nombreuses routes partagées doivent être auditées objet par objet ; l'authentification seule n'est pas une autorisation.

**Correction :** choisir explicitement un périmètre mono-établissement ou concevoir des scopes/Policies et clés de cache tenant-aware, avec tests croisés. Ne pas annoncer le multi-tenant sur la seule présence d'une colonne.

### A12 — P2 — Taille des fichiers et multiplication des responsabilités

`AdminGradesPVPage.tsx` comporte environ 5 176 lignes non vides et 328 KB de source. `InscriptionPage.tsx` dépasse 229 KB et `PdfExportController.php` 161 KB. Plusieurs modèles/services historiques coexistent. Certains moteurs sont des wrappers par héritage : ce n'est pas une preuve que chacun constitue un moteur métier indépendant.

**Correction :** extraire progressivement formulaires, hooks de données, calculs, exports et composants. Définir les classes canoniques à partir du code et des appels réels, puis aligner la documentation d'architecture. Éviter une réécriture globale. Sécuriser d'abord les chemins d'écriture.

## Base de données

L'état courant est bon sur les contrôles disponibles : 274 relations FK formelles sans orphelins, pas de doublons de notes détectés, valeurs dans [0,20], pondérations évaluées à 100%, absence de conflits d'emploi du temps détectés et colonnes de version présentes. Une année active 2026-2027 a été observée.

Ces résultats décrivent un instantané local de 30 MB ; ils ne démontrent ni la tenue sous charge ni la sûreté de toutes les mutations. Le script de deep scan comporte des choix propres au mono-établissement. Son libellé « 100% opérationnel » est trop large par rapport aux contrôles qu'il réalise.

### A13 — P2 — 168 colonnes FK sans index repéré

Le scan interne et la requête indépendante identifient ces colonnes. La liste est conservée dans `database-snapshot.txt`. Le détecteur considère un index contenant la colonne comme existant, même si celle-ci n'est pas en tête d'index ; il ne prouve donc pas que tous les autres accès sont bien optimisés.

**Correction :** prioriser les FK des notes, inscriptions, présences, demandes et journaux selon les requêtes et volumes ; utiliser EXPLAIN ANALYZE sur une copie représentative. Créer les index utiles, pas 168 index sans mesure. Vérifier aussi unicités métier, CHECK sur notes/horaires et suppressions en cascade au regard des règles d'archivage.

Les estimations `n_live_tup` peuvent être nulles ou anciennes : elles ne sont pas des comptages exacts. Aucun diagnostic de perte de données n'est déduit de ces estimations.

## Frontend, UX et performance

### A14 — P2 — Une erreur analytique devient artificiellement un tableau à zéro

**Preuve :** `frontend/src/features/analytics/ui/AdminAnalyticsDashboard.tsx::fetchData`.

Le catch remplace les données par des totaux à zéro sans renseigner l'état d'erreur. Une panne API ressemble ainsi à une absence d'étudiants ou de demandes.

**Correction :** afficher un état « données indisponibles », une action réessayer et éventuellement les dernières données valides avec leur date. Distinguer chargement, vide et erreur dans les autres pages également.

### A15 — P2 — Poids initial et dette de qualité de l'interface

Build observé : CSS global ~630 KB non compressés (~63 KB gzip), `vendor-others` ~1 013 KB, `vendor-react-core` ~483 KB, `vendor-ui-visuals` ~316 KB. L'index précharge notamment les bundles others, react-core et state. Le lazy loading des pages est utile mais ne supprime pas ce coût partagé.

**Correction :** analyser le graphe des bundles, différer les bibliothèques lourdes selon les pages, réduire le CSS et mesurer LCP/INP sur mobile avec un réseau réaliste. Réparer la référence chat-bg. Les tailles seules ne constituent pas des mesures de Core Web Vitals.

Les 643 warnings de lint concernent notamment les imports/variables inutilisés. Les réduire progressivement ; adopter ensuite un budget de warnings et renforcer le typage des contrats API. La CI exécute TypeScript, mais le script npm build seul ne le fait pas : le déploiement doit garder ce contrôle explicite.

### A16 — P2 — Politique CSP permissive et partiellement inefficace

**Preuve :** `frontend/index.html` : `unsafe-inline`, `unsafe-eval`, `connect-src` ouvert à plusieurs schémas et `frame-ancestors` placé dans une meta.

Une directive frame-ancestors dans une meta n'offre pas la protection attendue. Le Nginx HTTPS apporte toutefois X-Frame-Options SAMEORIGIN : le site n'est donc pas dépourvu de protection contre les frames dans cette configuration.

**Correction :** délivrer la CSP en header serveur, restreindre les origines aux services requis et supprimer progressivement unsafe-eval/unsafe-inline avec tests de compatibilité. Aligner l'intention frame-ancestors et X-Frame-Options.

## Tests et exploitation

### A17 — P1/P2 — La couverture de validation surestime certaines garanties

`backend/phpunit.xml` force SQLite en mémoire et `backend/tests/TestCase.php` le force également dans l'environnement et la configuration. Les jobs CI déclarent PostgreSQL et exécutent les migrations dessus, mais les tests applicatifs restent SQLite. Cela laisse de côté certaines différences de types, SQL PostgreSQL, index partiels et concurrence.

Les tests Playwright critiques utilisent `mockApi`. Le fichier live est désactivé sans `E2E_LIVE`, et son unique test vérifie seulement l'accès à la page login. Des tests navigateur simulés sont utiles, mais ils ne prouvent pas un parcours complet frontend/API/base.

**Correction :** garder les tests rapides puis ajouter une suite d'intégration PostgreSQL isolée. Tester en priorité prise de compte, accès intergroupes, version périmée, saisie de notes, délibération scellée, import, PDF, dossier et workflow documents avec API réelle. Ajouter des parcours FR/AR et clavier dans le rendu de production.

### A18 — P2 — Exploitation et résilience à renforcer

- `docker/php/Dockerfile.prod` et l'entrypoint masquent des échecs Composer avec `|| true` : rendre ces erreurs bloquantes et construire une image reproductible contenant le code et vendor.
- Les volumes de production montent le checkout hôte sur l'application, et plusieurs services partagent bootstrap/cache : le résultat dépend de l'état du serveur, pas uniquement de l'image.
- Le healthcheck backend teste la présence du fichier artisan : il ne vérifie ni PHP-FPM fonctionnel, ni accès base, ni capacité à servir une requête. Ajouter readiness et monitoring séparés des workers.
- Le Redis de production utilise `allkeys-lru` et n'active pas explicitement AOF dans sa commande. Si queues et cache partagent cette instance, l'éviction ou un redémarrage peuvent affecter des jobs ou états sensibles. Séparer les usages et vérifier la politique de persistance.
- Les sauvegardes planifiées et scripts existent, mais le job CI « restore drill » ne fait qu'un contrôle de syntaxe. Aucune restauration complète n'a été exécutée dans cet audit. Définir RPO/RTO, sauvegarde hors serveur, contrôle de restauration et alerte en cas d'échec.
- Le compose prod ne déclare pas de service Reverb alors que le compose de développement en possède un : préciser le fournisseur WebSocket prévu et tester le temps réel une fois déployé.
- `trustProxies('*')` suppose une frontière réseau maîtrisée. Limiter les proxies approuvés ou garantir que l'application est accessible uniquement via le proxy autorisé.
- L'audit HTTP stocke un payload par exclusion de quelques clés et l'URL complète. Vérifier la rédaction récursive des secrets/OTP/signatures ainsi que les données médicales, CIN et durées de rétention ; éviter de dupliquer des données sensibles dans les journaux.
- `XssSanitizer` applique strip_tags à toutes les chaînes, y compris les secrets et contenus libres. Préférer validation ciblée et encodage à la sortie ; un password doit être traité sans transformation silencieuse.

Les durées de rétention, conformité juridique, règles LMD institutionnelles et paramètres fiscaux doivent être validés par les responsables métier. Le passage des tests de formule ne certifie pas leur validité réglementaire.

## Plan d'action recommandé

| Priorité | Travail | Critère d'acceptation |
|---|---|---|
| Immédiat | A01 inscription et rapprochement UUID | Aucun compte existant ne change de password sans preuve de propriété ; tests de tentatives adverses |
| Immédiat | A02 chat, A03 dates | Un étudiant ne lit que ses conversations et reçoit 403 sur les écritures administratives |
| Immédiat | A05/A06 dépendances et gate | Versions corrigées vérifiées, exceptions documentées, pipeline rouge sur advisories non acceptées |
| Sprint suivant | A04 concurrence, A07 validation | 409 sur version périmée ; champs et transitions explicitement autorisés |
| Sprint suivant | A08/A09 production et migrations | Caméra/audio testés sous HTTPS ; aucune mutation de schéma depuis HTTP |
| Sprint suivant | A17 intégration réelle | Parcours critiques passant sur PostgreSQL et API réelle |
| Ensuite | A10–A16 données, UX, performance | Aucun faux zéro ni document avec identité inventée ; budgets mesurés et contrôles d'accès croisés |
| Ensuite | A18 exploitation | Readiness utile, backups restaurés, workers/Redis surveillés, déploiement reproductible |

La prochaine étape utile est une campagne de corrections ciblées et vérifiables, en commençant par les quatre risques de sécurité métier, avant l'ajout de nouveaux modules.
