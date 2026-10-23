# Clôture des corrections des parcours par rôle — 23 octobre 2026

Ce rapport couvre les 21 anomalies de ROLE-JOURNEYS-DEEP-SCAN.md et les compléments corrigés pendant la reprise. Il décrit des corrections vérifiées localement ; il ne constitue pas une certification de tous les modules historiques de l’ERP.

## Matrice de correction

| Référence | Correction livrée |
|---|---|
| A01 | Attribution des rôles et modification des comptes bornées par les droits de l’opérateur ; auto-élévation interdite. |
| A02–A04 | Stages filtrés par établissement, propriétaire, encadrant et jury ; écritures et évaluations contrôlées côté serveur. |
| A05 | Recours et rectification bloqués sur PV visé ; réouverture motivée avec archive du visa et journal de correction. |
| A06–A08 | Réinscription liée à une inscription annuelle validée et au solde serveur ; paiement navigateur refusé ; confirmation idempotente sans promotion répétée. |
| A09 | Suppression des moyennes et admissions inventées ; bilan incomplet signalé et bascule bloquée. |
| A10–A12 | Publication et période de recours réelles ; cohérence étudiant/module/évaluation ; correction réservée à une note existante. |
| A13–A14 | Convention initialement en attente, assurance vérifiée explicitement, accord entreprise par lien temporaire à usage unique ; annulation invalide le lien. |
| A15 | Identifiants User/Professor corrigés ; notes de disponibilité persistées et créneaux imbriqués traités sans erreur. |
| A16–A17 | Mérite calculé sur les notes réelles ; campagne, quotas, aperçu obligatoire et contrôle des changements avant affectation. |
| A18 | Routes sans action traitées : actions utilisées implémentées, déclarations inutilisées retirées ; vérification par réflexion de toutes les actions routées (1 159 routes, 128 contrôleurs, aucune action manquante). |
| A19 | Recherche et modifications des comptes compatibles avec leurs identifiants réels et leurs permissions. |
| A20 | Paramètres reliés à l’établissement réel ; règles académiques canoniques 6/10 ; test de messagerie avec Mailable et résultat de transport explicite. |
| A21 | Régie opérationnelle : factures, règlements partiels vérifiés, références idempotentes, soldes, filtres, pagination et rappels internes. |

## Parcours et interfaces

- Régie : création de facture sur inscription existante, vérification du reçu, enregistrement du règlement, suivi des soldes et rappels.
- Étudiant : renouvellement en trois étapes, blocage expliqué, choix de spécialités ordonnés, mobilité avec trois préférences ordonnées et sauvegardées. Suppression des probabilités de sélection inventées et des champs de dossier non enregistrés.
- Stages et PFE : demande étudiante, messagerie persistée, pièces privées, revue des documents, convention et accord entreprise, encadrant, planification de soutenance et évaluation par jury autorisé. Le rapport final doit être approuvé avant planification.
- Professeur : présence sur séance et groupe réels, QR généré localement, enregistrement atomique, clôture idempotente ; conservation hors ligne explicitement signalée et isolée par compte/établissement.
- Surveillance : affectation par identifiant utilisateur exact, aucune surveillance fictive, liste de salle réelle, états de présence enregistrés, visa contrôlé et empreinte des données ; réessai stable et modification d’un PV visé refusée.
- Administration : recours paginés, campagnes d’affectation avec aperçu, paramètres réels et calendrier sans faux succès après une erreur serveur.
- Exports : ZIP réels, attestations fondées sur une inscription administrative validée et marquées « à viser », notes publiées jointes au courriel avec l’année réelle. Aucun faux QR ni signature dessinée sur les documents corrigés.
- Bibliothèque : dernier exemplaire verrouillé sur les deux parcours, retour idempotent, catalogue et emprunts bornés à l’établissement ; lectures sans seeding ni réécriture du catalogue ; administration réservée aux rôles habilités.

Les interfaces refaites utilisent les composants partagés, des états de chargement/erreur/vide, des formulaires conservés en cas d’échec, des tableaux défilants et des mises en page mobiles. Contrôle visuel de captures Chromium sur régie, renouvellement et préférences ; aucune image décorative supplémentaire nécessaire.

## Données et migrations

