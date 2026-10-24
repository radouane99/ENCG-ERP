# Outils quotidiens : admissions, scolarité, étudiant et enseignant

## 1. Rapprochement documentaire

Le dossier candidat et la revue administrative affichent les différences entre les propositions OCR des versions courantes et les valeurs du dossier : Massar/CNE, CIN, prénom, nom, naissance et moyenne du bac. Les accents, la casse, les espaces et les variantes numériques équivalentes sont normalisés pour limiter les faux écarts.

Les pièces remplacées ou retirées sont exclues. Le rapprochement reste un avertissement : il ne modifie jamais une identité, ne déclare pas une fraude et ne décide pas de l’admission. L’agent consulte les sources, fait corriger la déclaration ou demande une pièce lisible, puis utilise la revue administrative existante.

## 2. File de travail de la scolarité

Dans **Admissions & nouvelles inscriptions → Suivi & incidents**, les agents disposent des vues suivantes : tous les dossiers, brouillons/corrections, pièces numériques vérifiées pour le guichet, dossiers affectés à soi et échéances internes dépassées.

La file est paginée par 20 dossiers. Chaque carte présente les pièces manquantes ou rejetées, le nombre de différences documentaires, le responsable, la prochaine action, l’échéance de traitement et la dernière activité enregistrée. « Examiner et organiser » ouvre le même dossier de revue.

Dans le dossier, le suivi permet d’affecter un agent actif du même établissement, de préciser une prochaine action et une échéance. Le numéro de version empêche d’écraser une modification concurrente. La saisie en cours conserve sa version de départ même si une actualisation en arrière-plan récupère une version plus récente ; le serveur demande alors d’actualiser avant de réenregistrer.

## 3. Conservation et restitution des originaux

Le bloc **Conservation des originaux** enregistre les réceptions, changements d’emplacement et restitutions. Chaque mouvement conserve le type de pièce, la date, l’agent, l’observation et, lorsque l’établissement conserve la pièce, son emplacement interne.

Le journal est cumulatif. Une réception ne peut pas être ajoutée deux fois sans restitution intermédiaire ; un déplacement ou une restitution exige une pièce actuellement conservée. Une clé d’opération rend une même requête répétée idempotente. Aucune ligne d’historique n’est effacée par ces actions.

Chaque mouvement possède un reçu PDF privé, accessible au titulaire du dossier et au service autorisé. Les emplacements et observations internes ne sont pas exposés dans le suivi du candidat ni dans son reçu. Les zones de visa restent à signer : aucune signature ni certification d’authenticité n’est inventée.

**L’enregistrement d’un original ne valide pas une inscription.** Les revues de pièces, la liste physique et le numéro APOGEE officiel du parcours existant restent requis.

## 4. Prochaines démarches de l’étudiant

L’accueil étudiant affiche le bloc **Que dois-je faire maintenant ?**, avec les actions issues des données appartenant au compte connecté : dossier d’admission incomplet ou en revue, calendrier et validation annuelle, récépissé existant, document disponible ou demande à consulter, stage/PFE en cours.

Une décision annuelle non rapprochée est présentée comme une validation à suivre auprès de la scolarité ; aucun passage d’année n’est fabriqué. Le diplômé reçoit un accès aux documents de fin de cursus plutôt qu’une invitation à se réinscrire. Les raccourcis vers convocations et documents ne sont proposés qu’aux comptes possédant un dossier étudiant.

Les formations initiales TAFEM/CNAEM restent gratuites ; aucune tâche financière n’est créée par ce centre d’actions.

## 5. Actions de l’enseignant

L’accueil enseignant affiche **Mes actions** pour l’année courante : modalités à vérifier, notes manquantes et PV à examiner dans les modules et groupes affectés. Le lien conserve le module, groupe, semestre, filière et année. Un filtre `group_id` fourni au backend reste appliqué.

Une note de zéro et une absence explicitement enregistrée sont considérées comme une saisie, pas comme une note manquante. Les signatures de PV sont rapprochées dans leur année et leur groupe. Les calculs sont limités aux inscriptions du groupe et de l’établissement.

Les encadrements et jurys actuels disposent d’un lien vers le stage affecté. Une soutenance prévue, passée et affectée au jury est signalée comme évaluation à effectuer ; la validation finale utilise le contrôleur métier et ses autorisations existantes. Un identifiant de stage absent des affectations n’ouvre pas de dialogue de suivi.

Cette vue synthétique est bornée : 50 affectations lues, 30 contextes module/groupe traités, 20 stages et 50 actions affichées. L’interface indique la limitation lorsqu’elle est atteinte.

## 6. Surveillance des traitements

La vue **Suivi & incidents** remonte les extractions OCR échouées ou sans progression depuis dix minutes et les notifications d’admission en échec. Elle consulte au maximum 50 incidents récents par catégorie, dans la campagne et l’établissement sélectionnés, et s’actualise toutes les 30 secondes tant qu’elle est ouverte.

Une relance OCR utilise le mode local et la pièce courante. Une pièce retirée ou remplacée, une campagne fermée ou une autre extraction active empêchent la relance correspondante. L’ancienne tentative reste conservée, marquée relancée ou annulée, et la nouvelle tentative possède son propre identifiant. La prise en charge d’un job OCR nécessite une transition atomique de `queued` vers `processing`.

Les envois échoués sont relancés individuellement après contrôle du statut sous verrou. La tentative historique est conservée comme relancée ; une double requête ne crée pas deux nouveaux envois. Les callbacks tardifs d’un ancien job ne doivent pas rétablir un incident déjà relancé ou un envoi déjà réussi. La relance technique ne vaut pas confirmation d’une remise effective dans la boîte du destinataire.

## API et accès

| Lecture ou action | Endpoint |
|---|---|
| Contexte de rapprochement / originaux / suivi | `GET /api/admissions/workflow/operations/context?application_id=…` |
| File scolarité | `GET /api/admissions/workflow/operations/queue?campaign_id=…&filter=…&page=…` |
| Affectation et prochaine action | `PUT /api/admissions/workflow/operations/work` |
| Mouvement d’original | `POST /api/admissions/workflow/operations/originals` |
| Reçu privé | `GET /api/admissions/workflow/operations/originals/{event}/receipt` |
| Incidents de campagne | `GET /api/admissions/workflow/operations/monitor?campaign_id=…` |
| Relance OCR locale | `POST /api/admissions/workflow/operations/ocr/{run}/retry` |
| Relance d’une notification échouée | `POST /api/admissions/workflow/notifications/{notification}/retry` |
| Actions étudiant | `GET /api/student-portal/actions` |
| Actions enseignant | `GET /api/professor-portal/actions` |

Les écritures et incidents sont réservés au service admissions. Le candidat ne consulte que son propre rapprochement et ses mouvements publics. Les accès aux notes, PV et stages conservent les autorisations métier existantes.

## Installation et limites

La migration additive `2026_10_24_040000_add_admission_operations.php` crée uniquement `admission_work_items` et `admission_original_events`. La copie locale a été sauvegardée avant application ciblée ; la comparaison des 153 tables existantes n’a révélé aucune modification de données, avec 1 721 notes préservées.

Les fonctions sont développées et vérifiées localement. La recette OCR avec de vrais documents autorisés, l’approbation institutionnelle des procédures de garde d’originaux et le déploiement dans l’environnement cible restent des opérations distinctes. Les dossiers historiques sans preuve de décision restent à rapprocher humainement.
