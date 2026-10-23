# Nouveau deep scan — étudiant, professeur et administration

23 octobre 2026. Périmètre complémentaire au travail TAFEM : réinscription, recours, stages/PFE, soutenances, orientation, comptes et permissions, disponibilités et confirmations de l’interface.

## Verdict

**Il reste des défauts importants.** Les corrections TAFEM précédentes ne garantissent pas la sûreté des autres parcours. Ce scan identifie **21 constats regroupés**, dont cinq prioritaires P0 concernant l’élévation de privilèges, les modifications pédagogiques non autorisées et le paiement déclaré par le client.

Les preuves proviennent de requêtes HTTP sur PostgreSQL isolé, de deux scénarios navigateur avec erreurs serveur synthétiques, de la réflexion des routes et de la lecture du code. Aucun étudiant réel n’a été réinscrit, aucune note réelle modifiée, aucun paiement ou message externe déclenché. Aucune correction fonctionnelle n’est revendiquée dans ce rapport : les ajouts sont des sondes reproductibles et leurs résultats.

## Vérifications réalisées

| Contrôle | Résultat et portée |
|---|---|
| Nouvelles sondes métier/RBAC | 19 assertions de protection échouent dans `RoleJourneysDeepScanTest` et `AdministrationDeepScanTest`, 26 assertions exécutées. Ces échecs sont les défauts reproduits, pas une suite de validation réussie. |
| Frontières du mode production | **4 sondes échouent, 5 assertions** : réglage de mass assignment utilisé en production et contrats de création/consultation de compte. Voir `roles-production-mode-probes.txt`. Les FK et CHECK restent actifs. Total backend nouveau : **23 sondes en échec**, regroupées par cause ci-dessous. |
| Tests existants des mêmes domaines | **16 réussissent, 43 assertions** : réinscription, PFE, professeurs/affectations, isolation étudiant et accès professeur-module. Ils ne couvrent pas les scénarios adverses ci-dessous. |
| Navigateur | **2 sondes échouent sur la protection attendue** : confirmation mensongère des paramètres et d’un paiement après HTTP 500. API simulée uniquement pour ces injections de panne, données fictives et captures inspectées. |
| Surface backend | **1 158 routes de contrôleurs, 125 contrôleurs, 32 routes vers une méthode absente**, selon réflexion. Ce n’est pas 32 erreurs HTTP observées : une route de création utilisateur a été exercée séparément. |
| Base réelle, lecture seule | **370 contrôles, 305 FK vérifiées, zéro orphelin, zéro anomalie critique détectée par le scanner structurel**. 55 cas historiques restent à réconcilier ; 187 FK sans index dédié sont des pistes de performance, pas des lenteurs démontrées. |
| Inventaire réel | 74 étudiants, 18 professeurs, 1 721 notes, 72 inscriptions, 72 parcours, 3 stages ; aucun recours, aucune soutenance, aucune disponibilité ni quota de filière dans la base inspectée. Ces tables vides expliquent pourquoi certains défauts apparaissent seulement avec des fixtures complètes. |

Sources : `roles-audit-probes-postgres.txt`, `roles-production-mode-probes.txt`, `roles-existing-tests.txt`, `roles-browser-probes.txt`, `roles-surface-inventory.json`, `roles-database-scan.txt`. Les anciens résultats verts et les sondes rouges actuelles répondent à des scénarios différents.

## Constats confirmés et corrections recommandées

P0 : corriger avant d’ouvrir ces opérations à des utilisateurs réels. P1 : blocage, incohérence ou défaut de fiabilité important.

### A01 — P0 — Un administrateur institutionnel peut se promouvoir super-admin

Deux chemins reproduits : `PUT /api/users/{id}` avec la permission `users.manage`, et `POST /api/admin/roles-permissions/users/{uuid}` pour un institution-admin. Les deux retournent **200** et le compte obtient réellement `super-admin`. Le second chemin n’exige pas de permission individuelle supplémentaire. Les rôles/permissions soumis ne sont pas limités à un périmètre délégable.

**Correction :** une Action de délégation commune, hiérarchie explicite, interdiction d’autoélévation et d’attribution de droits supérieurs à ceux autorisés au délégant, protection du dernier super-admin, transaction et audit avant/après. La gestion des comptes ne doit pas suffire à gérer toutes les permissions.

Références : [UserController.php:58](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/UserController.php:58), [AdminRolePermissionController.php:129](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/AdminRolePermissionController.php:129).

