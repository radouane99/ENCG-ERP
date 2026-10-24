# Livraison des recommandations — calendrier et recette OCR

## Fonctionnalités appliquées

### Calendrier annuel

Le cockpit `/admin/reinscriptions` permet de publier un calendrier par établissement et année courante : ouverture, clôture, brouillon/publication/fermeture, consignes publiques et version de modification. Les étudiants consultent les dates et consignes dans leur espace annuel.

Le serveur bloque une nouvelle confirmation lorsque la campagne n’est pas configurée, en préparation, future, fermée, expirée ou lorsque l’année est verrouillée. Les dates sont inclusives selon `Africa/Casablanca`. Une confirmation existante reste consultable et idempotente après clôture. Le contrôle physique peut continuer après clôture sur les dossiers déjà confirmés.

Les relances du cockpit exigent une campagne ouverte et conservent les filtres et la limite quotidienne par étudiant. La gratuité initiale TAFEM/CNAEM et les contrôles financiers des cursus payants restent inchangés.

L’ancienne commande `reinscription:ouvrir`, qui pouvait déplacer des parcours et marquer des étudiants « réinscrits », est neutralisée. Sa tâche de juillet et l’ancienne relance à date fixe d’août sont retirées. Le calendrier ne produit aucune décision de passage et ne remplace pas la confirmation étudiante.

### Recette OCR

Dans `/academic/enrollments` → « Campagnes & échéances », les agents habilités peuvent comparer un fichier JSON d’annotations humaines avec des valeurs OCR extraites précédemment.

- Modèle synthétique téléchargeable et attestation préalable.
- Limites serveur : 2 Mo, 500 échantillons, champs et types de pièces autorisés.
- Résultats : champs exacts, absents, différents, écarts critiques et répartitions par type/champ.
- Rapport agrégé téléchargeable, sans valeurs personnelles.
- Aucun fournisseur externe appelé par la comparaison ; aucun fichier d’annotations conservé par l’application.
- Une démonstration synthétique est identifiée comme telle. Le résultat ne constitue pas une validation de document ni une mesure terrain sans corpus réel autorisé.

### Procédures préparées

- [Mode opératoire calendrier et recette OCR](../../operations/REINSCRIPTIONS-ET-RECETTE-OCR.md).
- [Matrice des pièces et preuves à valider par l’établissement](../../operations/MATRICE-PIECES-ET-PREUVES.md).
- [Recommandations suivantes par acteur](RECOMMENDATIONS-ROLEES.md).

## Conservation et activation

La migration `2026_10_24_030000_create_renewal_campaigns.php` ajoute uniquement une table. Elle est appliquée au clone puis à la base locale après sauvegarde `backend/storage/app/backups/encg-before-renewal-calendar-20261024.dump` (ignorée par Git).

La comparaison du clone retrouve 150 tables historiques inchangées et 1 721 notes préservées. La base réelle locale conserve 1 721 notes ; aucun calendrier n’y est publié automatiquement. La scolarité doit saisir et publier les dates réelles. Les 72 dossiers historiques nécessitant une décision ne sont pas régularisés artificiellement.

Les changements restent locaux ; aucun déploiement distant ni email réel n’a été exécuté pour cette recette.

## Vérifications

| Contrôle | Résultat |
|---|---|
| Suite backend complète sur PostgreSQL isolé | 415 tests, 1 624 assertions, succès |
| Recontrôle OCR après renforcement du format JSON | 3 tests, 17 assertions, succès |
| Unités frontend | 43 tests, succès |
| Interfaces desktop/mobile avec API simulée | 19 tests, succès |
| Contrôle visuel OCR après ajustement mobile | 2 tests, succès |
| Parcours réel calendrier / recette / confirmation / contrôle physique | 1 test, succès |
| TypeScript et build | Succès |
| Lint | 0 erreur, 210 avertissements existants |
| Comparaison historique du clone | 150 tables inchangées, 1 721 notes conservées |

- Tests serveur ciblés : dates inclusives, fuseau marocain, échéance, année verrouillée, rôles, version concurrente, idempotence, gratuité, paiement vérifié et absence de mutation par l’ancienne commande.
- Tests OCR : métriques exactes, valeurs absentes/différentes, entrées invalides, autorisations, attestation et absence d’appels externes ou de valeurs personnelles dans la réponse.
- Parcours navigateur réel sur base synthétique dédiée : publication, comparaison OCR, confirmation étudiante, fermeture, contrôle physique après clôture et consultation du récépissé.
- Vérifications TypeScript, unités frontend, lint et build de production.

Captures avec données synthétiques : [calendrier desktop](screenshots/renewal-calendar-desktop.png), [calendrier mobile](screenshots/renewal-calendar-mobile.png), [rapport OCR mobile](screenshots/ocr-evaluation-mobile.png).
