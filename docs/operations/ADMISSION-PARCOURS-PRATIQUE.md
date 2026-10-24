# Admission : parcours pratique candidat et scolarité

## 1. Préparer la campagne

La scolarité ouvre une campagne avec une année, une formation, des dates et une capacité. TAFEM entre en S1 ; CNAEM entre au niveau autorisé de la campagne. Ces admissions concernent la formation initiale gratuite. Les formations payantes restent dans leur parcours distinct.

Importer et prévisualiser la liste officielle, contrôler les identifiants et publier les créneaux. L’activation du compte utilise le contact vérifié ; le candidat ne modifie pas librement son CNE ou sa CIN.

## 2. Constituer le dossier

Le candidat dépose ses justificatifs et sa photo. Pour une image, il peut tourner ou recadrer les bordures avant l’envoi. Des avertissements locaux signalent une faible résolution, une image sombre, presque blanche ou potentiellement floue. Ils ne prouvent ni lisibilité parfaite ni authenticité. Une image signalée ou recadrée exige une confirmation visuelle des informations et des quatre coins. Le candidat peut reprendre la photo ou envoyer l’original après vérification.

Avec son accord, l’OCR propose des valeurs pour les champs vides ; les identifiants et la saisie existante restent protégés. Le mode local fonctionne sans fournisseur cloud ; l’enrichissement cloud dépend de sa configuration et du consentement explicite. Le candidat complète les informations restantes.

Après une courte pause, la saisie est sauvegardée côté serveur. Une panne laisse les modifications visibles et propose une nouvelle tentative. Le retour en ligne relance la tentative. Fermer la page avant confirmation de sauvegarde peut perdre les changements encore non transmis : un avertissement de sortie le signale. Aucune copie du profil ou des documents n’est conservée dans localStorage.

En cas de conflit de version, les sauvegardes sont suspendues : le candidat charge explicitement la version enregistrée avant de poursuivre. Cette action abandonne sa saisie locale non enregistrée.

## 3. Relire et soumettre

« Vérifier avant envoi » présente la campagne, les identifiants, la photo, les informations et les justificatifs. Les raccourcis « Modifier » reviennent au champ ou à la pièce concernée. Les champs et pièces manquants ou rejetés bloquent la confirmation. Une case de relecture est obligatoire. Le serveur vérifie à nouveau les droits, la version et les éléments requis.

Après dépôt, la fiche PDF de préinscription fournit les informations, la photo et un QR vers le dossier protégé. La préinscription n’est pas une inscription définitive.

## 4. Corriger uniquement les pièces demandées

La scolarité peut examiner plusieurs pièces même après une première demande de correction. Chaque observation conserve sa référence à la pièce et sa version. Le candidat remplace les pièces signalées, tandis que les pièces déjà vérifiées sont conservées : leur remplacement ou leur retrait est bloqué côté serveur pendant la correction. Les anciennes versions et décisions restent consultables dans l’historique administratif. Une pièce rejetée non remplacée interdit une nouvelle soumission.

## 5. Organiser le passage au guichet

Depuis le dossier, l’agent confirme la présence et indique le guichet. Le serveur attribue un numéro unique par campagne et journée. Un double clic ou une répétition de requête retourne le même passage du jour.

Dans « Suivi & incidents », la file affiche les arrivées, les passages en cours et terminés. « Appeler et prendre en charge » réserve le traitement à l’agent. Un agent traite un seul passage à la fois ; un autre agent ne peut examiner les pièces, décider ou enregistrer une mouvement d’original sur ce dossier tant que la prise en charge est active. Les verrous en base et les versions protègent les requêtes concurrentes.

« Libérer le dossier » le remet en attente. « Clôturer le passage » termine seulement le passage. Un responsable peut libérer le dossier d’un agent absent avec un motif obligatoire, conservé dans le journal. Les prises en charge non terminées des jours précédents restent visibles pour ne pas bloquer silencieusement le service.

Le candidat voit uniquement son numéro et son guichet, jamais la liste des autres candidats. L’affichage se rafraîchit périodiquement ; ce n’est pas un écran public d’appel.

## 6. Finaliser l’inscription

L’agent compare les documents numériques et les originaux, renseigne la checklist physique, les mouvements d’originaux et le numéro APOGÉE officiel. La validation définitive et l’affectation suivent les règles existantes ; clôturer un passage ou recevoir un original ne remplace pas ces contrôles. La réception, le rangement et la restitution des originaux sont tracés avec reçus.

Les anciens étudiants utilisent la campagne de réinscription dédiée. Les décisions académiques et la sortie vers les lauréats exigent les résultats et décisions officiels ; aucune promotion ou diplomation ne découle automatiquement d’un dépôt administratif.

## Essai réel encadré

Tester TAFEM et CNAEM, un téléphone en français et en arabe, une connexion interrompue puis rétablie, un scan lisible et un scan difficile, une correction, deux agents sur le même dossier, une restitution d’original et une réinscription. Utiliser des dossiers de test autorisés et ne pas envoyer de notifications réelles pendant la répétition. Vérifier visuellement le PDF et la lecture QR sur le téléphone effectivement utilisé au guichet.
