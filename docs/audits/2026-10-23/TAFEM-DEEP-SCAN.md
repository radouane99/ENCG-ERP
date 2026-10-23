# Audit approfondi TAFEM, inscription et OCR — 23 octobre 2026

## Verdict

Le parcours contient des briques fonctionnelles, mais **ne peut pas être considéré fiable de bout en bout pour une campagne réelle**. Les blocages principaux concernent l'accès aux dossiers, la transition candidat → inscrit, la fidélité des listes/PDF et la validation des résultats OCR. Améliorer uniquement le design masquerait ces problèmes.

Cet audit ne modifie pas le fonctionnement du produit. Les contrôles sur `encg_erp` sont en lecture seule. Les reproductions utilisent des identités fictives et des bases de test isolées ; aucun document candidat n'a été envoyé à un fournisseur externe.

## Ce qui a réellement été vérifié

| Contrôle | Résultat | Portée exacte |
|---|---|---|
| Tests existants : TafemAdmissionAndEnrollmentTest, BackendSecurityNormsTest, SensitiveRoutesRequireAuthenticationTest | 34 passent, 47 assertions | Les 2 tests nommés TAFEM créent/modifient directement Application : ils ne prouvent pas un import HTTP ni une inscription complète. |
| Nouvelles sondes de sécurité et de parcours | 13 sondes : 11 échecs, 2 succès sur SQLite et PostgreSQL ; 15 assertions par exécution | Les échecs reproduisent les anomalies ; les succès confirment l'extraction locale et le rejet protecteur des comptes existants. Voir `tafem-audit-probes.txt` et `tafem-audit-postgres.txt`. |
| RegistrationFields frontend | 2 tests passent | Composants de saisie ; aucune preuve de parcours OCR complet. |
| Extraction PDF native | Réussie sur document synthétique | PdfTextEngine lit l'identifiant fictif attendu. |
| Tesseract réel | Réussie sur document synthétique rendu en images | Le moteur raster lit le même identifiant, sans appel IA externe. Ce n'est pas une mesure de précision sur CNIE réelles. |
| Outils installés | tesseract, pdftotext, pdftoppm présents ; langues ara/fra/eng | Vérification dans encg_backend. |
| Infrastructure | `/api/health/ready` retourne ready=true ; Horizon en cours d'exécution | Ne prouve pas qu'un job OCR long termine correctement. |
| Fournisseurs | Gemini non configuré ; Groq configuré ; AI_DRIVER=gemini | Présence des clés seulement, jamais leur valeur. Aucune validation de disponibilité/quota/modèle cloud en direct. |
| Base documentaire | 7 lignes, 7 fichiers présents, 7 documents pending | Les 7 lignes n'ont ni student_id ni application_id ; l'association repose sur cne. Pas de doublon actuel cne/type ni campagne/cne, mais pas de contrainte unique correspondante. |
| Campagne | id=2, année=3, open, capacité=500 | Il existe 2 candidatures admis_tafem. Les 74 étudiants ne sont donc pas tous des candidats de cette campagne. |

Sources d'exécution : `tafem-runtime.json`, `tafem-frontend-fields.txt`, sorties des sondes. Les tests navigateur historiques utilisent des réponses simulées sur les écrans TAFEM ; ils ne certifient pas le workflow réel. Cet audit n'inclut pas une validation visuelle complète sur téléphone ni un test de charge.

## Cartographie du parcours actuel

1. L'administration importe un CSV via TafemMinistryImportController : création/mise à jour Application, User et Student.
2. Le candidat consulte `/public/track-dossier` avec ses identifiants ; la page d'admissibilité propose inscription, récépissé et email.
3. InscriptionPage demande des PDF pour bac/CNIE/relevé et une photo. Le téléchargement déclenche immédiatement OCR et parfois sauvegarde documentaire.
4. Le formulaire passe par `/v1/auth/register`, puis `/public/update-candidate-dossier`, puis synchronise les fichiers.
5. Le portail candidat réutilise ce formulaire en mode édition.
6. L'administration consulte une liste « ministère », contrôle les pièces physiques et active l'étudiant.
7. Plusieurs fonctions annexes produisent listes, PDF, rendez-vous, promotion de liste d'attente et QR.

Ces étapes utilisent plusieurs définitions de « accepté », « inscrit » et « verrouillé ». Elles ne forment actuellement pas une seule transaction métier cohérente.

