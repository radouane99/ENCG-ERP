# Releases Docker et CI/CD

Le workflow manuel « Deploy ENCG-ERP to Production » exécute le workflow CI complet, publie deux images dans GHCR, bloque les vulnérabilités HIGH et CRITICAL, puis valide les mêmes digests sur une stack isolée. La production reçoit ces digests après les validations.

## Préparer le serveur

- Installer Docker et Compose 2.24.4 ou supérieur, Git, Bash, Python 3, curl et flock.
- Cloner le dépôt dans `/opt/encg-erp`. Le compte de déploiement doit accéder au dépôt et à Docker.
- Renseigner `backend/.env.production` et conserver la même APP_KEY entre les releases.
- Configurer la lecture des images GHCR sur le serveur avec un compte ayant uniquement les droits nécessaires.
- Provisionner le certificat TLS dans `certbot/conf/live/encg-erp/`, utilisé par la configuration Nginx de production.
- Prévoir un espace disque suffisant pour les sauvegardes de PostgreSQL, les documents et les images précédentes.

## Paramètres GitHub

Créer les environnements `staging` et `production`. Configurer les branches autorisées et, selon les protections disponibles dans le dépôt, les validations humaines pour production.

Les secrets de l’environnement production sont `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` et `DEPLOY_HOST_FINGERPRINT`. Vérifier l’empreinte SSH par un canal de confiance avant de la renseigner. Le workflow utilise son GITHUB_TOKEN pour publier les packages GHCR. Le serveur utilise ses propres identifiants de lecture.

Configurer les variables publiques de dépôt `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT` et `VITE_SENTRY_DSN` si ces services sont utilisés. La clé publique Reverb doit correspondre à la configuration du backend. Ces valeurs sont intégrées au JavaScript et aux métadonnées de construction. Les clés privées des fournisseurs restent dans l’environnement backend.

## Déroulement d’une release

1. La CI vérifie PostgreSQL, les tests frontend, les parcours navigateur, les audits de dépendances et une restauration isolée.
2. Les images backend et web sont construites avec un tag de commit, un inventaire SBOM et une attestation de provenance. Les scans précèdent la validation staging.
3. Une base et un stockage temporaires reçoivent les migrations. Un compte synthétique est créé uniquement dans cette base de test. Les vérifications couvrent HTTP, la page de connexion, la connexion réelle, les permissions, la déconnexion et le traitement d’un job synthétique par le worker.
4. Le serveur vérifie le manifeste, récupère les images et place l’application en maintenance. Les workers sont arrêtés avant la sauvegarde.
5. PostgreSQL et le stockage documentaire `storage/app` sont sauvegardés dans `.deploy/backups/`. Les migrations sont exécutées avec la nouvelle image.
6. Les services sont relancés, leurs caches sont préparés et les vérifications HTTP et worker sont exécutées.
7. Le manifeste validé devient `.deploy/current.env`. Le précédent est conservé dans `.deploy/previous.env`.

Une défaillance bloque la promotion du manifeste. Vérifier les logs et la maintenance avant de rétablir l’accès. Les sauvegardes locales doivent aussi être répliquées vers un stockage externe selon la politique d’exploitation.

## Revenir à une release précédente

Un retour automatique par manifeste devient disponible après l’enregistrement d’une première release validée. Préparer une procédure de reprise du déploiement antérieur lors de la première bascule vers ce mécanisme.

Après avoir vérifié la compatibilité du schéma courant avec l’ancienne application, lancer la commande suivante sur le serveur depuis le dépôt.

```bash
bash deploy.sh --rollback
```

Le rollback restaure les références d’images et le commit précédents, puis refait les vérifications. Lorsqu’un déploiement est resté en attente d’achèvement, il utilise le dernier manifeste validé. Il sauvegarde les données courantes et conserve le schéma courant. Les migrations de release doivent donc être compatibles avec le retour de l’application précédente, en procédant par ajout puis retrait dans une release ultérieure.

Une restauration de base nécessite une procédure de reprise distincte, après évaluation des écritures réalisées depuis la sauvegarde. Le test `scripts/restore-postgres-drill.sh` vérifie un dump dans une base séparée.

## Vérifications locales

```bash
bash scripts/validate-release-config.sh
python3 -m unittest discover -s scripts/tests
```

Ces commandes et les tests simulés de déploiement valident la configuration et plusieurs échecs partiels. La publication GHCR, les protections GitHub, SSH et TLS doivent être vérifiés dans l’environnement d’hébergement choisi.
