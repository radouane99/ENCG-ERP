# Livraison locale — parcours d’admission pratique

Les six améliorations demandées sont présentes dans le parcours : sauvegarde automatique et reprise serveur, revue finale avant dépôt, avertissements qualité d’image avant OCR, correction ciblée conservant les pièces vérifiées, organisation du guichet avec prise en charge exclusive, et parcours candidat responsive avec français/arabe et RTL.

## Vérifications

- Backend : 35 tests admissions/opérations, 316 assertions, réussis. Ensuite, le test de correction a été renforcé : 1 test, 17 assertions, réussi (revue de plusieurs pièces, refus de retrait/remplacement d’une pièce validée, refus de resoumission avec une pièce rejetée, conservation de l’historique).
- Frontend : 48 tests unitaires réussis, notamment OCR et avertissements de qualité d’image.
- Playwright : 20 scénarios réussis sur la version compilée : guichet desktop/mobile, affectation et originaux, relances OCR/envois, actions enseignant, QR authentifié, préremplissage respectant la saisie, sauvegarde lente et reprise, conflit de version, revue FR/AR desktop/mobile, confirmation visuelle d’image signalée, conservation des pièces validées.
- Compilation production réussie. TypeScript et lint vérifiés ; le lint existant comprend des avertissements sans erreur.
- Les scénarios navigateur utilisent des données et réponses synthétiques. Les tests Laravel exécutent les règles et routes réelles sur PostgreSQL dédié `encg_roles_remediation_test`. Ils ne constituent pas une recette terrain complète ni une mesure de précision OCR sur le corpus réel de l’établissement.

Un défaut d’affichage sur réponse guichet incomplète a été corrigé et les anciens scénarios de préremplissage adaptés à la persistance du brouillon. Le centre des actions a été réintégré dans le tableau de bord enseignant courant.

## Base locale

Seule la migration additive `2026_10_24_050000_create_admission_desk_tickets.php` a été appliquée, par chemin explicite. Elle ajoute les passages, leur numéro par campagne/journée, état, agent, horodatages et version. Elle ne recalcule aucun résultat académique.

Sauvegarde préalable : `backend/storage/app/backups/encg-before-admission-desk-20261024.dump` (1 209 737 octets). Capture puis comparaison en lecture seule : **155 tables précédentes inchangées, 1 721 notes conservées**. Le fichier de référence local est `backend/storage/app/before-desk-20261024.json`.

Les arrivées sont idempotentes ; les numéros sont sérialisés par verrou de campagne. Les prises en charge verrouillent le dossier et l’agent, et les transitions vérifient la version. La revue des pièces, la décision et les mouvements d’originaux refusent les écritures d’un autre agent pendant une prise en charge active. Un responsable peut libérer le passage d’un agent absent avec motif obligatoire et trace dans le journal. Les passages actifs d’un jour précédent restent visibles.

## Utilisation et limites

Voir `docs/operations/ADMISSION-PARCOURS-PRATIQUE.md` pour le parcours de campagne jusqu’à l’inscription définitive, les corrections, les originaux et la répétition avant recette réelle. Le service garde la décision finale et renseigne le numéro APOGÉE officiel ; aucun OCR, reçu, numéro de passage ou mouvement d’original ne valide automatiquement une inscription.

Les avertissements d’image sont des heuristiques locales, complétées par le contrôle visuel de l’utilisateur. La sauvegarde conserve côté serveur seulement les modifications confirmées : une saisie non transmise peut être perdue si l’utilisateur ferme malgré l’avertissement. Les erreurs détaillées du serveur et certaines informations historiques restent en français ; les commandes et formulaires principaux du candidat proposent l’arabe et le RTL.

Le numéro de passage est privé au candidat et à la scolarité ; aucun écran public ou annonce sonore n’est créé. Une clôture ou annulation conserve le passage du jour pour éviter sa duplication. Un nouveau passage est possible le jour suivant ; une seconde visite le même jour se traite en consultant ce passage conservé.

Travail local : **aucun déploiement sur erp.irsale.fr et aucun envoi réel de notifications effectué pour cette livraison**. La recette terrain avec des documents autorisés, un téléphone et deux postes de scolarité reste à exécuter.