## Anomalies prioritaires

P0 = accès aux données ou validité des décisions/documents à corriger avant une campagne réelle. P1 = blocage ou risque métier important. P2 = maintenabilité, lisibilité et efficacité.

### 1. P0 — Les mutations publiques ne vérifient pas réellement la concordance d'identité

`backend/app/Http/Controllers/Api/AdmissionController.php:928`, `:1215`, `:1466` ; `backend/app/Support/CandidateDossierGate.php:45`.

Le gate exige parfois la présence de CNE/CIN, mais n'établit pas leur concordance avec le propriétaire. L'upload résout même l'identifiant manquant depuis la base. Les sondes HTTP obtiennent **200 avec une CIN volontairement fausse** pour modifier un dossier, ajouter une pièce et supprimer une pièce. L'upload accepte aussi un dossier actif sans reprendre le verrou administratif. Un candidat connecté ne doit pas pouvoir choisir la cible par le corps de requête.

**Solution :** résolution unique du dossier depuis la session ou un jeton de dossier court, contrôle de propriétaire et de campagne, policy avant toute écriture, verrou appliqué à upload/update/delete. Une paire CNE/CIN n'est pas une authentification durable ; prévoir activation/OTP et session candidat.

### 2. P0 — Un compte connecté peut consulter la candidature d'un autre CNE

`AdmissionController.php:692–710` et `:734`.

La sélection Student est limitée au compte, mais la recherche Application accepte le CNE demandé dès qu'un utilisateur est connecté. La sonde avec un utilisateur sans dossier récupère une autre candidature au lieu de 404. Cela expose les données renvoyées et peut fournir des liens documentaires signés de cette autre candidature.

**Solution :** application_id propriétaire explicite ; aucun fallback vers un CNE arbitraire pour un utilisateur non habilité. Même scope pour toutes les sources du dossier.

### 3. P0 — Le suivi mélange les métadonnées de documents sans propriétaire relationnel

`AdmissionController.php:838` : `where(cne, ...)->orWhere(student_id, $student?->id)`.

Sans Student, la deuxième condition devient `student_id IS NULL`. La sonde Application seule récupère le nom d'un document d'un autre CNE. Les 7 documents actuels ont précisément des propriétaires relationnels nuls. Les liens sont ensuite signés avec le CNE consulté : cette anomalie prouve un mélange de métadonnées, pas à elle seule la lecture du fichier étranger.

**Solution :** ne jamais ajouter la branche Student si son ID est nul ; grouper les conditions et migrer vers application_id/document_id autorisés.

### 4. P0 — Récépissé fabriqué et statut d'admission imposé

`backend/app/Http/Controllers/Api/PdfExportController.php:106` (`exportRecepisseTafemPdf`).

Recherche CNE **ou** CIN, fallback vers un candidat fictif, score par défaut et libellé « Admis sur Liste Principale » sans décision correspondante. La sonde d'un candidat inexistant reçoit **200 PDF**, au lieu de 404. Le QR ne contient que le CNE et ne constitue pas une preuve de décision.

**Solution :** authentification/scope candidat, 404 si inexistant, autorisation selon état réel, données officielles obligatoires, identifiant opaque de document avec version et vérification limitée aux informations nécessaires.

### 5. P0 — Listes officielles, rangs et PV utilisent des données inventées

`AdmissionController.php:313–390` ; `PdfExportController.php:1848`.

La liste « Ministère » prend jusqu'à 60 étudiants, calcule des scores depuis leur position, déduit une liste principale des 25 premières lignes et ajoute téléphone/lycée de remplacement. Le PV prend 35/25 étudiants et recalcule des scores/rangs ; sans données il fabrique des candidats. Aucun de ces résultats ne doit être présenté comme une liste officielle.

**Solution :** utiliser uniquement Application de la campagne sélectionnée, score/rang/liste importés et traçables ; afficher « non renseigné » ; aucun fallback de démonstration dans un export officiel. PV versionné, validé et reproductible.

### 6. P0 — Validation physique : permissions trop larges et APOGEE fabriqué

`backend/routes/api/admin.php:804–806`, `:1165` ; `AdmissionController.php:398–469`.

