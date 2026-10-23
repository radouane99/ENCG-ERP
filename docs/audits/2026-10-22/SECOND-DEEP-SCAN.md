# Deuxième audit approfondi — structure SQL, workflows et UX

Date : 22 octobre 2026. État local après les corrections décrites dans REMEDIATION.md.

## Conclusion

La base possède un socle relationnel cohérent, mais sa logique métier et certains chemins d'écriture restent insuffisamment protégés. Le succès des tests précédents ne couvre pas ces nouveaux constats. **Les corrections précédentes ne constituent donc pas une validation globale de production.** Les priorités sont les chemins secondaires de notes, la séparation des années universitaires, les opérations de groupe et la persistance des devoirs.

Audit en lecture seule sur PostgreSQL et revue ciblée du code réellement routé. Aucun compte, aucune note, aucune candidature et aucune affectation n'ont été modifiés. Les seuls nouveaux fichiers sont ce rapport et les preuves techniques agrégées.

## Mesures vérifiées

Source : `deep-structure-evidence.txt`, requêtes exécutées dans `BEGIN READ ONLY` avec arrêt sur erreur.

| Contrôle | Résultat |
|---|---:|
| Tables publiques | 138 |
| Contraintes FK présentes | 277 |
| Contraintes CHECK présentes | 4 |
| Couples module/type d'évaluation répétés | 24 |
| Modules concernés par ces répétitions | 12 |
| Modules dont la somme des poids hors « rattrapage » diffère de 100 | 12 |
| Étudiants ayant plusieurs pathways courants | 0 |
| Pathways dont groupe/filière/année/semestre divergent | 0 |
| Inscriptions dont groupe/filière/année/semestre divergent | 0 |
| Notes en dehors de [0,20] | 0 |
| Dates de naissance renseignées des deux côtés et différentes users/students | 1 |
| Signatures globales NULL dupliquées sur leur clé métier | 0 |

Les 72 lignes `absent=true` avec une valeur numérique valent toutes zéro, vérifié séparément. Ce n'est pas présenté comme 72 notes erronées : il faut fixer la convention officielle NULL/0 avant toute normalisation. L'année active observée est l'ID 3. Aucun identifiant personnel ni contenu médical n'est exporté dans ces preuves.

## Constats prioritaires

### D01 — P1 — La grille secondaire de notes contourne les protections du chemin principal

Preuves : `backend/app/Http/Controllers/Api/GradeGridController.php:18`, `:103`, `:142`, `:158`; routes `backend/routes/api/professor.php:23`–`:29`.

Les routes authentifient un rôle professeur/vacataire ou responsable, mais le contrôleur ne vérifie pas son affectation au module/groupe ni l'appartenance de chaque étudiant au groupe fourni. `group_id` est validé puis ignoré à l'écriture. Les `updateOrInsert` directs ne passent ni par le trait de verrouillage optimiste, ni par la vérification de version client, ni par le chemin principal de sauvegarde. Un rôle autorisé à appeler cette route peut ainsi viser des étudiants et modules hors de ses affectations. Le GET crée aussi CC/Exam lors d'une lecture. La moyenne est forcée à 50/50 indépendamment des modalités configurées.

Recommandation : faire déléguer ces deux endpoints aux mêmes règles d'accès et à la même action transactionnelle que la saisie principale; vérifier ensemble année/module/groupe/étudiant, versions et scellement. Lecture sans création. Utiliser les poids canoniques.

Validation attendue : professeur non affecté → 403, étudiant hors groupe → rejet intégral du lot, version périmée → 409, PV signé → rejet, poids personnalisés respectés, GET sans écriture.

### D02 — P1 — Les évaluations et notes ne séparent pas les années

Preuves : schéma SQL `assessments` dans les preuves; `backend/database/migrations/2026_07_09_100000_create_apogee_assessments_grades_tables.php:23`; `GradeGridController.php:32`, `:119`; `backend/app/Imports/GradesImport.php:177`.

Une évaluation porte module/type/poids/date, sans année universitaire, groupe ou session explicite. Les modules sont réutilisables, et la note est unique par étudiant/évaluation. Chercher `firstOrCreate(module_id,type)` réutilise donc le même objet entre années. Un redoublant peut retrouver ou faire remplacer sa note antérieure. Ce risque est structurel; aucun écrasement historique précis n'est affirmé.

