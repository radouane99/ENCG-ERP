# Admissions unifiées TAFEM / CNAEM et réinscriptions annuelles

## Organisation livrée

- `/academic/enrollments` est la page canonique des nouvelles admissions et inscriptions. `/admin/tafem` y redirige ; le menu ne présente plus deux files concurrentes pour les mêmes candidats.
- Le poste de travail unique présente les dossiers/revues, l’import officiel avec aperçu, les rendez-vous/entrées, les inscriptions définitives/groupes et les paramètres de campagne.
- Chaque campagne possède une voie d’accès (`tafem` ou `cnaem`) et un semestre d’entrée contrôlé : TAFEM S1, CNAEM S5 ou S7 selon la décision officielle. Une campagne utilisée conserve ce contexte ; aucune déduction à partir du score, du numéro de filière ou du niveau actuel.
- `/admin/reinscriptions` suit les anciens étudiants : décision académique attendue, confirmation étudiante attendue, contrôle physique attendu, dossier finalisé ou rapprochement nécessaire. Un retard ou un dossier incomplet n’est pas un redoublement académique.

## Preuves et intégrité

La validation d’une nouvelle inscription exige les pièces numériques vérifiées, les contrôles physiques positifs et un numéro étudiant officiel. Pour CNAEM, l’attestation d’admission et les relevés du parcours antérieur complètent les pièces communes. Le serveur exige ces preuves, même si le navigateur contourne les boutons. La checklist, l’agent, la décision et sa date sont consultables dans le dossier.

La validation crée le parcours au semestre d’entrée de la campagne et une inscription initiale administrativement validée, sans frais. Les pièces restent liées à leur version documentaire. Une validation répétée ne crée ni second étudiant ni seconde inscription. Une identité déjà liée à un autre étudiant ou une inscription de la même année à un autre niveau/cursus impose un rapprochement.

Le dispatching ne sélectionne que les nouveaux inscrits approuvés de la campagne, sans groupe, dans le niveau configuré. Il respecte la capacité disponible, conserve les affectations existantes et utilise le découpage TD alphabétique existant. Les anciens étudiants et les autres campagnes ne sont pas ajoutés à la file par une recherche globale.

Les exports de campagne utilisent les inscriptions réellement validées : liste avec comptes existants (aucun mot de passe inventé) et ZIP d’attestations à viser. Aucun sceau officiel fictif.

## Anciens étudiants

Le cockpit utilise une seule ligne par étudiant et signale les inscriptions annuelles ambiguës. Recherche, niveau et état sont appliqués aux résultats et à l’export CSV serveur ; export protégé contre les formules CSV.

Le contrôle physique annuel est distinct de la confirmation étudiante : checklist obligatoire, observation, identité de l’agent et horodatage, traitement idempotent. Il ne détermine pas le passage d’année. Les cursus gratuits ne sont pas bloqués financièrement ; les cursus payants conservent le contrôle serveur du règlement.

Les relances nécessitent une action confirmée de l’agent. Elles ciblent les dossiers académiquement validés sans confirmation, selon les filtres ; une seule relance par étudiant/jour. Une notification est enregistrée et un Mailable est mis en file si une adresse existe. Le retour ne prétend pas garantir la réception du courriel. Les dossiers sans décision académique sont exclus.

Les routes et les pages concernées sont accessibles au rôle scolarité sans élargir ses permissions sur le reste de l’administration.

## Correction des données locales

Une logique de préparation automatique pouvait promouvoir un niveau et inscrire `academic_validated` sans décision vérifiée ; elle a été retirée, ainsi que toute mutation lors de la simple lecture du cockpit et les présentations d’admission par défaut.

La comparaison avec la sauvegarde antérieure a identifié un lot de **72 inscriptions annuelles ajouté automatiquement**, alors que les 72 inscriptions préexistantes n’avaient pas été modifiées. Aucun dossier de ce lot n’avait de confirmation étudiante. Après une seconde sauvegarde complète et conservation de l’état initial de chaque ligne, le lot identifié a été placé en attente de décision académique (`pending`), sans suppression, sans modification des parcours ou des notes, avec journal d’intégrité. Ces dossiers ne sont ni déclarés admis ni déclarés redoublants par ce correctif.

Les 55 rapprochements historiques du précédent audit TAFEM restent une revue distincte ; aucun choix arbitraire d’identité n’a été appliqué.

## Migration et vérifications

Migration additive `2026_10_24_010000_structure_admission_entry_and_renewal_review` : voie/niveau d’entrée de campagne, contrôle physique des renouvellements et journal quotidien des relances. Sauvegardes locales ignorées par Git dans `backend/storage/app/backups/` : `admission-hub-before-20261024.dump` et `admission-before-quarantine-20261024.dump`.

Restauration de sauvegarde et essai de migration : **150 tables historiques identiques, 1 721 notes conservées**. La base locale comporte ensuite les différences explicitement documentées ci-dessus (lot automatique conservé en attente et journaux) ; ne pas présenter sa totalité comme identique à la sauvegarde.

- Nouveaux scénarios métier : 8 tests, 64 assertions réussies.
- Régression ciblée admission/gratuité/renouvellement : 34 tests, 307 assertions réussies avant les derniers contrôles complémentaires.
- Frontend : 43 tests unitaires ; TypeScript et build réussis ; lint sans erreur (210 avertissements du projet).
- Chromium desktop/mobile : 19 tests réussis, dont 6 nouveaux parcours de revue physique CNAEM, contexte des groupes et contrôle physique des anciens. API synthétique pour ces tests navigateur ; les tests backend passent par les vraies routes Laravel et PostgreSQL isolé.
- Aucun courriel réel envoyé pendant les vérifications.

Vérification générale finale PostgreSQL, avec les répertoires et fichiers de tests explicitement énumérés : **400 tests réussis, 1 513 assertions, zéro échec** (397,16 secondes). Les 19 scénarios navigateur ont été rejoués au vert après correction des sélecteurs. Le lot local de 72 dossiers a été placé en attente : zéro suppression et 1 721 notes conservées. Le déploiement sur le site distant n’est pas effectué dans cette intervention.