# Gestion des accès et préparation de production

## Fonctions livrées

Dans Administration → Utilisateurs → fiche d'un compte → Sécurité, un gestionnaire habilité peut fermer toutes les sessions, suspendre/réactiver le compte, imposer la 2FA individuellement, traiter la perte du second facteur ou envoyer un lien de réinitialisation.

Chaque intervention exige le mot de passe du gestionnaire, son second facteur s'il est activé, et un motif de dix caractères minimum. Les sessions du compte cible sont supprimées. L'historique présente les vingt dernières interventions, leur date, l'identifiant de l'agent, le motif et le nombre de sessions fermées. Ni mot de passe ni code OTP ne sont enregistrés dans cet historique.

Les permissions `users.manage` sont vérifiées côté serveur ; les lectures exigent `users.view` ou `users.manage`. Le périmètre est limité à l'établissement. Les comptes de direction restent soumis aux règles de délégation existantes. Une intervention sur soi-même est refusée ; un super administrateur ne peut pas être suspendu par ce panneau.

Le bouton auparavant fictif de réinitialisation ouvre désormais le formulaire sécurisé. Un échec ne déclenche plus de faux succès. L'envoi utilise le Mailable et la configuration Resend existants, sans changement d'expéditeur. Il reste à distinguer acceptation par le transport et livraison dans la boîte du destinataire.

## Déploiement progressif de la 2FA

La migration additive `2026_10_26_170000_add_two_factor_required_to_users.php` ajoute un booléen, faux par défaut. Elle a été appliquée seule après inspection SQL et sauvegarde PostgreSQL. Elle n'impose rien aux utilisateurs existants.

Pour chaque administrateur : vérifier l'adresse de récupération, choisir « Exiger la 2FA », puis accompagner la première connexion. Le compte doit configurer et confirmer une application TOTP avant d'accéder aux autres fonctions. La déconnexion et les routes nécessaires à l'enrôlement restent accessibles. Une 2FA obligatoire ne peut pas être désactivée volontairement.

Commencer par un compte pilote disposant d'un autre administrateur habilité comme secours. Ne pas imposer simultanément la politique aux derniers comptes d'administration disponibles.

## Téléphone perdu

1. Le titulaire essaie d'abord un code de récupération depuis la connexion.
2. À défaut, un gestionnaire vérifie son identité selon la procédure de l'établissement. Consigner une référence de contrôle, plutôt qu'une copie de pièce ou son numéro complet, dans le motif.
3. Choisir « Récupérer l'accès », confirmer le contrôle d'identité et appliquer l'intervention avec les identifiants du gestionnaire.
4. Les anciens secrets/codes sont supprimés, les sessions fermées, le changement du mot de passe et un nouvel enrôlement 2FA deviennent obligatoires.
5. Si le titulaire ne connaît plus son mot de passe, le gestionnaire peut également envoyer un lien de réinitialisation au moyen de l'action dédiée. Aucune adresse destinataire alternative ne peut être saisie dans ce formulaire.

Cette procédure exige un autre gestionnaire habilité. Elle n'ajoute aucun code maître, et ne traite pas une perte simultanée de tous les accès d'administration : prévoir un compte de secours institutionnel protégé.

## Vérification du déploiement

Commande en lecture seule :

```sh
php artisan security:auth-readiness --json
```

Le code de sortie 1 signifie qu'une condition contrôlée n'est pas satisfaite ; aucune configuration ni aucun compte n'est modifié. Ce diagnostic n'est pas un test d'intrusion.

État local relevé : environnement local, debug actif, URLs HTTP, sept administrateurs non enrôlés. Ces conditions sont signalées explicitement. Les valeurs du serveur distant ne sont pas connues de cette commande exécutée localement.

Pour le serveur public, préparer les valeurs réelles suivantes dans son gestionnaire de secrets/configuration :

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://DOMAINE_REEL
FRONTEND_URL=https://DOMAINE_REEL
TRUSTED_PROXIES=ADRESSES_DES_PROXIES_DE_CONFIANCE
```

Adapter les origines CORS et URI de retour Google/Microsoft au domaine réel. Ne pas copier les valeurs fictives ci-dessus. Après rechargement de la configuration du déploiement, inspecter les cookies dans le navigateur public et essayer une connexion sur un second appareil, sa révocation, une expiration et une récupération.

Contrôle externe en lecture seule : `https://erp.irsale.fr/login` répond HTTP 200 en HTTPS ; `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` et `Referrer-Policy: same-origin` sont présents. HSTS n'est pas présent dans cette réponse. Le profil Nginx de production contient déjà une politique HSTS, mais ce contrôle ne prouve pas que ce profil est celui du serveur public. Aucun rechargement du serveur distant n'a été effectué.

Google possède des paramètres locaux, mais une authentification interactive avec un compte de recette reste nécessaire. La recette automatisée des fournisseurs utilise des réponses simulées signées. Aucun email réel n'est envoyé par les tests de ce changement.

## Passkeys

Maintenues comme évolution ultérieure : choisir d'abord le domaine final, puis intégrer WebAuthn avec challenges à usage unique, contrôle de l'origine/RP ID, plusieurs clés par utilisateur et révocation. Ne pas présenter un bouton biométrique sans cette chaîne vérifiée.

## Sauvegarde

Sauvegarde avant migration : `/tmp/encg_before_account_security_20261026.dump` dans le conteneur PostgreSQL, 1 246 040 octets, catalogue vérifié par `pg_restore -l`. Sa restauration n'a pas été testée dans cette intervention. Elle reste hors du dépôt ; elle doit être transférée vers un stockage de sauvegarde privé dans le cadre de l'exploitation. Le contrôle automatique a refusé sa copie dans le workspace pour éviter un commit/déploiement accidentel de données sensibles.

## Recette

Base de recette : `encg_roles_remediation_test`, distincte de `encg_erp`. Authentification et SSO : 23 tests / 87 assertions ; cycle administratif : 8 tests / 49 assertions. Non-régression élargie : 188 tests / 733 assertions, réussis, journal `backend/storage/logs/account-security-final-20261026.log`.

Frontend : 55 tests unitaires, TypeScript, lint et build réussis. Navigateur : six parcours distincts réussis, dont quatre parcours de connexion/sessions et deux interventions administratives (succès et erreur). Des erreurs de routage/sélecteur dans le test synthétique ont été corrigées avant sa réexécution ; aucune réussite fictive n'a été conservée comme preuve.
