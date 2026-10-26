# Guides, annonces officielles et assistance publique

## Utilisation par l'administration

Dans `/admin/settings` :

1. **Coordonnées institutionnelles** : renseigner l'adresse, l'email et le téléphone officiels. L'accueil et son pied de page utilisent ces mêmes valeurs ; les anciennes coordonnées écrites dans le code sont retirées.
2. **Page publique : guides et annonces** : saisir les horaires d'accueil et les consignes TAFEM/CNAEM. Les pièces obligatoires proviennent des mêmes règles que le dossier candidat ; les consignes complètent ces règles.
3. **Ajouter une annonce** : titre, texte, état et période. Un brouillon peut être enregistré sans dates. Publier exige les deux dates, dans l'ordre. Une annonce archivée n'apparaît plus au public.
4. **PDF officiel** : importer un PDF de dix Mo maximum, le vérifier par le lien privé d'administration, puis enregistrer le contenu pour l'associer à l'annonce. Le stockage est privé ; le lien public n'est utilisable que durant la publication. L'empreinte SHA-256 des nouveaux fichiers est contrôlée au téléchargement.
5. **Demandes depuis la page publique** : filtrer par service et par état, puis marquer une demande à traiter, en cours ou clôturée. Les modifications sont auditées.

Les annonces sont indépendantes du calendrier des admissions. Publier un communiqué ne rend pas une campagne ouverte. Aucun statut ni aucune date de campagne existante n'a été changé par cette intervention. Aucun communiqué de démonstration n'a été publié sur la base réelle.

## Parcours public

- Le guide « Comment s'inscrire ? » distingue TAFEM et CNAEM, leurs niveaux d'entrée et leurs pièces. Les deux concernent la formation initiale gratuite.
- « Suivre mon dossier » mène à `/admissions/mon-dossier`. L'authentification conserve ce retour vers le dossier ; les redirections externes restent refusées.
- Les annonces officielles ne sont retournées par l'API que si elles sont publiées et dans leur période, selon `Africa/Casablanca`, dates inclusives.
- Les horaires sont affichés s'ils sont renseignés par l'administration. Aucune heure d'accueil n'est inventée.
- Le formulaire de contact distingue admissions, formation, documents, accès au compte et problèmes techniques. Il retourne une référence `DEM-…` après enregistrement effectif.
- Documents, formation et inscription vont dans la catégorie admissions ; accès et problèmes de plateforme dans l'assistance technique ; les autres demandes restent dans l'accueil général. Un filtre organise ces catégories dans la boîte administrative.
- Ce dispositif n'envoie pas automatiquement d'email au demandeur ou au personnel. Il ne prétend pas prouver une livraison dans une boîte email. La configuration et l'expéditeur Resend sont inchangés.

## Protection des données et cohérence

Les écritures exigent une habilitation administrative. Le formulaire public ne peut pas choisir l'établissement, le service destinataire interne ou le statut de traitement. Les demandes privées sont limitées à l'établissement du gestionnaire ; les clés du cache frontend tiennent également compte de son identité et de son établissement.

Le contenu est enregistré dans une section dédiée des paramètres institutionnels, sous verrou, sans écraser les autres paramètres. Un numéro de révision refuse les sauvegardes concurrentes devenues anciennes avec HTTP 409 ; la saisie reste visible pour permettre sa récupération.

Les chemins du stockage privé et les autres paramètres de l'institution ne sont pas publiés. Les annonces en brouillon, futures, terminées ou archivées ne donnent aucun accès public à leur PDF. Un fichier dont l'empreinte a changé est refusé. L'administration dispose d'un téléchargement privé pour contrôler le PDF avant publication. Un échec de stockage ne crée pas de référence de fichier fictive.

Limites de gestion : trente annonces, cent fichiers référencés et dix Mo par PDF. Les fichiers ne sont pas détruits automatiquement lorsqu'une annonce est retirée : ils restent privés et peuvent être réutilisés. Leur éventuelle purge relève d'une procédure technique de conservation.

## Bascule de données

Une ancienne migration de purge avait supprimé `contact_submissions`. La migration additive ciblée `2026_10_26_190000_scope_public_contact_requests.php` restaure cette table si elle manque et ajoute le périmètre institutionnel, le service et l'état. Si d'anciennes lignes existent, elles ne sont ni supprimées ni attribuées arbitrairement ; celles dont l'établissement n'est pas établi ne sont pas exposées dans une boîte d'établissement.

La migration a été exécutée seule après inspection SQL et sauvegarde PostgreSQL. Sauvegarde : `/tmp/encg_before_public_portal_20261026.dump` dans le conteneur PostgreSQL, 1 243 496 octets, catalogue lisible par `pg_restore -l`. Sa restauration complète n'a pas été testée ici. Aucun changement de campagne, de compte utilisateur ou d'expéditeur email n'est inclus.

## Vérifications

- Suite admissions/calendrier/contenu : **39 tests, 296 assertions** réussis, journal `backend/storage/logs/public-portal-final-20261026.log`.
- Recette finale du contenu public : **9 tests, 44 assertions** réussis après ajout du contrôle privé avant publication, de l'échec de stockage et du brouillon sans dates. Couverture totale distincte : **41 tests backend** avec les 32 tests admissions/calendrier déjà exécutés.
- Frontend : **55 tests unitaires**, TypeScript et lint réussis. Dernier build de livraison réussi après nettoyage des libellés administratifs.
- Navigateur Chromium : **4 parcours** réussis : guide CNAEM et accès au dossier protégé ; demande avec référence et coordonnées configurées ; publication administrative et conflit de révision préservant la saisie ; affichage mobile d'un communiqué avec PDF, sans débordement horizontal.
- L'API publique réelle a été appelée en lecture seule via Nginx : réponse JSON avec contact, guides TAFEM/CNAEM et liste d'annonces, sans chemins de stockage ni paramètres privés. Aucun test n'a envoyé de demande ou d'email fictif en production.

Les instructions et les annonces sont des textes officiels saisis par l'établissement. L'interface présente les contenus tels qu'ils sont rédigés ; elle ne les traduit pas automatiquement.