Recommandation : distinguer catalogue de modules et offre annuelle du module, rattacher évaluations, affectations, notes et signatures à cette offre. Définir la portée groupe/session avant la migration. Reprendre les données avec règles explicites et quarantaine pour les lignes dont l'année est ambiguë; ne pas attribuer automatiquement toute l'histoire à l'année courante.

### D03 — P1 — Supprimer une modalité peut supprimer ses notes

Preuves : `backend/app/Http/Controllers/Api/AssessmentController.php:33`, `:79`; FK SQL `grades.assessment_id → assessments` avec `ON DELETE CASCADE`.

Le synchroniseur supprime les évaluations omises de la liste envoyée. La FK entraîne alors la suppression de leurs notes. Il n'y a pas de transaction englobant cette synchronisation ni de garde locale contre une évaluation déjà notée/scellée. Une liste vide peut supprimer toutes les modalités du module. L'accès module est vérifié, ce qui ne protège pas contre une modification autorisée mais destructrice.

Recommandation : refuser la suppression si notes ou clôture; archiver/versionner les modalités, valider toute la requête avant écriture et transactionner le lot. Tester omission d'un ID, liste vide, erreur au milieu du lot et module signé.

### D04 — P1 — Deux contraintes définissent des granularités d'inscription incompatibles

Preuves : SQL, uniques `(student_id,academic_year_id,semester_number)` et `(student_id,academic_year_id)`; migration `2026_07_09_092752_safe_normalize_identity_and_constraints.php:89`; `backend/app/Services/Academic/SmartAcademicProgressionService.php:453`.

Le modèle contient semestre et groupe; le code cherche une inscription par étudiant/année/semestre. Pourtant l'unicité annuelle empêche une deuxième ligne pour un autre semestre de la même année. La contrainte avec semestre ne peut alors autoriser ce cas. Cela peut provoquer un conflit SQL au changement de semestre.

Recommandation : décider entre dossier administratif annuel + inscriptions pédagogiques semestrielles séparées, ou véritable inscription semestrielle. Aligner ensuite contraintes, modèles et tous les `updateOrCreate`. Tester S1 puis S2 dans la même année, redoublement et changement de filière. Ne pas supprimer une des contraintes sans régler cette sémantique.

### D05 — P1 — La répartition en groupes réécrit aussi l'historique

Preuves : `backend/app/Http/Controllers/Api/GroupController.php:212`, `:231`, `:239`–`:240`.

La sélection des groupes filtre seulement la filière. Les étudiants sont limités arbitrairement à 50, sans ordre alphabétique explicite. La mise à jour de toutes leurs inscriptions et pathways filtre seulement `student_id` : années passées, semestres et filières antérieurs peuvent recevoir le même nouveau groupe. La FK considère cette référence valide même si son contexte métier est faux.

Recommandation : année et semestre explicites, pathways courants uniquement, tri officiel, traitement complet paginé et transactionnel. Les sous-groupes doivent utiliser le service dédié. Ajouter une vérification de cohérence groupe/filière/année/semestre à chaque écriture; étudier des clés composites pour les relations qui s'y prêtent. Les incohérences mesurées aujourd'hui sont nulles; cet endpoint n'a pas été déclenché durant l'audit.

### D06 — P1 — Mauvais nom du champ semestre dans les cours et le PV global

Preuves : colonne SQL et modèle `StudentPathway.current_semester`; `backend/app/Http/Controllers/Api/LmsCourseController.php:120`; `backend/app/Services/Academic/DeliberationService.php:121`.

Les deux chemins lisent `semester_number` sur un pathway qui stocke `current_semester` et n'a pas cet alias. Dans le LMS le filtre semestre peut être sauté; dans le PV le filtre peut chercher un semestre NULL et perdre les modules du parcours. Cela concerne le résultat affiché/calculé, pas seulement une convention de nommage.

Recommandation : utiliser le champ canonique ou un contrat explicite partagé. Tester un étudiant avec modules de deux semestres et un PV avec pathway renseigné.