La route partage un groupe incluant professeur/vacataire et plusieurs métiers sans contrôle métier supplémentaire dans la méthode ; le rôle scolarite n'est pas dans cette liste extérieure. La méthode génère `26 + student_id`, remplace student_number, active le dossier et peut modifier un parcours sans transaction globale ni création StudentRegistration. Le chemin `/academic/candidates/validate`, précédemment corrigé, est différent et ne protège pas ce chemin-ci.

La sonde avec un compte professeur atteint cette méthode et retourne **500**, et non le 403 attendu : `inscription_notes` n'est pas fillable sur Student et le mode strict des tests lève MassAssignmentException. Elle ne démontre donc pas une validation réussie ; elle confirme une autorisation insuffisante et un autre blocage du parcours. Aucun dossier réel n'a été validé. Le frontend a également son propre fallback de génération locale du même numéro.

**Solution :** permission dédiée admissions.review, scolarité autorisée explicitement ; numéro APOGEE importé ou rapproché depuis une source reconnue, jamais inventé ; une Action transactionnelle commune, idempotente, qui crée l'inscription annuelle et conserve l'historique. Sauvegarder les vérifications dans une structure autorisée et dédiée.

### 7. P1 — L'import peut réinitialiser un étudiant existant et changer son compte lié

`backend/app/Http/Controllers/Api/TafemMinistryImportController.php:61`, `:116–187`, `:335`.

L'upsert global par CNE choisit un utilisateur à email synthétique, réassigne user_id puis remet student_number à « En attente », status à pending et naissance à 2006-01-01. Le paramètre admission_campaign_id validé n'est pas utilisé pour choisir la campagne. Des valeurs de bac, genre, téléphone et série sont fabriquées si absentes. Le classement/list_type n'est pas persisté de façon cohérente avec les écrans qui le lisent. Les conversions float ne gèrent pas correctement une note à virgule, et une absence ne doit pas devenir une note par défaut.

**Solution :** prévisualisation sans écriture, rapport ligne par ligne, campagne explicite, normalisation stricte, conflits séparés, import idempotent par campagne+CNE. Ne jamais remplacer le lien utilisateur, l'identité canonique ou une inscription définitive lors d'un nouvel import.

### 8. P1 — Le candidat déjà importé est bloqué dans l'inscription ordinaire

`backend/app/Domain/Auth/Services/RegisterUserService.php:34–48` ; `InscriptionPage.tsx:985`.

Le service refuse tout dossier/compte déjà existant. C'est une protection contre la reprise de compte, mais le parcours candidat importé n'a pas de procédure d'activation correspondante dans les routes inspectées. Les comptes importés ont un email synthétique et un mot de passe temporaire inconnu. La sonde confirme le rejet du candidat déjà importé.

**Solution :** séparer création de compte et activation d'un admis : preuve de contact personnel, OTP ou lien d'activation délivré de manière contrôlée, rattachement au dossier existant. Ne pas rétablir l'ancien écrasement de compte.

### 9. P1 — La création de compte verrouille prématurément la suite de la sauvegarde

`Auth/AuthController.php` (`register`), `RegisterUserService.php:91`, `AdmissionController.php:963–981`, `InscriptionPage.tsx:985–1006`.

Register ne transmet au service que ses champs validés limités, puis crée Application en `enrolled`. Le POST de détails suivant considère justement `enrolled` comme verrouillé et retourne 403. L'interface capture l'erreur comme warning et annonce néanmoins la réussite. Les détails complémentaires peuvent donc manquer alors que l'utilisateur croit son dossier complet.

**Solution :** brouillon et compte distincts ; soumission unique validée côté serveur, état submitted après complétude, enrolled seulement après validation réelle. Afficher les sauvegardes partielles et les reprises possibles ; aucune réussite globale si une étape obligatoire échoue. Chaîne établie par lecture croisée, non par un test navigateur intégral.

### 10. P1 — Sauvegarde partielle, campagne 1 forcée et faux succès

`AdmissionController.php:1080–1210`.

Les écritures Application/Student/User sont indépendantes, plusieurs exceptions sont avalées, et le retour reste success=true. La création de secours force admission_campaign_id=1 alors que la campagne actuelle est 2. Le filtrage par colonnes existantes n'est pas une validation des données métier ; certaines données sensibles sont acceptées sans validation de domaine détaillée.

**Solution :** FormRequest et DTO explicites, Action transactionnelle, campagne résolue et autorisée, erreurs structurées, version/contrôle de concurrence pour les modifications candidat et administration.

