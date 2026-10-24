# Inscription, réinscription et diplomation — fonctionnement opérationnel

État local du 24 octobre 2026. Les écrans et contrôles ci-dessous concernent le code local ; ils ne constituent pas une confirmation de déploiement sur erp.irsale.fr.

## 1. Nouvelle inscription : TAFEM / CNAEM

Point d’entrée administratif : `/academic/enrollments`. L’ancien lien `/admin/tafem` rejoint ce cockpit. Les anciens étudiants ont une page distincte : `/admin/reinscriptions`.

1. **Préparer les références.** Vérifier l’année universitaire, la filière, la voie d’accès et les groupes avec leurs capacités. TAFEM entre en S1 ; CNAEM entre en S5 ou S7 selon la décision officielle. Ces voies alimentent une formation initiale gratuite.
2. **Créer la campagne.** Dans « Campagnes & échéances », renseigner année, formation, capacité, ouverture et clôture. Enregistrer un brouillon puis ouvrir la campagne lorsque les références sont prêtes. Les dates et l’état sont contrôlés côté serveur. Le contexte d’une campagne déjà utilisée ne se remplace pas librement.
3. **Importer les listes officielles.** Prévisualiser le CSV, corriger les erreurs et les doublons CNE/CNIE, puis confirmer l’import. TAFEM utilise les colonnes officielles `bac_average` et `tafem_score` ; CNAEM utilise `admission_score`. Aucun score ou numéro APOGEE n’est inventé.
4. **Vérifier le contact et préparer l’accès.** L’agent rapproche l’identité et le contact personnel avant l’activation. Le candidat active son dossier avec un jeton individuel ; un compte existant conserve son identité et son mot de passe. Une ambiguïté d’identité demande un rapprochement humain.
5. **Compléter le dossier candidat.** Le candidat renseigne son profil et dépose ses pièces dans son espace authentifié. TAFEM : bac, CNIE, relevé et photo. CNAEM : mêmes pièces, plus attestation officielle d’admission et relevés du parcours antérieur. Les versions antérieures restent historisées.
6. **Utiliser l’OCR si souhaité.** L’extraction aide à recopier et comparer les informations. Elle exige le consentement applicable et ne valide pas le document. L’agent et le candidat vérifient les propositions ; le parcours manuel reste utilisable. La précision sur de vrais documents et les performances du fournisseur IA demandent une évaluation spécifique.
7. **Soumettre.** Le serveur contrôle l’admissibilité et les pièces exigées par la voie d’accès. Le candidat suit l’état du dossier et corrige les pièces refusées après demande motivée.
8. **Organiser le guichet.** Publier les créneaux et capacités, prévisualiser les rendez-vous puis confirmer. Le contrôle du jeton/QR enregistre l’arrivée ; il ne constitue pas une validation académique ou documentaire.
9. **Examiner les documents.** Dans « Dossiers & revue », comparer chaque version numérique, les données déclarées et la liste officielle. Vérifier chaque pièce ou demander une correction motivée. Les erreurs de chargement sont affichées ; une proposition OCR n’est jamais une preuve de conformité.
10. **Contrôler les originaux et finaliser.** Ouvrir « Validation physique et inscription définitive » dans le dossier. Cocher les contrôles réellement effectués, y compris les preuves CNAEM, et saisir le numéro APOGEE officiel. Le serveur exige les pièces numériques vérifiées et les contrôles physiques. L’agent, la date et la liste de contrôle sont conservés.
11. **Affecter aux groupes.** Dans « Inscriptions & groupes », affecter les nouveaux inscrits validés et encore sans groupe. Le serveur limite l’opération à la campagne, à l’année, à la filière et au niveau d’entrée ; il contrôle les capacités. Une répétition conserve les affectations existantes. Les sous-groupes TD sont répartis par ordre alphabétique.
12. **Exporter et clôturer.** Exporter la liste et les comptes existants en CSV, ainsi que les attestations à viser en ZIP. L’export ne crée pas de compte académique externe et ne fabrique pas de signature. Fermer la campagne à la fin des opérations.

**Règle financière :** aucun paiement de scolarité pour la formation initiale TAFEM/CNAEM. Les masters à temps aménagé et diplômes universitaires payants gardent leur classification et leurs contrôles financiers propres. Ce cockpit d’admission initiale ne doit pas leur servir de contournement.

## 2. Réinscription des anciens étudiants

La scolarité publie désormais les dates dans « Calendrier des réinscriptions ». L’étudiant consulte ces dates et les consignes dans son espace annuel ; une campagne absente, en brouillon, fermée ou hors dates bloque une nouvelle confirmation. Les récépissés déjà obtenus restent consultables et contrôlables au guichet après clôture.

