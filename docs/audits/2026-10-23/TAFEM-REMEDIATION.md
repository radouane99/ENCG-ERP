# Corrections TAFEM, inscription, IA et documents

23 octobre 2026. Ce document décrit les changements appliqués après `TAFEM-DEEP-SCAN.md`. Le rapport initial et ses sondes rouges restent historiques ; ils ne décrivent plus le parcours corrigé.

## Résultat pratique

Le candidat travaille dans un dossier personnel authentifié : activation contrôlée, brouillon reprenable, pièces privées, préparation d’image, extraction facultative, confirmation des propositions, soumission et suivi des corrections. L’inscription définitive intervient après examen administratif et contrôle physique. La scolarité dispose d’une revue pièce/profil, d’un historique, d’imports prévisualisés, de rendez-vous avec capacité, d’un contrôle QR et d’un journal des notifications.

## Suivi des 22 anomalies

| N° | Correction appliquée |
|---|---|
| 1 | Mutations soumises à session, propriétaire relationnel, campagne et verrou métier ; CNE/CIN ne donnent pas un droit d’écriture. |
| 2 | Consultation limitée au dossier possédé ou à un agent autorisé de l’établissement. |
| 3 | Documents résolus par application_id ; aucun `student_id IS NULL` élargissant le dossier. |
| 4 | Récépissé depuis un dossier existant et soumis, avec son état réel ; suppression du candidat de secours fictif. |
| 5 | Listes/PDF depuis la campagne et les rangs/scores officiels persistés ; aucune valeur de démonstration. |
| 6 | Validation réservée aux agents habilités ; numéro officiel obligatoire, transaction et inscription annuelle idempotente. L’ancien chemin académique ne contourne plus la revue. |
| 7 | Import CSV prévisualisé, erreurs par ligne, normalisation décimale, campagne explicite, empreinte de lot ; protection des propriétaires et inscriptions approuvées. |
| 8 | Activation par contact personnel vérifié et jeton haché à usage unique ; aucun remplacement du mot de passe d’un compte personnel existant. |
| 9 | Compte, brouillon, soumission et inscription définitive distincts ; fin du verrouillage prématuré à la création du compte. |
| 10 | Action transactionnelle, validation métier et version optimiste ; erreurs visibles et conflits 409. |
| 11 | Anciens points d’entrée redirigés vers le workflow commun ou refusés explicitement ; rendez-vous persistants. |
| 12 | Statistiques réelles par campagne ; répartition déterministe avec aperçu et validation persistée. |
| 13 | Liste d’attente ordonnée par rang officiel, capacité contrôlée sous verrou, invitation expirante et journalisée. |
| 14 | Vérification TLS active ; retrait des contenus OCR et réponses fournisseur des logs sensibles. |
| 15 | Dates et notes invalides écartées ; propositions à vérifier, conflits d’identité visibles et confiance inconnue représentée par null. |
| 16 | Jobs persistants, statut consultable, annulation, états terminaux et budgets réels de sous-processus. |
| 17 | Cache OCR identifié par contenu SHA-256, type, version du parseur et propriétaire. |
| 18 | Versions documentaires immuables, une version courante, empreintes, stockage privé et références relationnelles contraintes. |
| 19 | Rapport qualité limité à la campagne et aux documents courants ; rapprochement des identifiants corrigé. |
| 20 | Routes, navigation et contrôles métier alignés ; scolarité autorisée, professeur exclu de la décision d’admission. |
| 21 | Consentement explicite avant extraction, cloud conditionné par l’établissement et le candidat ; saisie manuelle conservée. |
| 22 | États réels et confirmations serveur, erreurs actionnables, champs lisibles et propositions OCR sans faux pourcentage de conformité. |

## Structure cible additive

`applications` porte le propriétaire, la campagne, l’éligibilité, l’état du dossier, le profil déclaré et la version. L’identité académique canonique reste dans les modèles existants ; l’inscription annuelle utilise `student_registrations` après approbation.

`student_documents` conserve chaque version et sa provenance. Les tables `admission_ocr_runs` et `admission_reviews` référencent la même application que la pièce au moyen d’une clé étrangère composite. `admission_events` conserve les transitions ; `admission_activations` les jetons hachés ; `admission_import_batches` les lots ; `admission_slots`, `admission_appointments` et `admission_allocation_plans` les rendez-vous et répartitions ; `admission_notifications` le suivi d’envoi. Le réglage cloud réutilise `institutions.settings` sans nouvelle table de secrets.

La migration `2026_10_23_200000_structure_admission_workflow.php` a été éprouvée sur restauration isolée puis appliquée à la base locale `encg_erp`. Elle conserve les fichiers et les historiques. Un retour arrière destructif automatique est refusé : restaurer la sauvegarde après arrêt des écritures et validation de la procédure dans une base isolée.

## Préservation des données locales

