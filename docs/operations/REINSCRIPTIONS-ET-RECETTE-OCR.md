# Calendrier annuel et recette OCR

## Publier la réinscription

Dans `/admin/reinscriptions`, la scolarité dispose du panneau **Calendrier des réinscriptions**.

1. Vérifier l’année universitaire courante et les inscriptions pédagogiques préparées après les décisions académiques.
2. Renseigner l’ouverture, la clôture et les consignes publiques : guichet, horaires et pièces à présenter.
3. Choisir **Publier selon les dates**, puis enregistrer. Les dates sont inclusives, selon `Africa/Casablanca`.
4. Vérifier l’état affiché : préparation, ouverture programmée, ouverte, fermée ou délai dépassé.
5. Relancer les confirmations attendues depuis la liste filtrée pendant la campagne ouverte. Le contrôle physique des récépissés déjà confirmés peut continuer après clôture.

Une campagne absente ou en brouillon ne permet pas de nouvelle confirmation étudiante. La fermeture et le dépassement de date sont vérifiés côté serveur, même si le navigateur transmet un indicateur contraire. Un étudiant peut toujours consulter son récépissé existant ; une répétition de confirmation ne crée pas de nouveau récépissé.

Le calendrier ne décide ni du passage de niveau ni de la diplomation. Les dossiers académiques ambigus restent à rapprocher. La formation initiale TAFEM/CNAEM demeure gratuite ; les contrôles financiers des cursus payants restent séparés.

Les modifications concurrentes sont détectées par une version : après conflit, actualiser avant de reprendre la modification. Une année verrouillée ne permet pas de modifier son calendrier.

### Ancien automatisme

La commande `reinscription:ouvrir` est désormais un point d’entrée de compatibilité désactivé. Elle retourne une erreur explicite et ne modifie aucun étudiant, parcours ou année. Sa planification de juillet et l’ancienne relance à date fixe d’août ont été retirées. Une éventuelle tâche externe appelant encore cette commande doit être retirée lors du déploiement. Utiliser le calendrier et les relances du cockpit.

## Mesurer une extraction OCR

Accès : `/academic/enrollments` → **Campagnes & échéances** → **Recette OCR**.

La recette compare des annotations ; elle ne lance pas d’OCR. La mesure sur de vrais documents nécessite des résultats réellement extraits par le parcours OCR existant et une référence vérifiée humainement.

1. Sélectionner un échantillon autorisé et représentatif des types utilisés : bac, CNIE, relevés et justificatifs CNAEM. Inclure plusieurs niveaux de lisibilité et les langues réellement rencontrées.
2. Faire vérifier les valeurs attendues par un agent. Pour les identifiants et dates critiques, prévoir une seconde lecture en cas de doute. Un champ incertain ne doit pas être déclaré comme vérité de référence.
3. Extraire les valeurs par le parcours existant avec les consentements requis. Conserver les erreurs et les champs manquants dans l’échantillon ; ne pas sélectionner uniquement les documents réussis.
4. Télécharger le modèle JSON depuis l’interface. Remplacer les exemples par les paires `expected` / `extracted`. Les valeurs doivent être plates ; lorsqu’un moteur renvoie `{ "value": ... }`, copier cette valeur dans `extracted`.
5. Choisir `dataset_kind: "authorized_real"` pour un corpus réel autorisé. Garder `synthetic` pour une démonstration. Les identifiants de fichiers et documents bruts ne sont pas nécessaires dans ce fichier.
6. Importer le JSON et attester l’autorisation et la vérification humaine. Limites : 2 Mo, 500 échantillons, 12 champs par échantillon.
7. Examiner les champs exacts, absents et différents, ainsi que les écarts critiques CNE/CIN/date de naissance. Télécharger le rapport agrégé, puis analyser les erreurs dans le corpus privé.

La comparaison normalise la casse et les espaces ; les notes numériques acceptent virgule ou point décimal. Elle ne fait pas de rapprochement approximatif des identifiants. Employer le même format ISO pour les dates dans les deux colonnes. Seuls les champs annotés composent le dénominateur.

Le rapport est calculé sur le fichier fourni. Un résultat de démonstration ou un petit échantillon ne démontre pas la précision du moteur en production. Il ne produit aucune décision d’admission. L’outil n’appelle aucun fournisseur externe, ne conserve pas le fichier importé et n’inclut pas les valeurs personnelles dans le rapport.

La matrice opérationnelle des pièces proposée figure dans [MATRICE-PIECES-ET-PREUVES.md](MATRICE-PIECES-ET-PREUVES.md). Les durées de conservation, lieux et modalités de restitution restent à arrêter par l’établissement.