### 11. P1 — L'ancien endpoint de préinscription retourne 500

`AdmissionController.php:473–535`, ligne 489.

La sonde HTTP rencontre `BadMethodCallException: ...Builder::orWhereCin()` : le scope whereCin ne fournit pas cette méthode. Le reste de cette méthode prévoit une recherche CNE ou CIN et une remise à pre_inscri sans preuve de concordance. **Le downgrade n'a pas été observé : l'exécution s'arrête à l'exception.** Les rendez-vous utilisent des dates fixes de juillet 2026 et des modulo d'ID.

**Solution :** supprimer le chemin parallèle après migration des clients, ou le faire appeler la même Action sécurisée ; gérer des rendez-vous persistants avec capacité et disponibilité.

### 12. P1 — Statistiques et « répartition IA » sont en partie des simulations

`AdmissionController.php:190–310` ; `AdminTafem.tsx:89–132`.

4852 candidats, 1280 places, amphithéâtres remplis et régions sont codés en dur ; runAutoRepartition retourne un succès sans affectation en base. Les compteurs d'inscription prennent tous les étudiants et non uniquement ceux de la campagne.

**Solution :** indicateurs calculés par campagne et année, capacité issue de la configuration, répartition déterministe avec contraintes de salles, aperçu puis validation et persistance. L'IA peut expliquer les résultats ; elle n'est pas nécessaire au placement.

### 13. P1 — Promotion de liste d'attente sans rang ni capacité

`AdmissionController.php:289`, `:863`.

Le chemin utilisé prend les 5 premiers étudiants list_type=LISTE_ATTENTE, sans ordre de mérite, campagne, contrôle de places ou verrou ; à vide, il annonce encore 5 promotions. Le second chemin utilise student_number nul et un autre changement de statut.

**Solution :** rang officiel avec règle d'égalité explicite, places libérées, transaction/verrou de campagne, invitation expirante, journal et nombre réel ; une seule implémentation.

### 14. P1 — OCR : transport TLS désactivé et données identitaires dans les logs

`backend/app/Services/AI/GeminiApiService.php:81`, `:198`, `:220`, `:271`, `:282`, `:335`, `:353`, `:402`, `:425`.

Plusieurs requêtes utilisent `withoutVerifying()`. Les réponses OCR décodées sont passées comme contexte à Log::info ; elles peuvent contenir identité, adresse, parents et numéros de documents. Le chemin actif peut envoyer texte brut puis images aux fournisseurs selon ses fallbacks.

**Solution :** vérification TLS avec certificats corrects, logs sans contenu documentaire, identifiant de traitement, métriques techniques ; politique locale/cloud explicite et traçabilité du fournisseur réellement utilisé. Constats techniques, pas un avis de conformité juridique.

### 15. P1 — OCR : résultats non validés, confiance non probante

`GeminiApiService.php:680–801`, `backend/app/Services/Ocr/OcrExtractionService.php:21`, `OcrPipeline.php:178`.

Les sondes confirment qu'une date impossible (31 février) et une moyenne 99 passent le nettoyage. Un tableau non vide peut suffire à success=true. Le score de confiance du pipeline dépend de la longueur/mots-clés/patterns : il ne mesure pas la fiabilité de chaque champ. La réponse simplifiée ne conserve pas un historique de preuve par champ/document et ne constitue pas une validation de conformité.

**Solution :** schéma strict, calendrier réel, notes 0–20, identifiants normalisés, type de document reconnu, champs absents explicites, rapprochement entre les trois pièces et la liste officielle. Valeur proposée + source/page + confiance calibrée + correction humaine. Jamais de certification automatique à partir d'un texte plausible.

### 16. P1 — Mode asynchrone incomplet et limites de durée inefficaces

`AdmissionController.php:1552–1593`, `backend/app/Jobs/ProcessOcrDocumentJob.php:14`, `OcrPipeline.php:145`, `backend/config/horizon.php`.

async=true renvoie un token et stocke le résultat en cache 15 minutes, mais aucune route de récupération n'a été trouvée. Le frontend utilise l'appel synchrone. executeWithTimeout exécute simplement le callback ; les appels cloud peuvent cumuler plusieurs timeouts de 15/25 secondes. Horizon a un timeout de 60 secondes. Le job n'a pas de gestion failed/finally assurant un état terminal et la suppression du fichier temporaire en cas d'exception.

