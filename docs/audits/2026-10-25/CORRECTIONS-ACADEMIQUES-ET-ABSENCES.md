# Livraison locale : fiabilité académique et absences

## Corrections

- Orientation : profil strictement lié à l'utilisateur, inscription de l'année sélectionnée, notes manquantes explicites, aucune recommandation ou statistique de démonstration.
- PV : signatures personnelles enregistrées côté serveur, contexte année/groupe/session, sceau persistant et protection des notes concernées. Réouverture contrôlée et tracée.
- Réunions de jury : salles et agents réels, enregistrement transactionnel, détection des conflits, notifications portail. Aucun courriel n'est annoncé comme envoyé par cette action.
- Statistiques et comparaison des groupes : données des API, sans taux ou effectifs aléatoires.
- Partage : lien interne soumis à authentification et permissions, sans faux jeton public.
- Affectations : suggestions déterministes basées sur les heures connues; conservation des affectations existantes; suppression des volumes et catalogues inventés. Disponibilité et choix pédagogiques restent à vérifier par l'administration.
- Actions non implémentées supprimées : faux ZIP global et reconduction N-1. Les PDF individuels restent disponibles. La préparation des relevés mène au module documentaire au lieu d'annoncer un envoi fictif.
- Notification d'affectation : destinataire officiel enregistré, contrôle établissement/année, aucun destinataire libre ni adresse personnelle de secours; aucun envoi si les affectations ou le PDF manquent.

## Parcours de l'appel

1. L'enseignant ouvre une séance pour son module et son groupe autorisés.
2. Le serveur constitue la liste à partir des inscriptions et parcours de l'année; les absences initiales restent provisoires.
3. L'enseignant renseigne les présences; les statuts retard/excusé déjà enregistrés sont conservés s'ils ne sont pas modifiés.
4. L'appel manuel envoie une liste de lignes avec identifiant étudiant, statut et version. Le scanner demande aussi une confirmation serveur.
5. En cas d'erreur ou de conflit de version, l'interface garde les choix et affiche l'erreur. Un rafraîchissement ne remplace pas les modifications manuelles non enregistrées.
6. La clôture verrouille la séance. Une séance clôturée ne peut plus être modifiée par l'appel courant. Seules les séances finalisées sont comptées dans le suivi étudiant.
7. La scolarité examine le justificatif lié à l'enregistrement exact de présence. Une approbation justifie cette absence; un rejet ultérieur retire cette justification et exige un motif.

## Données et déploiement

Migration additive `2026_10_24_060000_create_deliberation_meetings.php`, appliquée seule. Sauvegarde locale préalable : `backend/storage/app/backups/encg-before-pv-absence-20261025.dump`.

Comparaison avant/après : 156 tables historiques contrôlées, aucune modification de leurs données historiques, 1 721 notes conservées. Les tests PHP utilisent exclusivement `encg_roles_remediation_test`.

## Vérifications

- Suite backend complète : 444 tests, 1 911 assertions réussis (`storage/logs/academic-full-suite-20261025.log`).
- Vérification ciblée ultérieure : 40 tests, 191 assertions réussis (`storage/logs/academic-final-targeted.log`).
- Tests unitaires frontend : 50 tests réussis.
- Dernier contrôle backend après sécurisation des notifications : 12 tests, 60 assertions réussis (`storage/logs/academic-delivery-check.log`).
- TypeScript et build de production réussis. Lint : 0 erreur, 223 avertissements encore présents dans le projet.
- Parcours navigateur relancés sur le dernier build, avec API simulées : appel desktop/mobile, refus serveur sans faux succès, orientation sans profil, sceau persistant et signature personnelle (5 tests réussis, 29 secondes).
- Captures desktop/mobile conservées dans `screenshots/`.

Ces tests navigateur contrôlent les échanges et l'interface avec des réponses synthétiques. Les tests backend vérifient séparément les règles sur PostgreSQL. Une recette terrain avec comptes réels et plusieurs appareils reste nécessaire pour valider caméra, QR et livraison des emails. Aucun email réel n'a été envoyé pendant ces vérifications.

Le sceau exige des décisions de délibération réellement préparées; cette livraison ne crée aucune décision académique ni passage d'année automatique. Aucun déploiement distant n'a été effectué.