### D07 — P1 — L'envoi de devoir confirme une réception sans rien conserver

Preuves : `backend/app/Http/Controllers/Api/LmsCourseController.php:453`; route `backend/routes/api/shared.php:109`; absence réelle des tables `assignments` et `assignment_submissions`; purge historique `backend/database/migrations/2026_07_06_150002_redundancy_purge.php:11`.

Le handler valide éventuellement texte/fichier puis retourne « transmis avec succès ». Il ne stocke ni le fichier, ni le texte, ni une soumission; `assignmentId` n'est pas résolu. Les tables prévues initialement ont été supprimées. Le détail du cours annonce systématiquement `is_submitted=false`, une échéance calculée à création+10 jours et une taille fixe « 2.4 MB ».

Recommandation : reconstruire un workflow persistant devoir/soumission avec auteur étudiant, portée module/groupe/année, échéance, version, fichier privé, statut réel et accès enseignant. Jusqu'à sa livraison, ne pas afficher de succès d'envoi. Tester téléchargement/relecture après reconnexion et existence du devoir dans le bon module.

### D08 — P1 — L'identité possède de nouveau plusieurs sources de vérité

Preuves : SQL `students.birth_date` varchar et `users.birth_date` date, duplication address/city/CIN; `backend/app/Models/Student.php:102`, `:170`; migrations de normalisation et de compatibilité des dossiers.

La normalisation historique a déplacé des données vers users; des colonnes de dossier ont ensuite été réintroduites. Le getter CIN privilégie users alors que son setter écrit students. Nom/email/téléphone ont des setters qui ne modifient l'objet user que s'il est chargé, sans le persister automatiquement. Une même API peut donc sembler modifier une identité sans modifier sa source affichée. Une divergence réelle de date de naissance est présente. Le déplacement récent du DDL vers une migration a sécurisé le déploiement du schéma existant; il n'a pas résolu cette dette de modélisation.

Recommandation : identité canonique typée sur users/profil, candidature conservée comme snapshot daté, données médicales/familiales séparées avec accès restreint. Écrire via une action explicite transactionnelle plutôt que par des setters silencieux. Réconcilier les conflits avant suppression de colonnes; convertir les dates seulement après validation.

### D09 — P1 — La signature du PV oublie l'année dans sa recherche et son écriture

Preuves : `backend/app/Http/Controllers/Api/GradeController.php:379`; schéma réel `module_pv_signatures.academic_year_id NOT NULL DEFAULT 1`; année courante observée = 3.

`updateOrCreate` identifie la signature par module/groupe/session, omet l'année dans la recherche comme dans les valeurs. Une création utilise donc la valeur historique 1; une mise à jour peut reprendre une signature d'une autre année. L'index unique inclut pourtant l'année. Pour un groupe NULL, un UNIQUE PostgreSQL ordinaire permet en outre plusieurs lignes identiques sur le reste de la clé. Aucun doublon global NULL ni désaccord signature/année du groupe n'a été trouvé aujourd'hui.

Recommandation : année requise et validée dans la clé métier et les lectures, supprimer le défaut historique après reprise contrôlée, unicité des signatures globales par index partiel ou `NULLS NOT DISTINCT`. Tester année N puis N+1, groupe précis et portée globale, doubles requêtes concurrentes.

### D10 — P2 — Les affectations professeur ne supportent pas leur propre granularité

Preuves : `module_professor` contient année, groupe et session_type; UNIQUE réel `(module_id,professor_id)` ajouté dans la migration de normalisation `:93`.

Cette unicité interdit au même enseignant deux lignes pour le même module même si groupe, année ou CM/TD changent. Elle contredit les champs de contexte. Définir une clé métier d'affectation complète, son comportement pour groupe NULL et le rôle des remplacements. Ne pas fusionner les doublons en perdant groupes ou heures.

### D11 — P2 — Les états « courant » et les domaines numériques sont peu garantis en SQL

Preuves : seuls quatre CHECK sont présents; pas d'unicité partielle sur année courante par institution ou pathway courant par étudiant. Grades et poids n'ont pas de CHECK de plage.

