# Publication administrative et demandes de changement d'EDT

## Règle demandée

La scolarité publie directement un brouillon complet après contrôle des affectations, salles, capacités, disponibilités et conflits. Aucune confirmation d'enseignant n'est requise. Un ancien état PROPOSED reste publiable pour compatibilité ; il est affiché « À publier ». Les anciens champs de confirmation sont conservés pour l'historique, sans bloquer la publication ni être remplis artificiellement.

Cette règle remplace le parcours de confirmation décrit dans les rapports antérieurs. Aucun planning réel n'est publié automatiquement par cette modification.

## Espace enseignant

La page Emploi du temps affiche les séances actives publiées. Le panneau « Demander un changement » permet de choisir sa séance, le jour et les heures souhaités et un motif obligatoire. Les changements portent sur la grille hebdomadaire, du lundi au vendredi ; la durée et la salle sont conservées. Une demande ponctuelle à une date précise relève d'un autre flux.

La demande est enregistrée en attente ; elle ne modifie pas le planning. Un enseignant ne peut pas demander un changement pour le cours d'un autre enseignant. Les séances d'un CM partagé sont regroupées côté serveur et concernent tous les groupes liés. Une demande en attente empêche un doublon sur la même séance partagée. L'enseignant voit son état et le motif de la décision dans son portail.

## Décision de la scolarité

Menu « Demandes de changement EDT », route `/admin/schedule-change-requests`. L'administration consulte l'ancien et le nouveau créneau, le motif de l'enseignant et saisit un motif de décision.

Lors de l'approbation, une transaction verrouille l'année, la demande, les séances et la salle. Le système vérifie de nouveau :

- le périmètre établissement/année et le statut publié ;
- l'empreinte des séances au dépôt de la demande : refus si elles ont changé entre-temps ;
- les conflits d'enseignant, groupes et salle, y compris réservations et autres plannings ;
- le type et la capacité actuelle de la salle, l'effectif validé et les disponibilités déclarées ;
- la charge quotidienne de l'enseignant et des groupes (plafond enregistré à la génération, 8 h par défaut pour les anciennes versions).

Si le contrôle échoue, les séances et la demande restent inchangées et le motif saisi reste visible dans l'interface. Si le contrôle réussit, toutes les lignes de la séance partagée sont modifiées ensemble, la décision est enregistrée, le changement avant/après est journalisé et des notifications internes sont déposées pour l'enseignant et les étudiants inscrits validés des groupes concernés. Aucun email automatique n'est ajouté à ce parcours.

Un rejet conserve le planning. Une décision déjà enregistrée ne peut pas être réécrite par un second clic.

## Données et compatibilité

Migration additive `2026_10_26_150000_add_timetable_payload_to_schedule_change_requests.php` : lien facultatif vers la séance, contexte/empreinte/proposition JSON, motif et auteur/date de décision. Les demandes relatives aux examens et les rapports de conflit existants sont conservés et continuent leur parcours existant.

Sauvegarde préalable `encg_20261026_013328_36f9f061.dump`, 1250948 octets, SHA-256 `a49ce01510ad57adbd1d07464b2d3ee4aafc2e02b5e0d04d92066d859f23471c`, archive lisible ; aucun nouvel essai de restauration pendant cette intervention.

## Validation

Première suite ciblée : 15 tests, 99 assertions réussis, incluant publication directe, demande sur ses propres cours, refus des doublons et accès tiers, modification de tous les groupes partagés, contrôle des conflits au moment de la décision, rejet et détection des demandes périmées.

Suite ciblée finale : 18 tests, 113 assertions réussis, incluant les notifications aux inscrits, le plafond de charge quotidienne, le refus de publication/génération aux professeurs sur les deux alias API et l'accès de la scolarité. Après durcissement des droits, suite générale : 186 tests, 731 assertions réussis (`direct-publication-rbac-final-20261026.log`).

Navigation Playwright : dix scénarios distincts réussis après relances ciblées des contrôles d'accessibilité et de soumission. Publication depuis DRAFT sans appel à la proposition, refus serveur conservant le motif, succès administratif confirmé, formulaire enseignant préservé en cas d'erreur puis demande en attente, affichage bureau/mobile, accès scolarité et chef de département et appel de présence conservé. Les réponses API des tests navigateur sont synthétiques ; les tests backend utilisent les vrais contrôleurs/actions sur PostgreSQL isolé.

Contrôle de conservation sur la base du projet : MCM reste DRAFT (version 7, 28 lignes inactives), 1721 notes présentes. Aucun changement réel approuvé pendant cette recette.

Les routes des deux alias du moteur ont été déplacées dans le groupe authentifié commun, avec une autorisation administrative au niveau du contrôleur pour toutes ses méthodes. Les professeurs ne peuvent plus exploiter leur ancien accès au groupe général des routes administratives pour générer, publier ou modifier les plannings. Le rôle scolarité a accès à la gestion et à la boîte des demandes, côté interface et API.

TypeScript, lint sans avertissement et build de production réussis. Les anciens rapports restent des relevés historiques ; le présent document décrit le parcours actuel.
