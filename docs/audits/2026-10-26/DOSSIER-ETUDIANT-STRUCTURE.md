# Dossier étudiant structuré

## Interface

Conserver les styles existants : mêmes classes des champs, couleurs, typographie, boutons et cartes. Les ajouts organisent les données dans le formulaire actuel sans introduire un autre thème.

## Sources des données

| Rubrique | Source et modification |
| --- | --- |
| Identité FR/AR, naissance, nationalité, situation familiale | Profil privé du dossier, éditable avant soumission ou après demande de correction |
| CNE/Massar, CNIE officielle, email du compte | Identifiants existants affichés en lecture seule |
| Sexe (Ar) | Dérivé du sexe sélectionné, aucune seconde saisie |
| Résidence FR/AR, pays, région, province, délégation | Profil du dossier |
| Père et mère : noms/prénoms FR/AR, CNIE, métier, téléphone | Profil privé, facultatif ; ne pas découper arbitrairement les anciens noms complets |
| Contact d’urgence | Profil privé ; peut être un tuteur ou une autre personne |
| Bac, série, mention, moyenne, année, lycée, académie | Profil validé ; OCR uniquement comme aide à la saisie |
| Premières inscriptions dans le supérieur et à l’université | Années déclarées ; historique antérieur conditionnel |
| Université actuelle, filière, cycle, mode d’accès, année de campagne | Campagne et établissement ; aucune modification par le candidat |
| Semestre prévu | Campagne ; distinct des semestres effectivement inscrits |
| Date/statut/semestres d’inscription | Inscriptions administratives canoniques ; ne pas considérer la date de création du brouillon comme une inscription validée |
| Année, semestre, filière, cycle, date et statut des réinscriptions | Lignes `student_registrations` du seul étudiant lié au dossier |
| Dates du dossier | Horodatages de l’application |
| Santé et accessibilité | Facultatif, profil privé ; exclu de la synthèse OCR et de la revue finale générale |

## Documents

- TAFEM : BAC, CNIE, relevé de notes et photo restent les pièces obligatoires.
- CNAEM : ajouter l’attestation d’admission et les relevés du parcours antérieur aux pièces obligatoires.
- Admission/admissibilité et diplômes complémentaires disposent de types distincts. Diplôme Bac+2, diplôme antérieur et licence apparaissent selon le parcours antérieur ; aucune licence n’est imposée à un nouveau bachelier.
- Les pièces déjà déposées restent visibles même lorsque le parcours déclaré change.
- Les documents conservent les contrôles existants de propriété, version, format, taille et stockage privé.

## Compatibilité et confidentialité

Les nouveaux champs déclaratifs utilisent `Application.profile`, sans migration destructrice ni duplication dans une nouvelle table étudiant. Les champs inconnus et les données administratives forgées ne sont pas acceptés par la validation de sauvegarde. Les mises à jour partielles préservent les anciens noms complets des parents jusqu’à disponibilité des deux composants.

L’OCR automatique remplit uniquement les champs vides autorisés. Il ne doit pas écraser une saisie déjà présente ni produire des décisions d’inscription. Les identifiants du compte restent administrés séparément.

La configuration de campagne, les frais et la messagerie ne sont pas modifiés par ces ajouts. La formation initiale TAFEM/CNAEM conserve sa gratuité.

## Vérifications locales

- PostgreSQL de test exclusivement : 28 tests `AdmissionWorkflowTest` (272 assertions), puis le test supplémentaire d’historique lié au seul étudiant (4 assertions).
- `UnifiedAdmissionRegistrationTest` et `ReinscriptionWorkflowTest` : 12 tests, 85 assertions.
- Vitest admission : 4 tests réussis ; protection des identifiants officiels et absence de remplacement automatique des saisies.
- Playwright sur API simulée : 11 scénarios distincts réussis, dont saisie du profil étendu, persistance après rechargement, documents conditionnels, OCR, autosave, conflits, QR, français/arabe et mobile. Le scénario mobile a été rejoué après correction du chevauchement entre la navigation et la barre d’actions.
- Les tests navigateur n’impliquent ni création de dossiers réels ni envoi de messages.