**Solution :** ocr_runs persistants et autorisés, états queued/processing/succeeded/needs_review/failed, API de suivi, budget de durée global, timeout de processus réel, tentatives/backoff cohérents, nettoyage des entrées abandonnées et résultats expirés. Sur erreur fournisseur, la saisie manuelle doit rester disponible.

### 17. P1 — Cache OCR basé sur nom/taille/date, pas sur contenu

`backend/app/Services/AI/LocalOcrService.php:297`.

La clé utilise nom original, mtime, taille et doc_type, sans hash du contenu ni propriétaire. Deux téléversements différents ayant les mêmes attributs peuvent partager une extraction mise en cache. Risque constaté par construction de la clé, pas par un incident dans les dossiers réels.

**Solution :** SHA-256 du contenu + type + version moteur/parser + scope institution/propriétaire, avec rétention contrôlée et réextraction explicite.

### 18. P1 — Modèle documentaire fragile et non versionné

`StudentDocument.php:16`, `AdmissionController.php:1318–1338`, inventaire PostgreSQL.

L'upload identifie une pièce par cne/type et laisse student_id/application_id vides. Les alias cin/cnie/cin_recto_verso produisent plusieurs clés pour le même document. Pas d'unicité métier dans la base ; un nom prévisible peut écraser une version précédente, et la suppression retire la ligne sans supprimer le fichier. Pas de hash, version, traitement OCR ou historique de revue attaché à la version réellement examinée.

**Solution :** propriétaire relationnel, type canonique, UUID de stockage, hash et versions immuables ; un document courant unique par dossier/type, revue portant sur une version précise, remplacement traçable et politique de purge des fichiers.

### 19. P1 — Rapport qualité TAFEM incorrect

`backend/app/Services/Admissions/TafemQualityReportService.php:29–52`.

Le prédicat massar_mismatch compte les valeurs absentes **ou égales** au CNE ; la sonde d'un Massar identique retourne 1 anomalie. La sélection ne charge pas user_id/user pour l'identité canonique, et la photo est cherchée dans photo_path sans utiliser les pièces StudentDocument. L'analyse porte sur tous les étudiants, puis son explication IA reprend ces chiffres.

**Solution :** contrôles déterministes corrects, scope campagne, identité User et document photo courant, résultats par anomalie ; IA uniquement pour expliquer des faits déjà validés.

### 20. P1 — Routes et permissions ne correspondent pas aux actions affichées

`backend/routes/api/admin.php:507`, `:729`, `:1200` ; `AdmissionCampaignController.php` ; `TafemAdmissibilitySection.tsx:53`.

Les routes calculate-seuil pointent vers une méthode absente du contrôleur. Le bouton public d'envoi d'email appelle une route à l'intérieur d'un groupe staff authentifié : un candidat ne peut pas accomplir cette action comme l'interface le propose. Pas d'email réel envoyé pendant l'audit.

**Solution :** contrat API vérifié route par route, activation/renvoi sécurisés côté candidat, permission de revue côté administration, envoi en queue après commit avec statut et reprise. Conserver le calcul officiel et ses paramètres approuvés ; ne pas inventer de formule de sélection.

### 21. P1 — Consentement technique et saisie manuelle après échec OCR

`InscriptionPage.tsx:607`, `:760–801`, `:861`, `:1500–1623`, `:1698`.

La case de consentement intervient dans le passage d'étape, alors que la sélection d'un fichier déclenche déjà OCR et sauvegarde. Aucun consentement versionné n'est transmis à cet endpoint. Le catch de l'upload OCR automatique peut simplement faire disparaître le toast, sans expliquer comment continuer. L'état ocrExtracting est un booléen partagé entre traitements : plusieurs sélections concurrentes méritent une gestion distincte.

**Solution :** choix explicite de traitement avant déclenchement, option locale/manuelle, information sur le mode réellement choisi, preuve technique horodatée si requise par la politique de l'établissement ; traitements par document, annulation et reprise, message clair sans bloquer le parcours. La conformité légale reste à faire valider séparément.

### 22. P2 — Affichage et confirmations donnent une confiance excessive

`InscriptionPage.tsx:1409`, `:1765`, `:2655` ; `AdminTafem.tsx:143–163`, `:855` ; `CandidateDossierPortal.tsx:81`.

