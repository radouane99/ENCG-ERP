# Préparation du semestre, emplois du temps et salles

## Accès et parcours opérationnel

1. **Affectations** : `/admin/professor-assignments`. Vérifier les modules, groupes de l'année, enseignants actifs, types CM/TD/TP et heures affectées. Les suggestions comparent les charges déclarées; elles ne certifient pas les obligations individuelles de service.
2. **Reconduction** : choisir une année antérieure, prévisualiser puis appliquer. Les correspondances de groupes doivent être uniques, avec même nom, filière et semestre. Les affectations déjà présentes sont conservées. Les cas ambigus, enseignants inactifs et volumes manquants restent à traiter manuellement. Une répétition ne crée pas de doublon.
3. **Salles** : `/admin/rooms/availability`, avec inventaire dans `/infrastructure/classrooms`. Contrôler capacités, statut de service et réservations. Une réservation annulée ne peut pas être réapprouvée sans nouveau contrôle de disponibilité; une annulation conserve l'historique.
4. **Préparation et campagne** : `/admin/timetable/engine`. Les anciennes routes administratives du planificateur ouvrent ce même écran. Le tableau de préparation indique les affectations manquantes, salles opérationnelles et charges connues. Ouvrir la campagne du semestre configuré.
5. **Génération** : indiquer les semaines d'enseignement prévues, puis générer un brouillon par filière. La génération prend les affectations réelles de la période et les salles enregistrées. Aucune salle ou identité d'enseignant n'est inventée. Un résultat incomplet ne remplace pas le brouillon précédent.
6. **Ajustement** : contrôler la grille et les disponibilités déclarées. Les ajouts restent invisibles aux étudiants. Les conflits de salle, professeur, groupe et capacité sont contrôlés. Une modification concurrente de la grille est rejetée par son empreinte de révision.
7. **Proposition** : rendre le planning disponible aux enseignants. Depuis `/professor/schedule` ou `/professor/schedules`, chacun consulte ses séances proposées et confirme ou signale son indisponibilité. Les confirmations existantes ne sont pas réinitialisées par un nouvel appui sur « Aux profs ».
8. **Publication** : vérifier l'absence de séance non placée, conflit, salle indisponible, affectation incohérente ou confirmation manquante. La publication est transactionnelle et idempotente. Une version publiée ne peut pas être écrasée par régénération, modification manuelle ou ancien endpoint de remise à zéro.
9. **Utilisation** : le professeur consulte ses séances publiées. Le bouton d'appel crée/récupère une session de présence serveur avant d'ouvrir la liste/scanner; il n'utilise plus l'identifiant du créneau comme identifiant de présence.
10. **Documents** : PDF individuels et ZIP réel des ordres de service disponibles dans les affectations. Le ZIP respecte l'année et l'établissement, contient un PDF par enseignant affecté et est limité à 150 enseignants. Les heures inconnues sont signalées, sans valeur forfaitaire inventée.

## Limites explicites de la génération

La génération produit une **semaine type en créneaux de deux heures**, calculée à partir des heures affectées et du nombre de semaines choisi. Les arrondis ne garantissent pas le volume semestriel exact : la scolarité doit adapter les semaines et séances ponctuelles. Les dates officielles restent configurables dans le module existant. Aucun seuil statutaire de charge ni choix d'enseignant n'est déduit arbitrairement.

Les enseignants sans disponibilité renseignée restent à vérifier humainement. Les contraintes de spécialité et obligations individuelles de service restent une responsabilité administrative; la comparaison des heures les aide sans les remplacer.

Les anciens endpoints `ai-scheduler/apply` et `ai-scheduler/clear` exigent maintenant `version_id` et utilisent le cycle sécurisé de campagne. Ils ne peuvent plus déployer un tableau libre ou effacer toute l'année. La réoptimisation des plannings publiés reste une simulation; les écritures passent par les brouillons.

## Vérification des données locales

Contrôle exécuté en transaction PostgreSQL **READ ONLY** avec `tests/Audit/SemesterPlanningReadiness.php` : année 2026–2027, période AUTUMN, 21 modules, 6 groupes, 12 salles opérationnelles, 0 couple module/groupe signalé sans affectation selon les paramètres enregistrés. La campagne est fermée et les six filières n'ont pas de version de campagne publiée par cette livraison. Aucune affectation, campagne ou décision pédagogique réelle n'a été créée automatiquement.

## Validation et éléments restant à recetter

- Suite backend complète : **454 tests, 1 976 assertions réussis**, journal `backend/storage/logs/semester-full-suite-20261025.log`.
- Contrôle ultérieur du parcours HTTP réel professeur, de la révision concurrente et des exports : **8 tests, 55 assertions réussis**, journal `backend/storage/logs/semester-final-api-check.log`. Ce contrôle a révélé puis permis de corriger un import manquant dans l'endpoint de confirmation enseignant.
- Tests de régression dédiés : brouillon privé, confirmations personnelles, publication, capacité, conflit enseignant, révision concurrente, génération par affectations réelles, réapprobation des réservations, ancienne route d'édition, reconduction idempotente et PDF dans le ZIP.
- Tests navigateur avec réponses API synthétiques : préparation desktop/mobile sans débordement, refus de publication expliqué, reconduction prévisualisée/appliquée et confirmation depuis le portail professeur.
- Tests frontend unitaires : 50 réussis. TypeScript et build de production vérifiés. Le lint du projet conserve des avertissements; ils ne sont pas présentés comme corrigés intégralement.
- Captures conservées dans `screenshots/preparation-semestre-desktop.png` et `screenshots/preparation-semestre-mobile.png`.

La recette terrain caméra/QR, les coupures réseau sur plusieurs appareils et le déploiement distant restent distincts des tests automatisés locaux. Aucun déploiement distant n'a été effectué. Des avertissements de dépréciation PHP proviennent des bibliothèques QR tierces pendant le test PDF; aucune modification du vendor n'a été faite.

Après désignation explicite du destinataire par l'utilisateur, un email réel de test a été accepté par Resend le 25 octobre 2026 à 01:15:13 UTC (02:15:13 Casablanca). L'expéditeur configuré est `no-reply@benadadarentcar.com`; le passage à une adresse institutionnelle ENCG nécessite de vérifier son domaine chez le fournisseur. Le test contient uniquement un message technique, sans dossier étudiant/professeur. L'acceptation par le transport ne prouve pas le placement dans la boîte de réception. Le script de test conserve un reçu local et évite de renvoyer le même test.

Comparaison finale de la base source : 155 tables historiques identiques, 1 721 notes conservées. Une ligne supplémentaire existe dans `audit_logs` (analyse de risque d'assiduité par API); le contrôle de l'empreinte des anciennes lignes confirme qu'elles sont toutes conservées sans modification. Le journal d'audit n'a pas été purgé pour faire passer artificiellement la comparaison stricte.
