# Documents PDF : présentation et traçabilité

## Fonctionnement livré

Le binding Laravel `dompdf.wrapper` est désormais adapté par `RegisteredPdf`. Les appels existants à la façade PDF et à `OfficialPdfFactory` passent par le même registre, sans déplacer les modèles métier ni remplacer les anciennes pièces archivées.

- Présentation commune : bleu ENCG, logo, en-tête, marges réservées, pagination, identifiant et QR en pied de page. Formats portrait, paysage, A3 et carte CR80 adaptés à leur surface.
- Identifiant numérique de 18 chiffres conservé comme chaîne : date de création suivie de l'identifiant du registre sur dix positions. Exemple de forme : `202610250000000123`.
- QR contenant un jeton opaque, distinct du CNE et de l'identifiant séquentiel. La page publique expose seulement le type générique, l'état, la date, le nombre de pages et l'empreinte du fichier émis. Aucun nom, CIN, CNE ou PDF personnel n'y est publié.
- Archivage privé du PDF exact avec SHA-256. Un téléchargement depuis le registre restitue les octets archivés et contrôle leur empreinte.
- Contenu rendu identique, même établissement et même papier : réutilisation de la même référence et de la même archive. Un contenu différent, y compris une date d'édition différente dans le modèle, constitue une nouvelle édition.
- Retrait motivé et historisé : conservation de l'archive, téléchargement bloqué et QR affichant le retrait. Une référence retirée ne peut pas être réémise à l'identique.
- Les tâches différées `GenerateOfficialPdfJob` emportent le contexte établissement/auteur. Un établissement inconnu n'est pas attribué arbitrairement.

## Interface

`/admin/document-registry`, également accessible dans le menu Scolarité, permet de rechercher une référence exacte, filtrer son état, récupérer l'archive et retirer une référence avec motif. L'API applique le rôle et le périmètre établissement à chaque action.

`/verify/document/DOC-…` permet la comparaison SHA-256 d'un fichier avec son archive. Le calcul se fait dans le navigateur : aucun fichier n'est téléversé. Une numérisation papier ou un PDF réenregistré peut avoir une empreinte différente ; demander l'original au service émetteur.

Les impressions de PV utilisent maintenant leur export PDF serveur. L'ancien certificat HTML du registre des diplômes, qui dessinait un faux QR et affirmait des garanties non vérifiées, est remplacé par un extrait PDF des données effectivement stockées, avec contrôle d'accès. Cet extrait ne prouve pas un ancrage blockchain externe. Le reste du module blockchain n'est pas certifié par cette intervention.

## Corrections de présentation

Les modèles existants ont reçu la palette commune et des valeurs « Non renseigné » à la place de plusieurs identités de démonstration utilisées comme valeurs par défaut. Les signatures SVG fictives et affirmations de signature certifiée ont été remplacées par des emplacements de visa. Les signatures réellement fournies restent distinctes du registre.

Révision visuelle : attestations de scolarité et de travail, convocation, préinscription, planning des examens, emploi du temps léger et dense, rapport de quatre pages et carte CR80. Suppression des pages orphelines des attestations et de la préinscription, correction du bloc de signature de convocation. Les grilles officielles trop denses échouent explicitement plutôt que masquer des lignes.

## Conservation et exploitation

Migration additive : `2026_10_26_080000_create_pdf_document_records.php`, appliquée après sauvegarde PostgreSQL. Vérification de conservation : 157 tables antérieures inchangées, 1721 notes conservées.

Sauvegarde avant migration : `storage/app/private/database-backups/encg_20261025_211044_8035c11a.dump`, SHA-256 `df9d57dc6e5aa55c6d6728ab993a8addbc3e6741619a594c56c28e86e8d4c516`.

Les sauvegardes d'exploitation doivent conserver ensemble la base et le disque privé `pdf-registry/`. Les QR SVG sont régénérables ; les PDF archivés constituent les exemplaires de référence. Le déploiement doit charger le nouveau code dans les workers de queue. Aucun envoi réel d'email n'a été déclenché pour cette recette.

## Limites explicites

- La référence et l'empreinte assurent la traçabilité du fichier ; elles ne remplacent pas une signature électronique qualifiée, une décision administrative ou un visa.
- Les anciennes archives et les pièces originales déposées par les étudiants ne sont pas réécrites. Les anciennes routes de vérification restent compatibles.
- Une impression du navigateur d'un écran quelconque reste une copie écran : utiliser les exports PDF serveur pour obtenir une pièce enregistrée.
- Les exemples dans `output/pdf/` contiennent des données synthétiques et un filigrane DÉMONSTRATION. Leurs QR proviennent de transactions de test annulées et ne constituent pas des références de production.
- Une recette sur papier, lecture QR par téléphone et impression PVC reste nécessaire avec les équipements réels. Les tests automatisés ne remplacent pas ces essais.

## Validation

Les tests couvrent l'archive stable, les versions distinctes, le retrait, l'absence de données personnelles publiques, le refus aux étudiants, l'intégrité de l'archive, le contexte des jobs, les dimensions CR80/A3 et les vrais modèles Blade. Les tests navigateur couvrent le hash exact/modifié et le retrait après refus serveur.

- Suite générale Pest : 184 tests, 707 assertions, réussie (`pdf-registry-final-20261025.log`).
- Suite dédiée PHPUnit `PdfDocumentRegistryTest` : 10 tests, 56 assertions, réussie.
- Playwright registre PDF : 3 scénarios réussis, API synthétique isolée.
- Frontend : 55 tests unitaires réussis ; TypeScript, lint, design:check et build réussis avant les éventuels changements indépendants ultérieurs du projet.
- Neuf formats de recette, douze pages au total ; référence vérifiée sur chaque page et conservation des 90 lignes du rapport contrôlée. Métadonnées et empreintes : `pdf-samples-qa.json`.

Les avertissements PHP 8.4 de nullabilité de la dépendance QR restent présents ; ils n'ont pas bloqué les éditions. La recette ne revendique pas une signature qualifiée ni une intégration blockchain validée.