Le « 70% » est fixe ; Gemini/Groq sont annoncés selon le bouton sans provenance réelle. Certains toasts annoncent un PDF avant son chargement et « Valider Émargement Entrée » ne fait qu'afficher un toast puis fermer la fenêtre. Le scanner attend amphi/table alors que scanEnvelopeQrCode ne les renvoie pas. Le portail marque toutes les pièces comme PDF, y compris une photo. L'admissibilité autorise visuellement un seul identifiant alors que le suivi invité exige les deux.

**Solution :** statut et progression mesurés, noms de moteur uniquement en détail technique, succès après réponse persistée, vrai émargement auditable, aperçu selon MIME, libellés identiques à la validation serveur. Enregistrer le brouillon et reprendre sans refaire tous les uploads ; éviter de multiplier sauvegardes implicites et boutons concurrents.

## Architecture OCR réellement utilisée

`POST /public/ocr-extract-documents` → `AdmissionController::extractDocumentDataOcr` → `OcrExtractionService` → `GeminiApiService::extractDocumentOcr`.

Ce service appelle d'abord LocalOcrService (moteurs PDF et Tesseract), peut envoyer le texte local à Groq, puis utiliser ses fallbacks de vision/texte selon le résultat et la configuration. Le binding de LocalOcrService dans AppServiceProvider enregistre PdfTextEngine, PdfBinaryEngine et TesseractEngine ; **la présence de GroqLlamaEngine dans le constructeur par défaut ne prouve pas qu'il est dans ce binding actif**. Le pipeline essaie deux moteurs initialement, puis son extraction d'urgence peut les reprendre et atteindre Tesseract. Il ne faut donc pas conclure que Tesseract est toujours ignoré à cause de la limite 2.

OcrExtractController contient un autre contrat de réponse mais aucune route active n'a été trouvée pour lui. DocumentOcrAuditorService renvoie « verified/conforme » sans extraction réelle ; aucune référence d'appel n'a été trouvée. C'est du code dormant à retirer ou remplacer, **pas une preuve qu'un audit réel est aujourd'hui exécuté**. Les différents drivers IA ne partagent pas tous le même contrat ; une configuration globale ne garantit pas le bon fonctionnement de chaque fonctionnalité.

## Parcours recommandé pour le candidat

1. **Accès/activation :** vérifier l'admissibilité, activer son dossier via un contact personnel vérifié, afficher campagne et échéance réelles.
2. **Documents :** photo/PDF depuis mobile, recadrage/rotation, détection du flou et pages manquantes, progrès par pièce, conserver un brouillon. Autoriser une saisie manuelle si OCR indisponible.
3. **Vérification :** préremplissage proposé, document à côté des champs, conflits CNIE/bac/relevé signalés clairement. Champs modifiables sans cadenas surprenant ; ne pas déduire les noms de parents depuis le nom de famille du candidat.
4. **Soumission :** un écran récapitulatif avec pièces manquantes et une seule action. Confirmation seulement après toutes les écritures requises. Numéro de dossier et état submitted, sans prétendre à l'inscription définitive.
5. **Suivi :** chronologie courte, demandes de correction précises par document/champ, modification des seuls éléments demandés, rendez-vous réel, récépissé cohérent et notification de validation.

## Poste de travail recommandé pour l'administration

- Une file par campagne : à examiner, incomplets, conflits d'identité, attente candidat, complets, validés. Filtres utiles, pagination et recherche sur l'identité canonique.
- Vue en deux colonnes document/champs ; voir proposition OCR, valeur déclarée et donnée officielle. Accepter/corriger un champ avec motif, sans recopier l'intégralité du dossier.
- Checklist numérique distincte de la réception des originaux ; tracer qui a reçu quoi et quand. Validation définitive soumise aux pièces requises et au numéro officiel.
- Actions groupées uniquement sur dossiers éligibles, avec aperçu et résultat réel. Invitations de liste d'attente selon places/rang et expiration ; aucune admission décidée par un LLM.
- Tableau de bord basé sur données réelles : dossiers en attente, délais, pièces à reprendre, taux d'extraction/champs corrigés et erreurs fournisseur. Les compteurs doivent pouvoir être rapprochés des dossiers.

## Structure de données cible, sans réécriture destructive

Conserver User pour l'identité canonique et Application pour la candidature d'une campagne. Ajouter explicitement owner_user_id/activation et une relation sûre vers Student lors de la conversion. Une nouvelle campagne crée une nouvelle candidature et conserve l'historique.

