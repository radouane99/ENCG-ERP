# Corrections du deuxième deep scan

Travail local du 23 octobre 2026, sur l'état du dépôt déjà corrigé lors du premier audit. Aucun commit, push ou déploiement distant n'a été effectué par cette intervention.

## Résultat et limite métier

Les défauts de code identifiés dans SECOND-DEEP-SCAN.md ont reçu des corrections backend/frontend et des migrations. Les données historiques ne sont pas supprimées pour faire disparaître les anomalies.

Les **1 721 notes** et **110 évaluations** sont conservées. Le checksum agrégé des notes (ID, étudiant, évaluation, valeur, absence, version, dans l'ordre des IDs) est identique sur la copie de sauvegarde migrée et sur la base locale corrigée : `93297e8d4442a9e998b32a0037e390d8`. Les preuves agrégées sont dans `second-database-after.txt` et `second-database-clone-after.txt`.

La datation de 31 évaluations initialement ambiguës a été résolue à partir d'une seule affectation pédagogique dans les années candidates et de l'inscription annuelle de chaque étudiant noté. Cette migration conserve les évaluations et leurs notes; elle ne déduit pas une année uniquement parce qu'elle est active.

Il reste **52 cas nécessitant une vérification métier** : 48 évaluations historiques appartenant à 24 couples module/type répétés et quatre conflits d'identité (un conflit de date de naissance, un conflit de CIN et deux anciens CIN déjà détenus par un autre compte). Les évaluations concernées sont conservées en révision et exclues des calculs officiels tant qu'elles ne sont pas réconciliées. Les saisir, signer ou réactiver implicitement est bloqué. La scolarité doit vérifier leurs pièces et leur contexte; aucune note ni identité n'a été choisie arbitrairement.

Le tableau de bord administration contient désormais un panneau de réconciliation avec pagination, choix explicite de l'année/type/poids, résolution des identités vérifiées, contrôle des rôles et journalisation. L'étudiant voit un message si ses évaluations historiques sont en vérification. Ce point empêche de prétendre que toutes les données historiques sont déjà certifiées.

## Couverture des constats

| Constat | Correction livrée |
|---|---|
| D01 — grille secondaire | Contrôleur réduit à validation/appel de service. Affectation annuelle et groupe contrôlés, appartenance des étudiants vérifiée, sauvegarde transactionnelle via StoreBulkGradesAction, versions requises, période et signature respectées. GET sans création d'évaluation. Poids configurés respectés; les configurations autres que CC/Exam passent par la saisie par évaluation. |
| D02 — années des notes | academic_year_id sur assessments, portée d'année explicite sur évaluations/signatures, index d'unicité des modalités réconciliées, historique conservé. Contexte temporaire restauré après les calculs historiques. Les Query Builder bruts du portail, des bilans, du moteur et des statistiques sont aussi filtrés. Sélecteur d'année dans les notes étudiant. |
| D03 — suppression des notes | Modalités synchronisées sous transaction/verrou module, IDs validés dans leur contexte, rejet d'une suppression d'évaluation notée et d'une modification après signature. FK PostgreSQL grades→assessments passée à RESTRICT pour protéger aussi les suppressions SQL/cascades indirectes. |
| D04 — inscription | Unicité semestrielle conservée, unicité annuelle contradictoire supprimée. Deux semestres d'une même année peuvent être enregistrés sans perdre les champs pédagogiques. Le dossier administratif annuel n'a pas été déplacé dans une nouvelle table. |
| D05 — groupes/historique | Année/semestre obligatoires, sélection limitée aux pathways courants de ce contexte, traitement sans plafond arbitraire de 50, tri nom/prénom/ID, capacité respectée et sous-groupes délégués au service officiel. Inscriptions anciennes et pathways non courants préservés. FK composites PostgreSQL empêchant une relation vers un groupe de contexte différent. |
| D06 — semestre | Lectures du pathway corrigées en current_semester dans LMS et PV global. |
| D07 — devoirs | Réutilisation des learning_materials de type assignment, avec échéance, barème et taille réelle. lms_submissions persistantes, texte/fichier exigé, fichier privé, auteur étudiant, module/année/publication/échéance vérifiés, doublon rejeté. Liste des travaux pour l'enseignant et téléchargement authentifié. Publication et remise disponibles dans le cours. |
| D08 — identité | users est la source canonique pour les champs d'identité partagés. Setters Student mis en attente puis enregistrés avec le user sous transaction, même sans relation préchargée. Dates typées sur User, recherche CIN canonique. Backfill seulement des champs canoniques absents, sans écraser les conflits ni usurper un CIN déjà détenu. Anciennes colonnes conservées comme données de reprise. |
| D09 — signatures | Année dans la clé de recherche et d'écriture; suppression du défaut historique 1; portée annuelle des lectures. Unicité spécifique des signatures globales avec groupe NULL. Groupe validé dans le contexte module/semestre/année. Verrou module partagé avec les modifications de notes. Vérification publique fondée sur l'année du groupe. |
| D10 — affectations | Ancienne unicité module/professeur remplacée par une clé comportant année, groupe et type de séance, avec traitement du groupe global NULL. |
| D11 — SQL | Unicités partielles année courante/institution et pathway courant/étudiant; CHECK valeurs des notes et poids; FK composites du contexte de groupe. Types d'évaluation conservés en varchar dynamique. |
| D12 — autosave | File fusionnée par étudiant, requêtes sérialisées, versions mises à jour après réponse, lot conservé après échec, retry explicite. Avertissement de fermeture si travail en attente; flush au démontage, instance distincte par module/groupe. Possibilité explicite d'abandonner le buffer et recharger après conflit. |
| D13 — candidature | Transaction candidature/user/student, refus de réaffectation implicite d'un CNE existant, nationalité validée ou indiquée non renseignée. L'inscription publique remplit aussi les noms canoniques. |
| U01 — champs | Select natif avec label associé, ID stable, required/disabled transmis; inputs associés à leurs labels. |
| U02 — clavier arabe | Modal partagé avec rôle dialog, gestion Escape/focus, restauration du focus au démontage, fermeture nommée; touches d'au moins 44 px dans une zone défilante. |
| U03 — scanner | Simulation remplacée par lecture QR caméra si BarcodeDetector est disponible, sinon lecteur/saisie du jeton. Pointage explicite sur API réelle, contrôle de surveillance/salle/examen, vrai token et anti-double pointage transactionnel. Deux anciennes pages réutilisent le même scanner. |
| U04 — PV mobile | Les trois colonnes ne restent plus toutes collantes sur petit écran; l'identité reste visible pendant le défilement des notes. Comportement desktop conservé. |
| U05 — cohérence | Nouveaux contrôles utilisant les tokens sémantiques existants, états de chargement/échec/sauvegarde explicites, composants partagés et suppression des confirmations fictives. Pas de refonte décorative globale non vérifiée. |

## Améliorations complémentaires

- Imports de notes : droits et période contrôlés, transaction/verrou, inscription vérifiée, colonne Version dans les exports, refus d'un import sans version ou périmé. Un import ne crée plus une modalité inconnue arbitrairement. Les modèles Excel anciens doivent être retéléchargés.
- Uploads : l'intercepteur Axios retire le Content-Type JSON pour FormData afin que le navigateur définisse la frontière multipart correcte.
- LMS : aucune réponse IA inventée lorsque le service échoue, aucune réponse vide présentée comme remise de devoir, aucun professeur arbitraire attribué au support, messages récents servis dans l'ordre chronologique.
- Diagnostic SQL : le scanner traite les colonnes d'une FK composite ensemble et dans l'ordre. L'ancien produit cartésien des colonnes annonçait de faux orphelins après l'ajout des contraintes composites. Les nombres de FK ne sont plus codés en dur. Les pondérations sont vérifiées par module/année et les cas en révision sont signalés. Le scanner ne prétend plus certifier « 100 % opérationnel ».
- Reprise : migrations additives, sauvegarde PostgreSQL préalable ignorée par Git, essai réel sur une copie isolée avant application sur la base locale. Les grades ne sont jamais supprimés pour résoudre une collision de modalités.

## Validation

Les résultats finaux sont conservés dans les artefacts suivants :

- `second-backend-postgres.txt` et `second-focused-pg.txt` : suites backend, droits, années, versions, écritures concurrentes, absence de perte de données, devoirs privés, scanner QR et diagnostic des FK composites.
- `second-backend-sqlite.txt` : compatibilité de la suite locale; les vérifications propres au catalogue/FK PostgreSQL restent spécifiques à PostgreSQL.
- `second-frontend-tests.txt`, `second-typecheck.txt`, `second-build.txt`, `second-lint.txt` : tests, TypeScript, compilation et diagnostics visibles.
- `second-playwright.txt` : parcours desktop/mobile et authentification avec API réelle sur une base de test isolée; les parcours mockés restent identifiés comme tels.
- `second-upgrade-clone.txt`, `second-upgrade-local.txt`, `second-database-after.txt` : application des migrations et vérification des données.
- `second-deep-scan-after.txt` : contrôles relationnels et avertissements, sans option --fix.

Les fixtures ont été adaptées pour déclarer une année universitaire valide. Les assertions de comportement antérieures n'ont pas été supprimées. Les nouvelles protections SQL ne sont pas désactivées dans les tests PostgreSQL.

## Limites restantes

1. Les 52 cas historiques sont accessibles à la réconciliation, mais leurs documents doivent être vérifiés par une personne habilitée. C'est un travail de validation des données, pas une suppression de lignes en doublon par script.
2. Les diagnostics de lint restants restent affichés. Leur correction totale et le découpage complet des grandes pages ne sont pas revendiqués.
3. Les colonnes FK signalées sans index par le scanner sont une liste d'investigation, pas une preuve de lenteur ni une instruction de créer tous les index. Une charge et des plans SQL représentatifs restent nécessaires.
4. Les contrôles d'accessibilité automatisés et les parcours navigateur ne constituent pas une certification visuelle exhaustive. La caméra dépend du navigateur et des permissions HTTPS; la saisie du jeton reste disponible.
5. Le fonctionnement hors serveur des sauvegardes et les configurations du serveur distant restent à exploiter dans l'environnement réel. Aucune mise en production distante n'est incluse ici.
