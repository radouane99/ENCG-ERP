# Suivi opérationnel, notifications et sauvegardes

## Utilisation

Dans `/dashboard`, la scolarité et la direction disposent de **Mon travail à suivre**. Les centres d’actions étudiant et professeur déjà présents sont conservés; le nouveau suivi des échéances complète les demandes étudiantes sans recopier leurs listes de tâches académiques.

- **Demandes** : jusqu’à 50 demandes prioritaires, celles en cours en premier puis les échéances les plus proches. Le compteur global des demandes échues ne se limite pas aux 50 lignes affichées. L’agent habilité peut affecter un responsable actif du même établissement, fixer ou retirer une échéance, avec motif obligatoire. Une version protège contre les écritures simultanées. Une demande traitée ne se réaffecte pas par ce formulaire. Le suivi ne valide aucun document et ne modifie aucune décision académique.
- **Étudiant** : sa liste affiche ses propres demandes et leurs échéances, sans les outils de gestion ni les données d’un autre étudiant. Les workflows des documents enseignants restent gérés par leur espace existant.
- **Rappels** : `documents:remind-followups` est planifié chaque heure. Il notifie uniquement dans le portail le responsable habilité d’une demande échue encore ouverte, au plus une fois par 24 heures. Les demandes traitées ne sont plus relancées. Aucun email collectif n’est déclenché par cette commande.
- **Notifications** : le panneau administratif distingue la lecture dans le portail des statuts enregistrés par le transport. Il ne diffuse pas les notifications de sécurité dans le suivi général. Les 30 derniers événements et journaux sont limités à l’établissement. La page personnelle `/notifications` permet maintenant de parcourir les pages suivantes et signale les erreurs HTTP au lieu de présenter un faux historique vide.
- **Nouvelle tentative email** : pour les demandes étudiantes dont l’envoi a échoué, le centre propose une nouvelle tentative explicite avec le modèle existant. L’envoi est limité à l’établissement et aux agents habilités. Un verrou empêche deux tentatives simultanées et un succès identique récent est réutilisé pendant deux minutes. Cette protection ne constitue pas une garantie absolue de livraison unique en cas de réponse ambiguë du fournisseur. Une acceptation du transport n’est pas une preuve de réception ou lecture d’email. Les convocations et autres types de messages conservent leurs parcours existants.
- **Qualité** : détection des CNE absents, des CNE potentiellement identiques après normalisation, des inscriptions validées sans groupe et des modules des filières inscrites sans affectation annuelle. Ces derniers nécessitent une vérification du programme et du semestre; le compteur n’est pas une décision automatique. Des exemples et liens ouvrent les dossiers existants. Aucune fusion, suppression ou correction d’identité automatique.

## Conservation des données

La migration `2026_10_25_140000_create_operational_request_followups.php` crée une table indépendante, reliée aux demandes et aux comptes. Elle a été appliquée par chemin explicite après sauvegarde. Les responsables, échéances et numéros de version ne sont plus dépendants du contenu des notes administratives du document. Les modifications sont auditées avec acteur, motif et états précédent/suivant.

Les tests destructifs restent limités à `encg_roles_remediation_test`; ils utilisent des identités synthétiques et un transport mail simulé.

## Sauvegarde et restauration

`db:backup-daily` produit une archive PostgreSQL custom dans `storage/app/private/database-backups`, avec SHA-256, date, taille et contrôle de lisibilité par `pg_restore --list`. La commande ne recopie plus de SQL à la racine du backend. La rotation concerne uniquement les archives de ce nouveau répertoire dont le nom respecte le format généré : 30 jours, en conservant toujours la dernière archive effectivement restaurée. Avant la première restauration réussie, aucune archive de ce répertoire n’est purgée. Les anciennes sauvegardes d’autres répertoires ne sont pas supprimées.

La tâche quotidienne existante reste à 02:00, avec protection contre le chevauchement. Le scheduler doit fonctionner pour l’exécution automatique; le service de production est déjà déclaré dans Compose. Aucun service de production n’a été démarré ou déployé pendant ces essais. La conservation hors de la machine hôte reste un point d’exploitation à organiser.

`db:verify-restore <archive> <nouvelle_base_restore_test>` vérifie l’empreinte, crée une nouvelle base puis restaure dans une transaction avec arrêt sur erreur. La commande refuse une base existante et n’exécute ni DROP DATABASE ni remplacement de la base source. Le réglage de session `transaction_timeout=0`, émis par le client récent mais inconnu de PostgreSQL 16, est omis lors de la restauration SQL; schéma et données restent inchangés. Les fichiers SQL temporaires sont privés et supprimés après l’essai.

Une restauration réelle a réussi depuis `encg_20261025_193935_4a2d9cd2.dump` vers `encg_operations_v2_20261025_restore_test`, avec **1 721 notes restaurées**. Une première base d’essai créée avant le correctif de compatibilité est conservée; aucune base n’a été effacée. Une deuxième archive, postérieure à la migration, est `encg_20261025_195122_bd3140ea.dump`.

## Vérifications

Résultats initiaux : 8 tests backend / 37 assertions et 5 tests navigateur réussis (API navigateur synthétiques), dont présentation desktop/mobile, refus de modification, accès étudiant et pagination des notifications. Les tests backend exercent les permissions, les versions, les rappels dédupliqués, les envois simulés et le refus de restauration vers la base source.

Dernière passe : **19 tests backend réussis, 91 assertions**, couvrant le nouveau suivi et les régressions des demandes, notifications et centres d’actions existants. **6 tests navigateur réussis** sur le build de production, dont refus et succès de la nouvelle tentative email. TypeScript, lint et build de production réussis; lint sur 505 fichiers sans erreur ni avertissement.

La seconde archive a été restaurée avec succès dans `encg_operations_final_20261025_restore_test`, avec **1 721 notes restaurées**. La comparaison en lecture seule de la base source sur les anciennes colonnes de **157 tables** ne relève aucune modification des données préexistantes. Le script d’audit a également été corrigé pour résoudre explicitement le Kernel avant les imports du fichier.

Captures : `screenshots/operational-workspace-desktop.png` et `screenshots/operational-workspace-mobile.png`. Les scénarios navigateur utilisent des réponses synthétiques; les deux restaurations et les tests HTTP backend ont été exécutés réellement, ces derniers sur la base de test dédiée. Aucun email réel n’a été envoyé et l’expéditeur Resend reste inchangé.

## Recette

1. Ouvrir le dashboard en scolarité, affecter une demande de test et vérifier son échéance depuis le compte étudiant concerné.
2. Tester deux modifications concurrentes : la seconde avec une ancienne version doit être refusée.
3. Sur une instance de recette, faire expirer l’échéance; exécuter le rappel deux fois. Un seul rappel doit apparaître. Traiter ensuite la demande : elle ne doit plus être relancée.
4. Avec un transport de test contrôlé, simuler un échec puis utiliser la nouvelle tentative. Vérifier le destinataire, l’historique et l’absence de second envoi immédiat.
5. Vérifier les anomalies de données à partir des dossiers officiels avant correction. Une anomalie présumée ne justifie pas une fusion de personnes.
6. Contrôler le scheduler et la copie hors machine dans l’environnement cible. La réussite d’une restauration locale ne valide pas à elle seule le plan de reprise complet.
