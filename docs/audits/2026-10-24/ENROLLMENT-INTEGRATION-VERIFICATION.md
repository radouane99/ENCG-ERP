# Vérification admissions / réinscriptions / lauréats

24 octobre 2026 — changements locaux, sans déploiement distant.

Complément ultérieur : le calendrier annuel et l’outil de recette OCR sont maintenant livrés ; consulter [la livraison des recommandations](RECOMMENDATIONS-LIVRAISON.md). Les résultats et limites ci-dessous décrivent le contrôle antérieur.

## Corrections livrées

- Cockpit unique TAFEM/CNAEM avec étapes visibles, contexte campagne/niveau, accès aux anciens étudiants et aux lauréats.
- Nombre de pièces exigées cohérent entre le bouton candidat et le contrôle serveur : quatre pour TAFEM, six pour CNAEM.
- Réinscriptions : retrait des appels vers `initialize-campaign`, des passages affichés par supposition et de la confirmation en présence d’inscriptions contradictoires ou d’un niveau hors cursus.
- Contrôle physique annuel distinct de la confirmation étudiante ; les cursus terminés sont exclus des relances et des validations de réinscription correspondantes.
- Registre des lauréats accessible dans le menu et depuis l’archivage. L’ancien bouton de migration affichant uniquement une notification de succès ouvre maintenant le véritable registre.
- Finalisation réservée aux agents habilités, avec décision annuelle favorable, PV scellé, établissement correspondant et parcours terminal. Les masters de deux ans se terminent en S4 ; le cursus initial ENCG conserve S10, y compris ses spécialités décrites sur deux ans.
- Ajout de `student_graduations` : diplôme conservé par étudiant/formation/année, décision source, agent et date. Une inscription ultérieure dans un autre cursus n’efface pas ce diplôme. Aucun questionnaire professionnel n’est requis pour figurer au registre.
- Les anciennes routes HTTP de bascule rejoignent le service contrôlé. Les codes maîtres statiques sont supprimés des contrôles d’autorisation ; les dates sont requises, et les années acceptent l’affichage avec tiret ou barre oblique côté interface.
- Compteurs d’archives issus des décisions scellées et des diplomations enregistrées. Suppression des ratios forfaitaires de réussite/diplomation et des empreintes blockchain fabriquées. Une absence de preuve reste explicite.
- Interface lauréats : recherche, pagination, confirmation avant clôture, état diplômé sans formulaire de réinscription, erreurs visibles et absence de faux indicateur d’emploi lorsqu’aucun répondant n’existe.

## Vérification backend / frontend

| Vérification | Résultat |
|---|---|
| Suite backend complète, PostgreSQL dédié | 408 tests, 1 572 assertions, succès |
| Recontrôle ciblé final diplomation / garde-fous annuels | 8 tests, 62 assertions, succès |
| Frontend TypeScript | `tsc --noEmit`, succès |
| Frontend unités | 43 tests, succès |
| Navigateur avec API simulée, desktop/mobile | 22 tests, succès |
| Recontrôle après derniers ajustements visuels / menu | 13 tests, succès |
| Navigateur avec vrai backend et base synthétique vierge | 2 tests, succès |
| Build frontend de production | Succès |
| Lint frontend | 0 erreur ; 210 avertissements existants |
| Migration sur clone et comparaison des tables historiques | 150 tables inchangées ; 1 721 notes préservées |
| Base locale réelle après ajout du registre | 1 721 notes ; aucune diplomation créée automatiquement |

Le parcours réel a exercé : connexion candidat, dépôt des quatre pièces, enregistrement, soumission, changement de session vers la scolarité, revue des versions, contrôle physique, numéro officiel, inscription définitive, affectation de section et sous-groupe TD, export CSV, puis consultation mobile. Aucun endpoint de ce test n’a été simulé. Les données et identités étaient synthétiques ; les emails utilisaient le transport de test.

La suite d’interface séparée couvre CNAEM S7, pièces et preuves spécifiques, contrôle annuel, gratuité de la formation initiale, cursus payant, finalisation d’un master et absence de confirmation annuelle pour un lauréat. Elle ne remplace pas un essai réel complet CNAEM en exploitation.

Les environnements PHP de développement sous montage Windows ont nécessité une configuration de test isolée, plusieurs workers et OPcache pour éviter que les requêtes de fond provoquent des expirations artificielles. Les deux tests réels finaux ont été rejoués sur une base synthétique réinitialisée ; leurs résultats ne proviennent pas seulement d’une reprise de dossier déjà validé.

## Conservation des données

Migration additive : `2026_10_24_020000_preserve_program_graduations.php`. Sauvegarde préalable : `backend/storage/app/backups/encg-before-graduations-20261024.dump` (ignorée par Git). Aucune reprise de données ne classe automatiquement les étudiants en diplômés ou redoublants.

La comparaison du clone `encg_admission_hub_20261024_test` avec son empreinte historique retourne `changed_tables: []` sur 150 tables. La base locale réelle conserve ses 1 721 notes et le registre ajouté est initialement vide. Les 72 inscriptions déjà mises en attente de revue restent à rapprocher de leurs décisions réelles.

## Limites et suite conseillée

- Les changements ne sont pas encore déployés sur erp.irsale.fr.
- Les tests d’admission n’attestent pas la précision d’un fournisseur OCR/IA sur des documents réels : une recette avec corpus autorisé reste nécessaire.
- Les notifications de test n’attestent pas la délivrabilité d’emails réels en production.
- Les diplômes historiques sans décision rapprochée ne sont pas inventés ; les statuts historiques restent consultables.
- Une fenêtre de dates propre aux réinscriptions annuelles reste une amélioration conseillée ; actuellement, les contrôles reposent sur l’année non verrouillée et l’inscription pédagogique validée.
- Le service interne historique `AcademicYearRolloverService` est conservé pour compatibilité, mais les routes HTTP ne l’appellent plus. Son retrait définitif peut être traité séparément.

Le fonctionnement détaillé destiné aux agents et étudiants figure dans [le guide A–Z](ENROLLMENT-WORKFLOW-A-Z.md).

Captures vérifiées avec données synthétiques : [cockpit admissions](screenshots/admissions-cockpit-desktop.png), [lauréats desktop](screenshots/laureats-desktop.png), [lauréats mobile](screenshots/laureats-mobile.png).