### A02 — P1 — « Mes stages supervisés » expose les stages d’un autre enseignant

Un professeur sans lien avec le stage reçoit **200** et la ligne de stage d’un autre encadrant, avec la relation étudiant. La méthode `supervised` charge tous les stages, sans filtre sur le superviseur.

**Correction :** scoper par profil professeur authentifié et affectation d’encadrement ; réserver une vue élargie distincte aux responsables habilités, paginer et limiter les données personnelles retournées.

Référence : [ProfessorInternshipController.php:24](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Professor/ProfessorInternshipController.php:24).

### A03 — P0 — Un professeur étranger au stage peut le clôturer

`POST /api/professor/internships/update-status` accepte l’ID d’un stage non supervisé : **200**, statut réellement passé de `active` à `completed`. L’existence de l’ID remplace le contrôle d’autorisation métier.

**Correction :** policy sur l’instance et Action de transition contrôlant l’encadrant, les pièces, la décision, la version et les transitions permises. Aligner les statuts API sur l’enum canonique : `approved` et `submitted`, actuellement acceptés par le validateur, ne figurent pas dans `InternshipStatus`.

Référence : [ProfessorInternshipController.php:61](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Professor/ProfessorInternshipController.php:61).

### A04 — P0 — Un professeur hors jury peut noter une soutenance

Une soutenance planifiée avec d’autres membres du jury reçoit **19/20** via un professeur sans lien : **200**, note persistée et stage clôturé. Le FormRequest vérifie seulement le rôle professor ; le service ne contrôle ni jury ni propriétaire.

**Correction :** vérifier membre du jury et habilitation de saisie, contexte/état de la soutenance, version et verrou. Une validation collégiale doit être distincte de la saisie individuelle ; préserver chaque décision.

Références : [EvaluateInternshipRequest.php:10](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Requests/Internship/EvaluateInternshipRequest.php:10), [SoutenanceService.php:35](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Services/Academic/SoutenanceService.php:35).

### A05 — P0 — Le recours contourne le verrou du PV signé

Après création d’une signature réelle en base pour le module et l’année, `POST /api/admin/grade-appeals/{id}/resolve` retourne **200** et remplace une note de **8 par 18**. La sauvegarde directe de Grade respecte sa version Eloquent mais contourne le contrôle de signature du service de saisie ordinaire. Optimistic locking seul ne protège pas le PV.

**Correction :** passer toute correction par le même verrou module/année et une procédure explicite d’avenant/déverrouillage autorisé. Rendre atomiques décision, note, audit et invalidation/republication du PV ; ne pas laisser une ancienne signature certifier les nouvelles valeurs.

Référence : [GradeAppealController.php:249](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Academic/GradeAppealController.php:249). Le chemin parallèle `ComplaintController::resolveGradeAppeal` écrit également directement dans Grade et doit être réconcilié avec cette Action.

### A06 — P0 — Un paiement peut être déclaré « payé » par le navigateur

Un étudiant demande une filière `formation_continue` avec `payment_status=paid` et `payment_provider=cmi`, sans transaction financière : **200**, parcours déplacé vers cette filière. Le backend considère le champ fourni par le candidat comme preuve suffisante.

**Correction :** ignorer tout statut financier envoyé par le client ; vérifier une transaction serveur rattachée au compte, à l’année, au cursus et au montant, avec référence unique et événement fournisseur authentifié. Isoler strictement la simulation des parcours de production. Grande École doit conserver son exemption de frais selon la règle existante.

Référence : [ReinscriptionController.php:144](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/ReinscriptionController.php:144).

### A07 — P1 — Réessayer la réinscription fait avancer plusieurs fois le semestre

Deux requêtes identiques réussissent : **S3 → S5 → S7**, dans la même année, sans aucune ligne `student_registrations` créée. L’endpoint prend le parcours courant, ajoute deux semestres, puis écrase le parcours de l’année à chaque appel.

**Correction :** décision annuelle validée comme source, destination immuable calculée depuis l’année d’origine, clé d’idempotence et unicité étudiant/année ; inscription et parcours cohérents dans une transaction. Le double clic/retry doit restituer le même résultat. La progression académique doit réutiliser le moteur canonique, pas une addition systématique.

Référence : [ReinscriptionController.php:138](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/ReinscriptionController.php:138).

### A08 — P1 — Un refus de réinscription active quand même l’étudiant

