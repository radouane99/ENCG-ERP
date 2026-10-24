# Améliorations utiles par acteur

## Livré dans cette intervention

- Calendrier annuel publié par la scolarité, visible par l’étudiant et contrôlé côté serveur.
- Blocage des nouvelles confirmations hors campagne, avec conservation des récépissés existants.
- Retrait de l’ancien automatisme de promotion/réinscription et de la relance à date fixe.
- Outil de comparaison OCR avec référence humaine, attestation préalable et rapport agrégé.
- Matrice opérationnelle de pièces préparée pour validation institutionnelle.
- Vérification en lecture seule du catalogue local : six filières `grande_ecole`, une de durée déclarée deux ans et cinq de trois ans. Ces valeurs décrivent les composantes du cursus initial ; elles n’ont pas été remplacées par une durée uniforme et le terme global ENCG reste S10.

## Compléments maintenant implémentés localement

- File de travail avec responsable, prochaine action, échéance et dernière activité.
- Centre des prochaines démarches étudiant et actions enseignant, avec liens vers le contexte métier.
- Différences documentaires visibles au candidat et à la scolarité, sans modification automatique des identités.
- Journal de conservation des originaux et reçus privés de réception/restitution.
- Surveillance des incidents OCR et notifications, avec relances ciblées sans double demande.

Mode opératoire : [Outils quotidiens](../../operations/OUTILS-QUOTIDIENS-UTILISATEURS.md).

## Suites optionnelles non implémentées

| Priorité | Acteurs | Proposition | Gain attendu et précaution |
|---|---|---|---|
| P2 | Tous | Étendre les notifications existantes avec préférences de fréquence et résumés regroupés | Réduire le bruit ; garder les alertes urgentes, les journaux d’envoi et les règles de non-duplication |
| P2 | Administration | Ajouter une checklist de préparation de campagne : références, groupes/capacités, programme, documents, année et contacts | Détecter les paramètres manquants avant publication ; ne pas corriger automatiquement des décisions pédagogiques |
| P2 | Administration / direction | Formaliser une recette de déploiement et un exercice périodique de restauration | Vérifier effectivement les sauvegardes et les emails dans l’environnement cible avant une campagne réelle |

Ces propositions complètent les écrans actuels ; elles ne sont pas présentées comme des fonctionnalités déjà implémentées. Les portails disposent déjà de compteurs, de notifications et de modules métier : leur consolidation est préférable à la création de nouveaux circuits concurrents.

## Conditions de recette restantes

La scolarité doit publier les vraies dates et valider la matrice de pièces. La précision réelle OCR dépend d’un corpus autorisé annoté humainement ; les tests synthétiques ne remplacent pas cette recette. Les 72 dossiers historiques en attente de décision restent à rapprocher de preuves réelles.
