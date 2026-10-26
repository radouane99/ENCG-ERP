# Recette semestre et examens — 26 octobre 2026

## Périmètre et isolation

Recette d'intégration des vrais contrôleurs, services et base PostgreSQL de test `encg_roles_remediation_test`, avec changements de rôle administration/professeur/étudiant. La navigation Playwright utilise des réponses API synthétiques pour vérifier les interfaces et erreurs ; elle ne constitue pas une recette navigateur connectée à des données réelles. Aucun email réel envoyé. La base `encg_erp` a seulement été interrogée en lecture seule pour l'état de préparation.

## Correction trouvée

`ExamConvocationService::resolveStudentsForExam` sélectionnait les inscriptions du groupe et de l'année sans vérifier leur validation. La génération de nouvelles convocations sélectionne maintenant les statuts `academic_validated` et `admin_validated`, cohérents avec les inscriptions et réinscriptions validées de l'application. Les dossiers `pending` et `rejected` sont exclus. Les placements et QR déjà existants sont conservés lors d'une nouvelle tentative : cette correction ne supprime aucune ancienne convocation.

Un test de régression crée les quatre statuts et vérifie exactement les deux candidats attendus. Un second test enchaîne les appels HTTP : création/ouverture de session, création du planning, génération idempotente des placements et QR, publication sur le portail, lecture par l'étudiant, refus du pointage par l'étudiant, pointage par un surveillant, deux visas individuels, clôture du PV, clôture de session et refus de modifier la présence après clôture.

La première passe navigateur a également détecté une régression d'accessibilité dans le panneau de reconduction des affectations : le choix de l'année était un menu personnalisé sans label associé. Le choix devient un sélecteur natif nommé, accessible au clavier et désactivé pendant la requête. Les boutons ont un libellé explicite. Après réponse positive d'application, le panneau affiche le nombre effectivement créé et empêche une seconde application de la même prévisualisation, même si la réponse ne contient pas le drapeau facultatif `applied`.

## Contrôles des étapes

| Étape | Contrôles exécutés |
|---|---|
| Préparation du semestre | Capacités des salles, conflits et indisponibilités, affectations, confirmation enseignant avant publication, protection d'un planning publié |
| Session et planning d'examens | Année/semestre cohérents, période contenant les épreuves, collisions, révision concurrente et reprogrammation motivée |
| Convocations | Inscription validée, stabilité des QR/places, publication explicite indépendante des emails, accès personnel étudiant, export ZIP |
| Surveillance | Pointages non saisis distincts des absences, accès limité aux surveillants affectés, deux visas avant clôture |
| Discipline | Appartenance à l'épreuve, convocation au conseil avant décision, décision non réinscriptible, absence de zéro automatique pour un simple incident |
| Notes et suite du parcours | Calcul normal et rattrapage, scellement et audit du PV, finalisation du diplôme, exclusion des lauréats des réinscriptions |

## État actuel de la base du projet, en lecture seule

- Année courante : 2026-2027, campagne AUTUMN ouverte.
- 21 modules, 6 groupes, aucun couple module/groupe sans affectation selon le service de préparation.
- 12 salles opérationnelles, aucune indisponible.
- Versions d'emploi du temps : 3 DRAFT, 3 EMPTY ; aucune version publiée dans ce bilan.
- 4 sessions d'examens et 21 épreuves ; aucun incident d'examen en attente dans ces sessions.
- 1721 notes présentes.
- 40 anciennes éligibilités de rattrapage sans année : attribution explicite à revoir avec la scolarité, sans déduction automatique risquant de mélanger les promotions. L'interface dédiée au rattachement explicite fait partie des scénarios navigateur vérifiés.

## Résultats

- Suites backend ciblées initiales : 51 tests et 276 assertions réussis.
- Deux scénarios supplémentaires de validation des inscriptions et du parcours HTTP continu : 2 tests et 24 assertions réussis. Total de cette recette backend : 53 tests, 300 assertions.
- Navigation Playwright examens et préparation du semestre : 16 scénarios distincts réussis après correction et relance ciblée de la reconduction (10 examens, 6 semestre). Les deux premières passes ont détecté la sélection sans label puis une prévisualisation interrompue pendant le rechargement du code ; le scénario final vérifie sélection, prévisualisation, application, compte confirmé et bouton désactivé après succès.
- TypeScript : réussi. Lint : aucune erreur ni avertissement après suppression de deux calculs locaux inutilisés dans la page d'affectations. Build de production : réussi. `git diff --check` : réussi.

## Passage à l'exploitation

La suite technique couvre les règles et les contrats d'interface. La validation humaine reste à faire sur les vrais effectifs : compléter les brouillons d'emploi du temps, obtenir les confirmations des enseignants, vérifier les dates et les placements, puis publier explicitement. La lecture QR par téléphone, l'impression papier et la vérification de la version déployée/chargée par les workers restent des essais distincts. Aucun planning réel ni résultat étudiant n'a été publié pendant cette recette.
