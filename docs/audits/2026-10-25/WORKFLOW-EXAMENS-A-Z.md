# Workflow des examens — contrôle et corrections

## Parcours opérationnel

1. **Préparer la session — `/exams`.** Choisir une année, un semestre réel de cette année, le type de session et des dates cohérentes. Activer la session. L'activation ne désactive que les autres sessions de la même année et du même établissement. Une session contenant des épreuves ne se supprime plus en cascade.
2. **Planifier — `/admin/exams?session_id=…`.** Le cockpit affiche les épreuves sans salle, sans placement ou sans surveillance. La génération utilise les inscriptions du semestre et de l'année, les salles opérationnelles et les enseignants réellement disponibles. Un manque de capacité, de candidats ou de surveillants annule la transaction entière. Les chevauchements entre salles, candidats et surveillants sont contrôlés; les indisponibilités déclarées sont utilisées.
3. **Ajuster une épreuve — `/admin/exams/{id}/edit`.** Le formulaire enregistre maintenant réellement la date, le créneau et la salle. Le backend contrôle la période, les conflits, la capacité et une empreinte de révision. Un planning diffusé, confirmé, émargé ou verrouillé est protégé. Le contexte session/module/groupe reste conservé.
4. **Préparer et diffuser les convocations — `/admin/convocations?session_id=…`.** Les QR et numéros de place existants restent stables lors d'une nouvelle demande de génération. Une convocation ordinaire ne sélectionne plus les étudiants d'autres groupes ou années. Les données de placement alimentent les deux anciens points d'entrée sans supprimer de table. La publication portail et l'acceptation d'un email sont deux événements distincts. Le portail étudiant masque les convocations non diffusées; le téléchargement vérifie le propriétaire et la session demandée.
5. **Superviser — `/admin/exams/sessions/{sessionId}/live`.** Le dashboard global est maintenant routé et ses champs correspondent à ceux du backend. « À pointer » est distinct d'une absence enregistrée. Les totaux représentent des convocations par épreuve, pas forcément des personnes distinctes. La surveillance d'une épreuve conserve la présence réelle; un signalement ne rend pas automatiquement le candidat présent. Un refus serveur ne déclenche aucun succès local.
6. **Traiter un incident — `/discipline`.** Le candidat doit appartenir au placement de l'épreuve. Un signalement crée un dossier en attente sans note zéro automatique et sans dossier général dupliqué. Enregistrer date/lieu de convocation, réaliser l'audition puis saisir les observations et la décision. Une décision ne peut pas être prise avant l'audition ni remplacée silencieusement après enregistrement. Les votes renseignés sont conservés dans la trace d'audit; aucun quorum fictif n'est prérempli. Une annulation de note vise les évaluations de l'année et du contexte concernés; une cible absente ou ambiguë est refusée. Les visas, PV et résultats verrouillés sont respectés.
7. **Viser puis clôturer le PV de salle.** Chaque surveillant signe depuis son propre compte. Le second surveillant peut viser les mêmes pointages après le premier; il ne peut pas les modifier. Le verrouillage exige une épreuve terminée, tous les pointages et tous les visas. Il enregistre une empreinte SHA-256 persistante. Les anciens scellés restent lisibles. Les anciens chemins d'émargement respectent les mêmes verrous.
8. **Saisir les notes et délibérer.** Ouvrir explicitement la phase de saisie appropriée. Le changement de phase ne lance plus une délibération globale implicite. Les mécanismes existants de verrouillage des notes, de jury, de signature et de scellé restent utilisés. Un incident en attente ou classé sans suite ne force plus une note zéro. Les seuils pédagogiques restent ceux du moteur canonique LMD.
9. **Organiser le rattrapage.** Les droits sont désormais annuels. La génération convoque seulement les étudiants inscrits et éligibles pour l'année choisie. Une réévaluation automatique ne remplace pas une décision administrative documentée. Les anciennes lignes sans année sont conservées pour réconciliation, sans être interprétées comme une autorisation valable pour toute année. Un panneau dans la page de rattrapage permet de choisir explicitement leur année et de saisir la référence justificative; un droit déjà présent n'est jamais fusionné ou remplacé automatiquement.
10. **Publier, traiter les recours et archiver.** La publication et les recours utilisent les endpoints existants; l'audit vérifie notamment les délais, les évaluations ciblées et le respect des PV signés. Clôturer la session après les PV et le traitement des incidents. Une réouverture est explicite et tracée. Les décisions de progression et de diplomation restent prises dans les workflows académiques existants, jamais à partir d'un simple clic de verrouillage des examens.