Sauvegarde complète locale conservée dans `backend/storage/app/backups/roles-completion-before-20261023.dump` (fichier ignoré par Git). Restauration de contrôle dans `encg_roles_restore_20261023_test`, puis application locale des migrations 230000, 230100, 230200 et 230300 après essai sur la restauration.

Ajouts : publications de notes, archives de visas, campagnes d’affectation, renouvellements, factures/paiements, contexte annuel de mobilité, correspondance de stage et demandes de conflits structurées. Les choix historiques sans année restent sans année ; aucune attribution historique devinée.

Vérification source après migration : **142 tables historiques contrôlées, aucune modification des anciennes colonnes/lignes, 1 721 notes conservées**. Le vérificateur compare les empreintes des colonnes existant avant migration, sans exposer les données personnelles. Les nouvelles colonnes et tables restent additives.
Une vérification ultérieure pendant l’utilisation de l’application retrouve uniquement une connexion utilisateur dans les différences historiques : `last_login_at`, `last_login_ip`, `updated_at` d’un compte et de nouvelles lignes de journaux (`activity_log` et `audit_logs`). Aucun compte ajouté, aucune note modifiée. La restauration isolée reste identique à la sauvegarde sur les 142 tables contrôlées. Ces traces de connexion ont été conservées, sans réinitialiser la référence ni écraser l’activité de l’utilisateur.

## Vérifications

- Dernière suite complète PostgreSQL après corrections et stabilisation du test horaire : **384 tests, 1 325 assertions réussies**, 429,20 secondes, zéro échec. Première passe précédente : 381 tests / 1 296 assertions.
- Parcours HTTP complémentaires : facture → paiement → réinscription, publication → recours → réouverture → correction, présence atomique, mobilité avant pagination, stage → accord entreprise → document → soutenance, paramètres et mails simulés.
- Régressions documentaires et bibliothèque : attestation sans inscription refusée, PDF réel après validation, notes non publiées exclues de la diffusion, pièce jointe réelle, catalogue vide sans écriture et gestion des prêts interdite au professeur.
- Régression surveillance : **14 assertions réussies**, incluant refus d’un autre enseignant, liste exacte de salle et immutabilité du visa.
- Bibliothèque, deux processus PostgreSQL simultanés sur le même dernier exemplaire : **2 connexions en attente du verrou, réponses 201/422, un emprunt, stock restant 0**.
- Frontend : **43 tests unitaires réussis** ; TypeScript et compilation Vite contrôlés ; lint sans erreur, 210 avertissements restants dans le projet.
- Chromium sur version compilée : **9 tests réussis**, dont formulaires régie desktop/mobile, blocage réinscription desktop/mobile, préférences desktop/mobile, aperçu d’affectation et deux injections de panne HTTP 500.
- Les tests navigateur de ce lot utilisent une API simulée pour les contrats et les erreurs ; les parcours backend utilisent réellement les routes Laravel et PostgreSQL isolé. Aucun paiement ni courriel réel envoyé pendant ces tests.

## Limites opérationnelles à connaître

Les 55 cas historiques signalés dans l’audit TAFEM nécessitent toujours une décision humaine de rapprochement ; aucune correction automatique arbitraire. La vérification d’un reçu financier reste une opération de régie, sans intégration bancaire ajoutée. Un visa applicatif ne prétend pas être une signature électronique qualifiée. La réception finale des courriels dépend du fournisseur réel.

La mobilité produit un classement et des propositions ; la décision définitive et les justificatifs complémentaires restent au service compétent. Une modification d’examen doit être effectuée dans la planification avec contrôle des conflits avant clôture de la demande d’horaire. La planification des soutenances vérifie les collisions entre soutenances pour la salle et le jury ; la confrontation avec tous les autres types d’occupation du campus reste à étendre.

Ces limites sont explicites dans les flux concernés. Les corrections ne permettent pas de déclarer tout l’ERP sans défaut, ni de certifier les modules historiques qui n’ont pas été rejoués dans cet audit.

Le test de pointage des rendez-vous TAFEM fixe désormais son horloge à 10 h pour éviter un faux échec lorsque le créneau créé « dans une heure » passe au jour suivant. La restriction de pointage au jour du rendez-vous demeure inchangée.