Sans paiement requis pour un cursus payant, réponse **402**, mais le statut du candidat auparavant `pending` devient réellement **active**. Retourner une réponse d’erreur depuis la closure de transaction ne déclenche pas un rollback ; les écritures précèdent les contrôles.

**Correction :** terminer les préconditions avant les mutations, ou lever une exception métier provoquant le rollback. Tester systématiquement l’absence de changement après chaque refus 4xx.

Référence : [ReinscriptionController.php:129](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/ReinscriptionController.php:129).

### A09 — P1 — Une moyenne de 12,5 et l’admission sont inventées sans notes

Le statut de réinscription affiche **12,5/20** et `is_admis=true` pour un étudiant sans aucune note. Il agrège en outre des notes sans délégation à la décision annuelle officielle.

**Correction :** moyenne inconnue = null, décision « en attente de délibération » tant qu’aucune décision officielle n’existe ; aucun fallback chiffré. Exposer le contexte annuel et le motif de blocage.

Référence : [ReinscriptionController.php:44](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/ReinscriptionController.php:44).

### A10 — P1 — La fenêtre de recours fermée n’est pas appliquée à l’écriture

Le GET annonce `appeal_window.is_open=false`, mais le POST dépose un recours : **201**, ligne persistée. La date limite est recréée à `now()+48h` pour chaque dépôt au lieu d’être validée contre une publication réelle.

**Correction :** partager une règle de fenêtre serveur entre lecture et écriture, basée sur la publication autorisée de l’année/session/évaluation. Le délai est une règle configurable à valider institutionnellement ; la date de fin de session ne prouve pas une publication.

Référence : [GradeAppealController.php:51](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Academic/GradeAppealController.php:51).

### A11 — P1 — Un recours peut associer un module et une évaluation étrangère

POST avec `module_id=A`, `assessment_id` d’un module B : **201**. L’existence individuelle des IDs ne vérifie pas leur concordance, l’inscription de l’étudiant, ni la note d’origine. Cette note est fournie par le client.

**Correction :** cibler une note publiée appartenant à l’étudiant ; dériver module, évaluation, année et note initiale côté serveur. Contraintes relationnelles supplémentaires si pertinentes après reprise des données.

Référence : [GradeAppealController.php:60](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Academic/GradeAppealController.php:60).

### A12 — P1 — « Note rectifiée » peut réussir sans aucune note

Un recours sans assessment et sans Grade est résolu en **rectified**, réponse **200**, alors que la table des notes reste vide. Le fallback cherche la première évaluation du module sans contexte complet ; il ne faut pas choisir arbitrairement une note.

**Correction :** cible officielle obligatoire, erreur explicite si elle n’existe pas, décision et mise à jour atomiques, notification seulement après commit. Tester la note exacte modifiée et le maintien de toutes les autres.

Référence : [GradeAppealController.php:253](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Academic/GradeAppealController.php:253).

### A13 — P1 — La convention de stage échoue en mode strict et s’autocertifie en mode production

En configuration de test/local stricte, le dépôt déclenche **MassAssignmentException sur `institution_id`**, colonne absente de la table Internship : le formulaire ne termine pas. En reprenant uniquement le réglage de mass assignment utilisé en production, la même requête retourne **201**, avec `insurance_verified=true` et `convention_status=school_signed`, sans vérification ni action de la direction. Une référence d’assurance est inventée si elle manque.

**Correction :** aligner le DTO et le schéma réel ; créer une demande pending. Réserver assurance vérifiée et visa de l’école à des acteurs habilités, sur des preuves persistées. Aucun champ fabriqué pour débloquer un PDF officiel.

Référence : [InternshipConventionController.php:68](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Academic/InternshipConventionController.php:68).

### A14 — P1 — Un ancien lien public réactive la convention annulée

POST public avec le jeton d’une convention `cancelled` : **200**, `convention_status` passe à **active**. Le statut principal du stage reste annulé : les deux états deviennent contradictoires. Pas de contrôle d’expiration ou de transition dans la méthode.

**Correction :** jeton haché, expirant, usage limité, version du document et état signable obligatoires ; authentifier la preuve du signataire selon le niveau institutionnel retenu. Une convention annulée doit révoquer ses invitations de signature.

Référence : [InternshipConventionController.php:105](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Academic/InternshipConventionController.php:105).

### A15 — P1 — Les disponibilités mélangent l’ID User et l’ID Professor