1. La scolarité et le jury vérifient le bilan académique. Le passage, le maintien ou la fin du cursus ne sont pas déduits de l’absence de notes ou d’un niveau supposé.
2. Après validation pédagogique, préparer l’inscription annuelle de l’année cible. Les routes de bascule HTTP utilisent le même service contrôlé. Un bilan incomplet bloque la bascule ; l’ancien bouton d’initialisation automatique a été retiré.
3. Le cockpit annuel affiche séparément : décision attendue, rapprochement nécessaire, confirmation étudiante attendue, contrôle physique attendu et dossier finalisé.
4. L’étudiant confirme ses coordonnées et reçoit une référence de confirmation. Une inscription annuelle ambiguë ou située au-delà de la durée du programme bloque la confirmation. Un cursus déjà diplômé ne se renouvelle pas.
5. Pour un cursus payant seulement, la régie vérifie le paiement réel. La formation initiale n’affiche pas d’étape financière.
6. L’agent effectue ensuite le contrôle physique du dossier annuel : identité, décision académique et pièces annuelles. Le récépissé étudiant et le contrôle guichet sont deux preuves distinctes.
7. Les relances concernent uniquement les étudiants dont l’inscription académique est prête et dont la confirmation manque. Les filtres sont appliqués, avec une relance au maximum par étudiant et par jour.
8. Exporter les listes filtrées et traiter humainement les dossiers en attente ou contradictoires. Aucune suppression d’inscription ou de note ne sert à masquer un conflit.

Les 72 inscriptions anciennes placées précédemment en attente de revue restent à rapprocher de décisions réelles. Leur statut d’attente n’est pas un redoublement.

## 3. Fin du cursus et registre des lauréats

Écran : `/alumni/dashboard`, rubrique « Registre des lauréats ».

1. Vérifier la durée du programme : cursus initial ENCG jusqu’à S10 ; autres programmes selon `duration_years` (exemple : master de deux ans, S1–S4). Une durée manquante ne se devine pas.
2. Enregistrer et sceller le PV annuel contenant une décision favorable pour l’étudiant, dans sa formation et son année terminale. Une décision semestrielle isolée ou un PV non scellé ne suffit pas.
3. Ouvrir « Diplomations à finaliser après le jury ». Vérifier la personne, la formation et la promotion, puis confirmer la diplomation.
4. Le serveur recontrôle les droits, l’établissement, le PV scellé, la réussite et le parcours terminal. Une poursuite prévue au-delà du cursus ou plusieurs cursus actifs contradictoires demandent une revue.
5. La diplomation est enregistrée dans `student_graduations`, avec formation, année, décision, responsable et date. Le parcours courant est clôturé ; les notes et inscriptions restent conservées. La répétition de la confirmation ne crée pas de doublon.
6. Le lauréat apparaît au registre sans devoir remplir un questionnaire professionnel. Son espace de réinscription affiche la fin du cursus et ne propose plus de confirmation annuelle pour ce cursus.
7. S’il rejoint plus tard un autre programme, sa diplomation précédente reste conservée et visible. Une nouvelle admission est nécessaire ; la gratuité ou le paiement dépend du nouveau cursus.

Les statuts historiques « graduated » restent consultables, sans fabriquer rétroactivement des décisions ni des dates de diplôme. Leur rapprochement documentaire reste une opération administrative.

## 4. Données et preuves

| Objet | Rôle |
|---|---|
| `admission_campaigns` | Année, formation, voie, niveau d’entrée, dates et capacité |
| `applications` | Dossier candidat, propriétaire, admissibilité, état et version |
| `student_documents` / revues | Pièces privées, versions, examen humain et contrôle physique |
| `students` / `users` | Identité académique et compte canonique |
| `student_registrations` | Inscription annuelle et niveau validé |
| `student_pathways` | Historique du cursus, section et sous-groupe |
| `student_renewals` | Confirmation annuelle et preuve du contrôle physique |
| `deliberations` / `deliberation_decisions` | PV du jury, décisions et scellement |
| `student_graduations` | Diplomations conservées par étudiant, formation et année |

L’ajout du registre ne réécrit pas les notes historiques. Les compteurs d’archives utilisent les décisions et diplomations enregistrées ; aucun taux d’admission ou de diplomation forfaitaire n’est appliqué. Une empreinte blockchain absente reste absente.

## 5. Recommandations d’exploitation

- Préparer une matrice de pièces physiques approuvée par voie d’accès, avec les règles de conservation et de restitution des originaux.
- Vérifier les durées et la numérotation de chaque master/DU avant la première campagne ; contrôler les cas historiques à rapprocher.
- Publier les vraies dates dans le nouveau panneau « Calendrier des réinscriptions ». Une campagne non configurée, en brouillon, fermée ou hors dates bloque les nouvelles confirmations. Voir [le mode opératoire](../../operations/REINSCRIPTIONS-ET-RECETTE-OCR.md).
- Tester l’OCR sur un échantillon autorisé de pièces réelles et mesurer les erreurs avant de fixer un objectif de gain de temps. Conserver la validation humaine.
- Avant mise en production, effectuer une recette avec les agents et un candidat TAFEM, un candidat CNAEM, un ancien étudiant et un lauréat de master. Vérifier également les notifications réelles et les sauvegardes dans l’environnement de déploiement.