Les données contrôlées sont actuellement dans les plages et il n'existe pas plusieurs pathways courants. Cela ne protège pas une écriture concurrente, un import ou un autre contrôleur. Ajouter après validation des données : unicités partielles des états courants, valeurs de note/poids, semestres/heures/capacités pertinents. Garder les types de modalités dynamiques en varchar conformément aux règles du dépôt. Une somme de poids entre plusieurs lignes exige une validation transactionnelle; un simple CHECK de ligne ne suffit pas.

### D12 — P1 — Autosave de notes : un changement peut annuler celui d'un autre étudiant

Preuves : `frontend/src/features/exams/components/GradeEntry.tsx:10`–`:20`, `:84`–`:104`.

Le debounce possède un seul timer pour toute la grille et reçoit uniquement le dernier étudiant modifié. Modifier A puis B en moins d'une seconde annule l'envoi de A, alors que sa valeur reste affichée localement. Aucun ensemble d'éléments dirty n'est fusionné. Le timer n'est pas vidé/annulé explicitement au démontage. Cette page appelle justement la grille secondaire D01.

Recommandation : buffer par étudiant/champ ou lot fusionné, versions, indicateur « modifications non enregistrées », stratégie de navigation, retry explicite et retour d'erreur par ligne. Tester deux étudiants en moins d'une seconde puis vérifier la base après rechargement, ainsi que réseau lent et réponses hors ordre.

### D13 — P2 — Création administrative de candidature non atomique et identité réaffectable

Preuves : `backend/app/Http/Controllers/Api/AdmissionController.php:64`–`:130`.

Le handler crée la candidature, cherche/crée un user par email synthétique basé sur CNE puis fait `Student::updateOrCreate(cne)` en remplaçant `user_id`. Il n'englobe pas ces étapes dans une transaction. Un CNE existant rattaché à un autre email peut être relié au user synthétique, et une erreur tardive laisser une candidature seule. La nationalité est forcée à « Marocaine ». Ce chemin administratif est distinct de l'inscription publique déjà durcie.

Recommandation : résoudre l'identité existante sans réaffectation implicite, règles de conflit campagne/CNE, transaction unique et effets externes après commit. Conserver la nationalité validée; absence explicite plutôt qu'une identité inventée. Tester CNE existant avec email différent et échec après création de candidature.

## Design et expérience d'utilisation

Le navigateur de cette session a échoué sur localhost:5173, localhost:80 et 127.0.0.1:5173 (`ERR_EMPTY_RESPONSE`); l'adresse publique configurée a expiré. Le frontend répond toutefois depuis son conteneur. **Ce n'est pas une preuve de panne générale de l'ERP. Aucune capture ni revue visuelle authentifiée n'a été obtenue pendant cette passe.** Les points suivants sont établis par lecture des composants et doivent être complétés par une revue réelle desktop/mobile. Aucun score Lighthouse, contraste mesuré ou conformité WCAG n'est revendiqué.

### U01 — P2 — Champs et listes d'inscription insuffisamment accessibles

`frontend/src/features/public/components/RegistrationFields.tsx:39`, `:129`, `:155` : labels visuels sans association htmlFor/id ni aria-labelledby; liste personnalisée sans contrat combobox/listbox, navigation fléchée, état aria-expanded ni sélection annoncée. Les props du select telles que required/disabled ne sont pas transmises au bouton personnalisé. Les astérisques ne rendent donc pas ce contrôle obligatoire pour le navigateur.

Utiliser les primitives Select accessibles déjà disponibles ou un select natif; IDs stables, erreurs reliées par aria-describedby, focus visible même avec une valeur déjà renseignée, états invalid/disabled/required correctement propagés.

### U02 — P2 — Clavier arabe : modal et cibles tactiles à revoir

Même fichier `:221`, `:242`, `:288` : overlay fait de div, sans rôle dialog, aria-modal, gestion explicite Escape/focus trap/retour de focus; bouton X sans nom accessible. Douze touches sur une ligne à 375 px, avec paddings et gaps, laissent une largeur approximative de 22 px par touche. C'est une estimation à partir du CSS, pas une mesure screenshot.