Trois symptômes reproduits : sauvegarde stricte en erreur sur le champ inexistant `notes` ; sauvegarde avec le réglage production **200** mais disponibilité reliée au **User 2 au lieu du User 3** ; affichage d’une disponibilité valide en erreur **Array to string conversion**, car les créneaux imbriqués passent dans `implode`.

La FK de `professor_availabilities.professor_id` vise **users**, tandis que `myAvailability/saveMyAvailability` choisissent le profil **professors.id**, que le modèle déclare comme relation cible. L’envoi du sondage et la liste utilisent User.id : c’est une incohérence de contrat, pas un orphelin SQL. La source n’a encore aucune disponibilité : aucune corruption réelle constatée.

**Correction :** choisir une clé canonique et aligner FK, relation, lecteurs, écrivains et alertes. Migrer les anciennes correspondances seulement sur preuve ; valider chaque jour et booléen, puis formater les créneaux explicitement.

Références : [ProfessorAvailabilityController.php:111](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/ProfessorAvailabilityController.php:111), [ProfessorAvailability.php:30](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Models/ProfessorAvailability.php:30).

### A16 — P1 — L’orientation calcule le mérite depuis un champ de note inexistant

Avec une note réelle de **16/20**, le GET des vœux annonce un mérite de **0**. Le contrôleur utilise `avg('grade')` au lieu de `value`. Sans note, il utilise 14,50 ; campagne toujours annoncée ouverte et échéance glissante de quinze jours.

**Correction :** moyenne et décision calculées par le service académique canonique dans l’année/les semestres retenus ; score inconnu null. Campagne et échéance persistées. Valider unicité des choix/rangs et inscription de l’étudiant.

Référence : [SpecialtyOrientationController.php:40](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Academic/SpecialtyOrientationController.php:40).

### A17 — P1 — L’affectation ignore les quotas enregistrés

Capacité de filière fixée à **1** dans `filiere_quotas`, deux candidats : **200**, **2 affectés**. L’algorithme utilise des capacités codées par IDs 1–5, puis 60 pour les autres, sans lire les quotas de l’interface.

**Correction :** utiliser année/campagne, quotas, ouverture et seuils persistés ; départage stable, aperçu, verrou et validation idempotente. L’affectation doit créer/actualiser la relation pédagogique canonique, avec traçabilité, plutôt que seulement marquer un vœu.

Référence : [SpecialtyOrientationController.php:149](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/Academic/SpecialtyOrientationController.php:149).

### A18 — P1 — 32 routes déclarent une méthode de contrôleur absente

Inventaire complet dans `roles-surface-inventory.json`. Exemples : création User, création Stage/PFE, recherche et rôles de profil, signature/export PV, export ZIP d’attestations, génération de session d’examens. `POST /api/users` a été exercé et lève une **Error: Call to undefined method UserController::store()**.

**Correction :** supprimer les déclarations inutilisées ou implémenter le véritable use-case avec autorisation et contrat de réponse. Une route absente ne doit pas être compensée par un succès local dans l’interface. Ajouter un contrôle automatique de la surface routée et des contrats HTTP des actions affichées.

Référence : [admin.php:476](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/routes/api/admin.php:476).

### A19 — P1 — Les écrans de compte utilisent un UUID que le contrôleur recherche comme ID numérique

`UserResource` expose `uuid` comme `id`, et les écrans détail/édition l’emploient. `UserController::show/update/destroy` appellent `User::find($id)` sur la clé numérique. La requête GET du compte par son UUID retourne **500** dans la sonde dédiée.

**Correction :** résoudre explicitement par `uuid`, idéalement par route-model binding canonique, avec scope institutionnel et policy sur l’instance ; conserver une compatibilité numérique seulement si un client réel l’exige. Couvrir liste → détail → modification → retour, avec le même identifiant public.

Références : [UserResource.php:37](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Resources/UserResource.php:37), [UserController.php:38](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/backend/app/Http/Controllers/Api/UserController.php:38), [EditUserPage.tsx:31](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/frontend/src/features/admin/pages/EditUserPage.tsx:31).

### A20 — P1 — Une sauvegarde de paramètres échouée affiche « Paramètres enregistrés »

Test navigateur : clic réel, serveur simulé répondant **500**, puis message de succès visible. Le `catch` appelle `toast.success`. Cet ancien écran utilise `/settings`, tandis que le contrôleur institutionnel a un autre contrat et une autre route.