- Sauvegarde avant migration : `backend/storage/app/backups/tafem-remediation-before-20261023.dump`, ignorée par Git.
- 1721 notes avant/après ; empreinte agrégée identique : `28456683e7a8598b343da2fcc70b844c`.
- 7 pièces, 7 fichiers présents et hachés ; stockage privé conservé.
- 2 candidatures reliées à leurs propriétaires ; 4 documents rapprochés sans ambiguïté.
- **3 pièces historiques sans correspondance fiable** restent à vérifier. L’administration doit examiner l’identité puis utiliser le rapprochement manuel motivé. Aucun propriétaire n’a été deviné.

Voir `tafem-source-before.txt`, `tafem-source-after.txt`, `tafem-clone-integrity.txt` et `tafem-runtime-after.json`.

## Vérifications

| Vérification | Résultat et preuve |
|---|---|
| Suite PostgreSQL complète | 346 tests, 1169 assertions, succès : `tafem-backend-postgres.txt`. |
| Derniers ajouts et sondes initiales corrigées | 28 tests, 126 assertions, succès : `tafem-final-focused.txt`. Comprend 15 tests de workflow et 13 sondes d’audit ; ces nombres ne s’ajoutent pas intégralement à la suite complète. |
| Frontend | 43 tests, succès : `tafem-frontend-tests.txt`. TypeScript et build réussis : `tafem-typecheck.txt`, `tafem-build.txt`. |
| Parcours navigateur avec API réelle | Dépôt de quatre pièces synthétiques, brouillon, soumission, quatre revues et inscription définitive : succès, `tafem-browser-live.txt`. |
| Dossiers réels sur téléphone | Lecture candidat/scolarité après approbation, sans débordement horizontal : succès, `tafem-browser-mobile-live.txt`. Captures mobiles inspectées. |
| Régressions navigateur | 18 parcours desktop/mobile sur build : succès, `tafem-browser-regression-production.txt`. API simulée pour ces régressions générales uniquement. |
| FR/AR et labels | 2 contrôles navigateur : succès, `tafem-browser-a11y.txt` ; ce n’est pas un audit WCAG exhaustif. |
| OCR local réel | PDF natif et Tesseract raster synthétiques ; job et résultat persistants vérifiés. |
| Cloud réel synthétique | HTTP 200, CNE/CIN fictifs concordants en 3,68 s : `tafem-cloud-synthetic.json`. Aucun document réel envoyé ; réglage test restauré. |

Le lint passe avec 232 avertissements et zéro erreur ; ce travail ne prétend pas nettoyer tous les avertissements du projet. Une exécution navigateur sur serveur Vite de développement a expiré pendant le chargement ; la même suite sur build passe. Les captures sont synthétiques et les fichiers de preuve ne contiennent aucune clé fournisseur.

Après vérification, les quatre bases temporaires `_test`, les quatre fichiers du parcours navigateur et les helpers temporaires ont été supprimés. Les sept fichiers source ont été explicitement protégés pendant le nettoyage. Le signal de redémarrage gracieux des workers a été envoyé et le contrôle de disponibilité retourne `ready=true`.

## Exploitation

1. Configurer la campagne, sa capacité et ses dates dans « Campagnes & échéances ». Les journées métier sont interprétées dans `Africa/Casablanca`.
2. Prévisualiser le CSV, résoudre les conflits, puis confirmer le lot. Ne pas réimporter pour réinitialiser un étudiant.
3. Vérifier le contact personnel avant de délivrer l’activation. Sur compte existant ou identité ambiguë, procéder au rapprochement humain.
4. Examiner chaque pièce courante ; demander une correction motivée si nécessaire. L’OCR aide la saisie et ne certifie ni l’identité ni l’authenticité.
5. Confirmer les originaux et saisir le numéro officiel avant l’inscription définitive. Ne jamais fabriquer un numéro APOGEE.
6. Configurer les créneaux et leur capacité ; prévisualiser les affectations avant validation. Le QR est un jeton opaque de rendez-vous, pas une preuve de diplôme.
7. Contrôler les notifications échouées et relancer depuis l’interface. Aucun email réel n’a été envoyé pendant nos tests.

Le cloud est désactivé par défaut. Direction/administration peut l’autoriser si clé et modèle sont configurés ; la scolarité consulte ce réglage sans le modifier. Le candidat doit encore accepter chaque traitement. Le service TAFEM utilise sa politique Groq explicite, indépendamment de la valeur historique générale `AI_DRIVER=gemini`. Une panne fournisseur conserve une issue locale/manuelle et ne doit jamais faire approuver automatiquement une pièce.

La maintenance horaire termine les traitements périmés et retire les champs OCR après la durée configurée de 30 jours. Les documents et décisions restent historisés. Définir les durées institutionnelles et les mesures opérationnelles de sauvegarde avant une campagne de production. Les tests synthétiques ne mesurent pas la précision sur un échantillon représentatif de documents réels et ne constituent pas un test de charge.