Réutiliser Modal/Dialog partagé; nommer la fermeture, gérer le focus, proposer clavier système/arabe ou mode défilant adapté aux petits écrans; viser des cibles confortables de 44 px et vérifier à 375/768 px avec zoom et clavier réel.

### U03 — P2 — Page scanner professeur encore branchée sur une simulation inopérante

`frontend/src/features/professor-portal/pages/ProfessorScanner.tsx:28`, `:35`, `:137` : page routée `/professor/scanner` et `/professor/check-in/scanner`, bouton « Simuler Scan », POST `/professor/exam-attendance/scan` sans payload QR. Aucun endpoint correspondant n'a été trouvé dans les routes, alors qu'une autre architecture de scan existe via session/convocation. Le bouton ne constitue pas un scanner de production.

Brancher une seule expérience sur le vrai contrat QR, avec permissions caméra, saisie de secours, validation examen/salle/session, anti-double pointage et feedback accessible. Retirer la simulation de la navigation opérationnelle.

### U04 — P2 — La grille PV laisse très peu de place utile sur mobile

`frontend/src/features/admin/pages/AdminGradesPVPage.tsx:2198`–`:2225` : trois colonnes collantes font au moins 85+75+140 = 300 px avant la première note. Sur un écran de 375 px, elles occupent presque toute la grille. Le scroll horizontal existe, mais ne suffit pas à rendre la saisie confortable.

Prévoir une vue étudiante compacte sur mobile (identité unique épinglée + détails dépliables), une vraie vue tableau desktop, filtre groupe/semestre toujours visible, total sélectionné et états de sauvegarde explicites. Vérifier également exports et RTL avec données longues.

### U05 — P3 — Consolider les composants et la hiérarchie plutôt que multiplier les effets

Des tokens sémantiques et une règle reduced-motion existent déjà dans `frontend/src/index.css` : il faut les conserver. Les composants d'inscription et le PV utilisent encore beaucoup de couleurs hexadécimales, graisses extrêmes et contrôles spécifiques en parallèle des composants partagés. C'est une dette de cohérence, pas une preuve que toutes les pages sont illisibles.

Recommandation de direction : garder l'identité ENCG, surfaces sobres pour le travail quotidien, une couleur d'action principale, statuts accompagnés de texte, échelle typographique commune, tables denses seulement sur desktop. Prioriser lisibilité des erreurs, filtre actif, état vide, chargement, sauvegarde et autorisations avant une refonte décorative. Les suggestions automatiques du skill UI/UX ont servi de checklist; elles ne justifient pas un changement de marque ou de police sans revue visuelle.

## Ordre de travail recommandé

1. Fermer le contournement D01; corriger la perte d'édition D12; bloquer les suppressions de notes D03 et les réaffectations historiques D05.
2. Corriger le champ semestre D06 et l'année des signatures D09; rendre l'envoi de devoir honnête puis persistant D07.
3. Concevoir ensemble offre annuelle, inscription annuelle/semestrielle et affectations D02/D04/D10. Faire une migration additive, backfill vérifié et tests PostgreSQL multiannées avant retrait de l'ancien schéma.
4. Réconcilier identité et répétitions de modalités D08/D11/D13. Les 24 clés répétées ne doivent pas être supprimées automatiquement : comparer poids, notes et usages; les poids hors 100 concernent les mêmes 12 modules mais ne suffisent pas à décider quelle ligne garder.
5. Corriger U01–U04, puis revue visuelle authentifiée par rôle en desktop/mobile/RTL. Traiter la cohérence U05 et les warnings restants par petites tranches.

## Limites et preuves manquantes

Cette passe étend l'audit précédent avec schéma réel, agrégats de cohérence, migrations et chemins secondaires. Elle ne certifie pas chaque endpoint, chaque permission ou toute l'interface. Les tests précédemment passés sont historiques; aucune nouvelle suite complète n'a été exécutée ici et aucun exploit d'écriture n'a été tenté sur les données existantes. Les problèmes de code identifiés doivent recevoir des tests ciblés de non-régression lors de leur correction. Le constat D01 complète et restreint explicitement la portée des protections de version annoncées dans REMEDIATION.md : elles couvrent les chemins corrigés, pas tous les accès directs à la table grades.