Séparer **admissibilité** (principale/attente/non admis), **dossier** (draft/submitted/needs_correction/under_review/approved/rejected) et **inscription pédagogique** (non créée/active/annulée). `accepted` ne doit plus signifier à la fois présélection et inscription définitive.

Prévoir :

| Objet | Informations et contraintes utiles |
|---|---|
| Application | institution, campagne, candidat, rang officiel, score source, état de dossier, version ; unicité campagne+CNE après rapprochement des doublons. |
| Version de document | application_id obligatoire pour une pièce candidat, type canonique, stockage privé opaque, hash, MIME/taille/pages, version courante. |
| OcrRun / champs extraits | document_version_id, état, moteur/modèle/version, horodatages, durée, erreurs nettoyées, valeur proposée, source/page et confiance ; pas de statut « certifié » implicite. |
| Revue | version examinée, agent, décision/motif, corrections et date ; invalidation de la revue si la pièce change. |
| ImportBatch | campagne, checksum/source, auteur, prévisualisation, conflits, lignes acceptées/rejetées et rapprochement idempotent. |
| Rendez-vous / entrée | créneau avec capacité, réservation unique, guichet, présence horodatée ; token opaque révocable. |
| Notification | événement métier, destinataire vérifié, état/tentatives ; génération après commit. |

Migration : inventorier → rapprocher les 7 pièces sans propriétaire → normaliser les types → détecter conflits → backfill contrôlé → contraintes uniques/FK → bascule API. Ne pas supprimer les anciennes lignes ni réassigner user_id automatiquement pour résoudre un conflit.

## Ordre de réalisation et critères d'acceptation

**Lot 1 — accès et exactitude :** corriger 1–6 ; supprimer les données inventées des récépissés/PV/statistiques ; restreindre les permissions et protéger les mutations. Critères : aucun accès croisé, aucune mutation d'un dossier verrouillé, aucun document officiel pour un dossier inexistant, aucun score/rang inventé.

**Lot 2 — parcours cohérent :** activation des admis importés, états séparés, soumission transactionnelle, import sûr, validation définitive unique, campagnes et échéances explicites. Critères : candidat importé et nouveau candidat peuvent terminer le parcours ; coupure réseau/retry ne crée ni doublon ni faux succès ; répétition d'un import ne modifie pas une inscription validée.

**Lot 3 — OCR exploitable :** TLS/logs/cache, file de jobs et suivi, validation des champs, revue humaine et reprise manuelle. Critères : PDF texte, scan recto/verso, arabe/français, pages inversées, mauvais type, document vide/flou, fournisseur indisponible et timeout ont tous un résultat compréhensible et traçable.

**Lot 4 — efficacité et design :** écran administrateur de revue, reprise de brouillon, capture mobile, notifications et rendez-vous réels, exports depuis la même source officielle. Critères : tests navigateur non simulés sur base isolée, téléphone/clavier/RTL, pièces manquantes/corrections, émargement persistant.

Avant d'annoncer un pourcentage de précision OCR, constituer un corpus autorisé avec vérité terrain par champ et mesurer exactitude CIN/CNE/date/moyenne, taux de correction humaine, temps de revue et taux d'échec. Le test synthétique présent prouve une capacité d'extraction locale, pas une précision générale ni la détection de fraude documentaire.

## Reproduction

Les sondes sont conservées hors de la suite normale dans `backend/tests/Audit/TafemDeepScanAuditTest.php`. Les assertions de sécurité expriment les garanties attendues et sont intentionnellement rouges tant que les défauts ne sont pas corrigés. La sonde d'import, elle, vérifie le rejet protecteur actuel : son succès confirme la nécessité d'un parcours d'activation distinct, sans autoriser la reprise d'un compte par simple CNE/CIN.

```powershell
docker exec encg_backend php artisan test tests/Audit/TafemDeepScanAuditTest.php
```

Pour PostgreSQL, créer une base dédiée dont le nom finit par `_test`, utiliser `phpunit.postgres.xml` et DB_DATABASE explicitement, puis supprimer uniquement cette base temporaire. Ne jamais utiliser encg_erp pour ces sondes.

Les résultats des sondes et l'inventaire doivent être relus après correction : cet audit décrit l'état observé le 23 octobre 2026 et n'est pas une certification de production.
