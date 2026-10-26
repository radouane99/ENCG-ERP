# Génération MCM et choix des salles

## Résultat sur la base du projet

À la demande de l'utilisateur, le brouillon MCM a été généré dans la campagne actuelle (2026-2027, Automne) : version 7, état DRAFT, 14 blocs hebdomadaires placés sur 14, soit 28 lignes rattachées aux deux groupes. Aucun bloc non placé. Les contrôles de publication sans exigence de confirmation ne signalent aucun problème. Les confirmations des enseignants et la publication restent à effectuer par l'administration.

Les 64 lignes actives antérieures sont restées actives. Le nouveau brouillon contient zéro ligne active. Les 1721 notes sont conservées. Aucune notification ou email envoyé pour cette génération.

Les groupes MCM ont chacun 12 étudiants avec inscription validée, contre une capacité de groupe de 35. Le CM partagé compte donc 24 étudiants. Les salles retenues sont Salle 101 (40 places), Salle 102 (40), Salle 103 (45) et Salle 105 (45), sans occupation inutile des amphithéâtres ou salles informatiques.

Sauvegarde PostgreSQL préalable : `encg_20261026_004452_ca24a4c4.dump`, 1248792 octets, archive lisible, SHA-256 `db728e80ff17eedd68d2f4f265c26a7ae421e5f5f2c329403427815f6240bd23`. Cette sauvegarde n'a pas fait l'objet d'un nouvel essai de restauration pendant cette intervention.

## Corrections

- L'effectif utilisé est le nombre d'inscrits validés, distincts et rattachés à la même année du groupe. Sans effectif validé disponible, le plafond du groupe reste une estimation conservatrice.
- Les petits CM regroupés peuvent utiliser une salle ordinaire adaptée. Les grands effectifs orientent la recherche vers les amphithéâtres ou grandes salles autorisées ; aucune capacité n'est augmentée artificiellement.
- Les TP et les modules explicitement nommés « informatique » nécessitent un laboratoire. Les salles informatiques restent réservées aux séances qui en ont besoin. Cette reconnaissance ne remplace pas une qualification pédagogique explicite pour les intitulés ambigus.
- Les CM informatiques ne fusionnent pas automatiquement les groupes : deux groupes de 20 peuvent occuper successivement un laboratoire de 30, sans créer une classe de 40 impossible à accueillir.
- Un brouillon de remplacement ne se bloque plus contre les anciennes séances actives sans version de la même filière/année/période. Ces anciennes séances restent conservées jusqu'à publication ; à ce moment seulement, elles sont désactivées et leur remplacement est journalisé. Les autres filières, réservations et autres périodes continuent de bloquer les ressources occupées.
- Les vérifications du tableau, de la proposition et de la publication suivent ce périmètre de remplacement. Le contrôle de publication vérifie également le type de salle et l'effectif regroupé.
- Une filière sans programme ni groupes affiche désormais un diagnostic explicite ; une simulation vide n'est plus présentée comme réussie à 100 %.

## CI et MSI : données indispensables manquantes

L'inventaire en lecture seule confirme zéro module, zéro groupe et zéro affectation pour CI et MSI. Leur emploi du temps réel ne peut pas être généré sans programme, semestre, volumes horaires, enseignants et effectifs/groupes. Aucun module ou professeur fictif n'a été ajouté à leurs données académiques. L'utilisateur a confirmé vouloir leurs emplois du temps, sans fournir ces éléments ni demander de données de démonstration.

## Vérifications

Les tests ciblés vérifient les effectifs validés, les capacités, la réservation des laboratoires, le maintien de l'ancien planning jusqu'à publication et la journalisation du remplacement. Les scripts `TimetableInputsInventory`, `TimetableGenerationDiagnosis` et `VerifyRequestedTimetableDraft` effectuent des lectures seules. Le script d'application est limité explicitement à MCM sur `encg_erp` et nécessite `APPLY_MCM_DRAFT=1`.

Première passe après correction : 11 tests, 71 assertions réussis. La simulation de remplacement place aussi tous les blocs de GFC (14/14) et TC (16/16), sans régénérer leurs brouillons réels.

Suite générale Pest après corrections : 186 tests, 731 assertions réussis (`timetable-rooms-final-20261026.log`).

Deux contrôles supplémentaires réussis : 2 tests, 12 assertions pour la séparation des groupes informatiques et le diagnostic des filières vides. Total des contrôles ciblés de cette intervention : 13 tests, 83 assertions.
