# Corrections des parcours par rôle — avancement vérifié

État au 23 octobre 2026. Travail en cours : ce document ne certifie pas la clôture de l’audit global.

## Vérifications exécutées

- PostgreSQL isolé `encg_roles_remediation_test`, mail simulé et HTTP externe interdit : 22 sondes protectrices réussies sur 23 lors du premier passage. La sonde restante utilisait l’ancien contrat de répartition sans aperçu.
- Sonde de capacité réécrite avec campagne, deux candidats, notes réelles et aperçu : réussite, exactement une affectation pour une capacité de 1. Un commit sans identifiant d’aperçu est refusé (422).
- Test supplémentaire : absence de notes => moyenne nulle, décision `A_VERIFIER`, bascule refusée (422), année et parcours courants conservés ; 6 assertions réussies.
- Frontend : 43 tests unitaires réussis ; TypeScript sans erreur après les corrections du formulaire financier et du parcours stage.
- PDF de convention synthétique généré avec Dompdf, une page A4, inspecté visuellement. Aucun dossier réel utilisé.
- Chromium : deux tests d’injection HTTP 500 réussis, paramètres et validation financière ; correction de la seconde page réellement utilisée sur `/settings`.
- Bibliothèque PostgreSQL : 2 tests réussis, 10 assertions, dont attribution du dernier exemplaire, refus du second emprunt et retour répété sans inflation du stock.

## Corrections de cette reprise

- Demande de stage étudiante reliée à l’Action de convention canonique. Suppression des coordonnées, police d’assurance et visa fictifs ; contexte scolaire fixé par le serveur.
- Action de création : liste explicite de champs autorisés ; les valeurs serveur écrasent les valeurs fournies au navigateur.
- Frontend stage : une seule création, aucune seconde tentative sur une route différente après une erreur, assurance sans valeur inventée, message de soumission en attente et état du visa réel.
- Retrait du BAT local prétendant à un accord d’encadrant et un résultat Turnitin sans preuve enregistrée.
- Progression : suppression du défaut 14,50, des 14 modules inventés et de la récupération de parcours d’autres années ; bilans incomplets bloquent la bascule.
- Régie : formulaire avec montant, référence, mode, compte rendu et confirmation de vérification. Échec serveur => erreur conservant le formulaire. Rappels ciblés sur les factures, via notifications internes.
- Paramètres : échec de changement d’année propagé ; suppression de la simulation de sauvegarde certifiée après un simple délai.
- Convention PDF : suppression du sceau/signature dessinés, assurance et identifiants fictifs, fausse empreinte SHA256 et certification juridique ; état administratif explicite, dates réelles, année du stage, contrôle d’établissement. QR non relié à une preuve supprimé.
- Bibliothèque : attribution étudiant et administration sous verrou du livre puis de l’exemplaire, contrôle d’établissement et doublons ; retour recontrôlé sous verrou pour éviter le double incrément. Test HTTP de réessai ajouté. La concurrence simultanée sur deux connexions reste à vérifier.

## Travail restant avant clôture

Les migrations nouvelles restent à valider sur une restauration de sauvegarde avant application à la base locale. La base métier n’a pas été migrée durant cette reprise.

À poursuivre : cohérence complète des écrans de renouvellement, recours/publication, affectation et conventions ; création de factures et pagination ; routes d’export encore sans action ; disponibilité des salles/enseignants, mobilité et concurrence bibliothèque ; autres faux succès identifiés ; suite complète backend et parcours navigateur réels ; réconciliation historique manuelle documentée dans l’audit initial.
