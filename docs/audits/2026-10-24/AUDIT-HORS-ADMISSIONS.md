# Revue ciblée hors admissions — constats et priorités

Périmètre : lecture du code courant des PV, de la délibération, de l’affectation pédagogique et de l’orientation étudiant. Aucune modification fonctionnelle, migration ou notification. Cette revue ciblée ne constitue pas une certification exhaustive du reste de l’ERP ; les constats ci-dessous sont statiques et n’ont pas été reproduits dans un navigateur ou par de nouveaux tests HTTP pendant cette intervention.

## P1 — Orientation : supprimer le repli vers un autre étudiant

`backend/app/Http/Controllers/Api/OrientationAdvisorController.php`, méthode `getStudentProfile` : si aucun étudiant ne correspond au compte connecté, le contrôleur utilise `Student::first()` avant d’appeler l’analyse. Le code peut donc analyser le premier étudiant au lieu du titulaire. Il faut retourner une réponse explicite de profil non lié, conserver le périmètre institutionnel et tester un compte sans fiche et un compte d’une autre institution. Ne pas remplacer cette situation par des données de démonstration.

## P1 — Raccorder le scellé et la signature du PV à leur état serveur

`frontend/src/features/admin/pages/AdminGradesPVPage.tsx` : le bouton signature construit une chaîne aléatoire préfixée `SHA256:`, change des états React et affiche un succès. `handleLockPV` attend, calcule une empreinte sur filière/semestre/type/horodatage, la tronque et active un verrou React. Ces handlers ne persistent pas le scellé ni la signature auprès du serveur. Cela ne démontre pas que tous les contrôles backend sont absents ; cela montre que les succès affichés par ces boutons ne constituent pas une confirmation du circuit serveur.

Le backend dispose déjà d’un circuit de délibération, de signature et de `DeliberationSealService`. Réutiliser ce circuit : identifiant du PV, version, autorisation, état persisté, empreinte du contenu réellement scellé et récupération après rechargement. La fonction d’export transmet actuellement aussi des informations de signature depuis le client : vérifier son articulation avec les signatures persistées, sans conclure ici à une falsification exploitable.

## P1 — Planification du jury : remplacer le succès simulé

Dans cette même page, `handleScheduleDeliberation` attend 1,2 seconde puis annonce une réunion planifiée et des emails envoyés, sans appel réseau dans le handler. Enregistrer une véritable session, contrôler salle/date/jury, puis distinguer « session enregistrée », « notifications en file » et « envoi confirmé ». Ajouter le suivi des échecs et éviter les doubles envois.

## P2 — Remplacer les taux de réussite aléatoires

Le graphique des modules de cette page construit « Taux Réussite » avec `Math.random()`. Calculer les chiffres depuis les décisions/notes du périmètre choisi (année, session, groupe), avec dénominateur et état « données indisponibles ». Les chiffres actuels du graphique ne doivent pas servir au pilotage.

## P2 — Corriger le prétendu partage sécurisé

`handleGenerateShareLink` crée un jeton aléatoire dans le navigateur et l’ajoute à `shared_token`. La recherche du paramètre dans `frontend/src`, `backend/app` et `backend/routes` ne trouve que ce générateur. Aucun consommateur de ce jeton n’a été identifié dans ces périmètres. Soit proposer un lien interne exigeant les droits habituels, soit créer un véritable partage serveur avec portée, expiration, révocation et journal. Ce constat ne signifie pas qu’un lien généré donne actuellement un accès public aux notes.

## P2 — Rendre les suggestions d’affectation pédagogique explicables

`frontend/src/features/academic/pages/AcademicYearSettingsPage.tsx`, `handleAiAutoMatching` : le score est tiré aléatoirement entre 92 et 99 ; la charge est estimée par nombre d’affectations × 4 ; le motif affirme une compatibilité de spécialité/département sans vérification correspondante dans ce calcul. Utiliser les volumes réels CM/TD/TP, les disponibilités, les conflits et compétences renseignées. Afficher les critères effectivement connus et demander une validation humaine des propositions.

## P2 — Distinguer les notes réelles des hypothèses d’orientation

`OrientationAdvisorController` retourne des modules avec une note initiale de 12/20 et choisit une première inscription sans tri explicite d’année. Une valeur hypothétique peut être utile au simulateur, mais doit être présentée comme telle, séparée des notes obtenues. Résoudre l’inscription de l’année pertinente et charger les résultats réels disponibles, sans combler leur absence par une réussite supposée.

## Ordre conseillé

1. Isolation du profil étudiant.
2. Circuit officiel PV : signature, scellé, état persistant et réouverture contrôlée.
3. Planification réelle du jury et notifications traçables.
4. Statistiques et orientation fondées sur les données réelles.
5. Affectations pédagogiques explicables et liens de partage cohérents.

Après correction, vérifier les parcours étudiant/professeur/administration avec tests HTTP de droits et de persistance, puis scénarios navigateur avec rechargement de page et changement d’année/groupe/session.