**Correction :** un seul écran/contrat de configuration, erreur visible, formulaire conservé et retry ; confirmer la valeur retournée par le serveur et relire après sauvegarde.

Référence : [SettingsPage.tsx:16](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/frontend/src/features/settings/pages/SettingsPage.tsx:16).

### A21 — P1 — Un paiement échoué est annoncé validé à l’administrateur

Test navigateur sur ligne fictive : POST validation **500**, puis « Paiement … validé avec succès ! » visible. Le test ne démontre aucune validation financière en base ; il prouve l’affirmation erronée de l’interface.

**Correction :** succès uniquement après confirmation serveur ; garder l’état pending après erreur, afficher référence de transaction et décision, interdire les doubles validations. Appliquer le même contrat au rappel de paiement qui annonce également un succès dans son catch.

Référence : [AdminFinanceDashboard.tsx:53](C:/Users/RADOUANE/Desktop/ENCG-ERP-V1/frontend/src/features/admin/pages/AdminFinanceDashboard.tsx:53).

## Autres observations de code à traiter, sans reproduction HTTP complète dans ce scan

- **Appel professeur :** `ProfessorAbsencesView.tsx:294` active une session après une erreur API, invente un session_id et initialise un QR aléatoire. L’issue offline doit être un brouillon local explicite avec synchronisation et conflit, jamais une séance serveur certifiée. Les scénarios caméra, perte réseau et reprise restent à vérifier sur appareil.
- **Signatures et emploi du temps :** `AdminExamSurveillanceHubPage.tsx:787` et `SchedulesEnginePage.tsx:162` annoncent aussi un succès après erreur. Inventorier les autres catch de succès : PWA, pilotage, calendrier et ancien EnrollmentManager. La revue statique confirme les branches ; chaque action n’a pas été rejouée au navigateur.
- **Cohérence des règles :** les paramètres institutionnels et leur simulateur affichent un seuil éliminatoire de 7, alors que la règle canonique du projet `LmdRules` est 6. Ce constat porte sur l’incohérence interne du produit, pas sur une certification réglementaire. Éviter une promesse de configuration sans effet sur le calcul officiel.
- **Mobilité :** `calculateMeritRanking` trie les scores après pagination par ID, donc ne fournit pas un classement global ; le partenaire proposé ne consomme pas les capacités et ne suit pas les vœux. Reprendre les décisions académiques pondérées et annuelles, puis classer avant pagination.
- **Bibliothèque :** le choix d’un exemplaire disponible est effectué avant la transaction sans verrou de ligne ; risque de double attribution sous concurrence. À reproduire avec deux sessions PostgreSQL avant de conclure à une course effectivement exploitée.

## Ordre de correction proposé

1. **Sécuriser les décisions :** A01, A03–A06 ; policies relationnelles, droits délégables et verrou de publication commun. Ajouter les sondes corrigées à la suite normale.
2. **Stabiliser l’année de l’étudiant :** A07–A12 ; Action de réinscription idempotente et décision académique canonique, paiement serveur, recours ciblant une note publiée.
3. **Rendre stage/PFE et disponibilité exploitables :** A02, A13–A15 ; demandes, vérifications et signatures séparées, contrats de données alignés et journalisés.
4. **Fiabiliser l’orientation :** A16–A17 ; campagne, mérite et quotas réels, aperçu avant affectation et historisation annuelle.
5. **Aligner toutes les actions affichées :** A18–A21 et faux succès statiques ; routes valides, UUID cohérents, erreurs visibles, état serveur comme vérité.

Ces changements peuvent rester additifs : conserver les notes, PV et parcours ; ajouter les preuves financières et décisions si nécessaires, avec migration testée sur restauration isolée. Ne pas remplacer les 55 cas historiques par des données devinées.

## Limites explicites

Ce scan n’est ni un pentest exhaustif ni un test de charge, et ne vérifie pas un serveur de production distant. Les contrôles base ne certifient pas les calculs métier. Les deux scénarios navigateur portent sur des injections de panne desktop ; les parcours mobile/FR/AR précédents ne sont pas rejoués ici. Les tables vides réelles ont été complétées exclusivement dans une base `_test`. Aucun contenu personnel n’a été envoyé à un service IA externe. Les sondes rouges restent sous `tests/Audit` et les scénarios navigateur nécessitent `E2E_ROLE_AUDIT=1` ; ils ne rendent pas rouge la suite ordinaire.