## Documents et notifications

- La lecture des détails ou l'impression d'un PV ne modifie plus les places et ne supprime plus des incidents multiples concernant le même étudiant.
- Les signatures du PDF viennent des visas enregistrés, jamais des paramètres de l'URL ou d'un cache attribué à un autre surveillant.
- Un PV ouvert est marqué **brouillon / non clôturé**. Son QR ouvre le dossier protégé du personnel; il n'est pas présenté comme une vérification publique anonyme.
- Les documents de conseil utilisent la décision réellement enregistrée. Les fausses signatures graphiques et les cachets générés ont été retirés. Les documents à remettre exigent les signatures et cachets institutionnels appropriés.
- La convocation à l'audition produit une notification portail. L'administrateur peut demander un email à l'adresse enregistrée de l'étudiant avec le PDF. L'acceptation du transport, une adresse absente et un échec sont distingués. Aucun destinataire parent n'est inventé.
- L'expéditeur Resend existant est conservé. Les tests utilisent un transport simulé et n'envoient aucun email à des étudiants réels.

## Structure et conservation des données

- `2026_10_25_100000_add_status_to_exam_seatings.php` ajoute le statut d'émargement manquant et l'empreinte persistante du PV. Les présences existantes servent seulement à remplir le nouveau statut.
- `2026_10_25_110000_scope_resit_eligibility_by_year.php` ajoute l'année aux droits de rattrapage, la déduit seulement lorsqu'une session existante la détermine et remplace l'unicité étudiant/module par étudiant/module/année. Les lignes historiques sont conservées. Son rollback automatique est refusé car revenir à une seule ligne ferait perdre l'historique annuel.
- Sauvegarde avant modification : `backend/storage/app/backups/encg-before-exams-20261025.dump`.
- Empreinte de comparaison : `backend/storage/app/before-exam-workflow-20261025.json`.
- Les fixtures et tests destructifs sont limités à `encg_roles_remediation_test`. Aucune campagne réelle ni décision académique réelle n'a été créée pour tester.

## Vérifications

Résultats finaux à compléter après la dernière exécution.

Journaux : `backend/storage/logs/exam-workflow-api-20261025.log` et `backend/storage/logs/exam-workflow-complete-20261025.log`. Scénarios navigateur : `frontend/e2e/exam-workflow.spec.ts` avec réponses API synthétiques; tests HTTP backend réels : `backend/tests/Feature/ExamWorkflowReliabilityTest.php`.

## Recette et décisions métier restantes

- Tester physiquement les QR, les imprimantes, plusieurs postes de surveillance et une véritable coupure réseau. Les tests navigateur automatisés ne remplacent pas cette recette.
- Confirmer les règles institutionnelles de quorum, les personnes habilitées et la portée/durée d'une exclusion. Les exclusions restent des décisions documentées : aucune durée ou suppression automatique d'inscription n'est inventée à partir d'un texte libre.
- Réconcilier dans le panneau de rattrapage les **40 anciens droits sans année** détectés en lecture seule. Ne pas leur attribuer arbitrairement l'année courante; le personnel doit vérifier le dossier ou le PV de référence avant chaque rattachement.
- Une replanification après diffusion demande un workflow distinct de correction, réémission et notification. La modification directe est protégée pour ne pas invalider les convocations déjà remises.
- Aucun déploiement distant effectué. Les dépréciations PHP des bibliothèques QR tierces sont distinctes des échecs fonctionnels.
