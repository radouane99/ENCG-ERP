# Livraison locale des six améliorations quotidiennes

## Fonctionnalités livrées

1. Comparaison des propositions OCR des pièces courantes avec les données du dossier, visible au titulaire et au service admissions. Aucune correction automatique d’identité.
2. File de travail paginée avec vues par état, responsabilité et retard ; responsable actif, prochaine action, échéance, dernière activité et contrôle de version.
3. Centre des prochaines démarches étudiant, lié aux admissions, validations annuelles, récépissés, documents et stages. Pas de tâche financière pour la formation initiale gratuite.
4. Journal cumulatif des réceptions, rangements et restitutions d’originaux, transitions contrôlées, agent/date et reçu PDF privé. Emplacements et observations internes masqués au candidat.
5. Centre des actions enseignant : modalités, notes manquantes, PV et encadrements/jurys, limité à l’établissement, l’année, les affectations et les groupes. Liens contextualisés et ouverture du stage affecté.
6. Suivi des incidents OCR/envois de campagne et relances ciblées. Requêtes répétées, anciens jobs et callbacks tardifs ne recréent pas une relance déjà enregistrée. Le mode de relance OCR est local.

Guide : [Outils quotidiens utilisateurs](../../operations/OUTILS-QUOTIDIENS-UTILISATEURS.md).

## Validation

| Vérification | Résultat |
|---|---|
| Suite backend complète, explicitement découverte | 436 tests réussis, 1 828 assertions |
| Vérification finale après les derniers ajustements de suivi, jury et jobs | 37 tests ciblés réussis, 318 assertions |
| Tests unitaires frontend | 46 réussis |
| Parcours navigateur admission, préremplissage, QR, renouvellement, calendrier et lauréats | 25 réussis sur desktop/mobile, avec API simulée |
| Vérification finale des nouveaux outils, dont mobile enseignant et lien direct de stage | 8 réussis, avec API simulée |
| TypeScript et production build | Réussis |
| Lint frontend | 0 erreur ; 210 avertissements préexistants |
| Reçu d’original | PDF synthétique rendu, une page A4 et vérification visuelle |
| Intégrité de la copie locale après migration ciblée | 153 tables préexistantes comparées, aucune donnée modifiée ; 1 721 notes conservées |

La suite complète précède les dernières finitions ; la suite ciblée couvre les modifications postérieures. Les deux nombres de tests ne doivent pas être additionnés comme des tests distincts. Même principe pour les parcours navigateur qui se recoupent.

## Migration et préservation

Sauvegarde locale préalable : `backend/storage/app/backups/encg-before-admission-operations-20261024.dump`, 1 841 436 octets.

La revue automatique a refusé l’application générale des migrations. La liste des migrations a ensuite été vérifiée et l’application a été limitée explicitement à `2026_10_24_040000_add_admission_operations.php`, seule migration en attente. Cette application ciblée a réussi. Elle ajoute deux tables et ne réécrit aucune inscription ou note existante.

Les scénarios de test utilisent une base terminée par `_test`, des utilisateurs synthétiques et des files/emails simulés. Aucun mouvement réel d’original, aucune relance réelle et aucune décision académique réelle n’ont été enregistrés pendant la recette.

## Captures de recette

- [Suivi admissions sur mobile](screenshots/admission-operations-mobile.png)
- [Suivi admissions sur desktop](screenshots/admission-operations-desktop.png)
- [Actions enseignant sur mobile](screenshots/professor-actions-mobile.png)
- [Actions enseignant sur desktop](screenshots/professor-actions-desktop.png)
- [Reçu synthétique de restitution](screenshots/original-receipt-synthetic-preview.png)

## Limites explicites

Les modifications sont locales et n’ont pas été déployées dans l’environnement cible. La comparaison avec des documents réels autorisés et la validation institutionnelle de la procédure de garde/restitution restent nécessaires avant une campagne réelle. Les décisions et dossiers historiques en attente de rapprochement humain ne sont pas inventés par ces nouveaux outils. Les autres propositions optionnelles de fréquence des notifications, checklist de préparation de campagne et exercices de restauration ne font pas partie de ces six améliorations.
