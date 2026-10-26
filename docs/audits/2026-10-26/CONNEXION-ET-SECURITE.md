# Connexion et sécurité — 26 octobre 2026

## Périmètre et résultat

Revue des connexions par mot de passe, du SSO OpenID Connect, de la double authentification, des cookies, de la récupération de compte et de la gestion des sessions. Corrections réalisées dans le code partagé, sans changer les comptes réels, les identifiants des fournisseurs ou l'expéditeur Resend. Cette recette ne constitue pas un test d'intrusion complet ni une validation du déploiement distant.

## Corrections

- Toute personne ayant activé la 2FA doit la fournir, quel que soit son rôle, y compris après une connexion SSO. Aucun jeton de session n'est créé avant la seconde étape.
- Suppression des codes maîtres de développement. Tolérance TOTP ramenée à un pas avant/après, et consommation des codes acceptés pendant 90 secondes pour limiter leur réutilisation.
- Challenges 2FA à usage unique, durée de dix minutes, plafond de cinq échecs, avec nouvelle vérification du compte actif, du mot de passe et du secret 2FA. Les vérifications concurrentes sont verrouillées.
- Codes de récupération corrigés : tirets et casse acceptés, consommation atomique sous verrou de la ligne utilisateur. La page de connexion permet réellement de les saisir ; le profil les présente pendant la configuration.
- Configuration 2FA protégée par le mot de passe actuel. Désactivation protégée par le mot de passe et un second facteur. Les autres sessions sont fermées après activation ou désactivation.
- Réinitialisation du mot de passe transactionnelle, limitée à une heure et à un usage. Les anciens jetons sont supprimés. Le changement volontaire remplace également la session actuelle et ferme les autres accès.
- Un compte désactivé ne peut plus utiliser ses anciens jetons ; ils sont révoqués lors du prochain accès.
- Cookies HttpOnly, avec Secure lorsque l'URL de l'application est HTTPS, la requête reconnue HTTPS ou l'environnement production. Sans « Se souvenir de moi », cookie de session ; avec cette option, persistance limitée à huit heures. Le jeton serveur reste limité à huit heures dans les deux cas.
- Vérification de l'Origin sur les requêtes d'écriture des navigateurs à partir des URLs configurées et des origines CORS autorisées. Les clients natifs sans Origin gardent leur authentification Bearer ; les jetons en query string restent ignorés. Cette protection complète SameSite et CORS et ne remplace pas une défense contre les XSS.
- Limitation des tentatives commune aux variantes de casse d'une adresse email ; limitation ajoutée aux opérations de gestion des mots de passe et de la 2FA. Les comptes authentifiés et challenges distincts ne partagent plus une seule clé vide derrière l'IP de l'établissement ; le plafond de cinq échecs par challenge reste indépendant de l'IP.
- SSO : signature cryptographique du jeton vérifiée avec les clés JWKS HTTPS du fournisseur, puis émetteur, audience, expiration et nonce. Google doit confirmer l'adresse email. La réponse userinfo éventuelle doit porter le même sujet.
- L'état SSO et le code d'échange sont liés au navigateur ; code d'échange valable deux minutes et consommé une seule fois. Un lien SSO existant ne peut pas être remplacé silencieusement par une identité différente. Aucun compte ERP n'est créé automatiquement par SSO.
- Les fournisseurs sans client ID, secret et URI de retour ne sont plus proposés. Échange SSO dédoublonné côté React pour éviter la consommation double en StrictMode.
- Profil : remplacement des appareils, localisations et boutons fictifs par les sessions réellement renvoyées par l'API. Révocation limitée aux jetons du propriétaire ; la session courante se ferme par Déconnexion. Aucune valeur de jeton n'est exposée dans la liste.
- Le choix de rôle local est effacé lors d'une nouvelle connexion/déconnexion. Réponses de connexion invalides refusées. Les raccourcis de démonstration exigent maintenant `VITE_ENABLE_DEMO_LOGIN=true` en développement.

## Méthodes disponibles

| Méthode | Conditions |
| --- | --- |
| Email et mot de passe | Compte ERP actif ; politique de mot de passe et limitation des tentatives |
| Application TOTP | Activation depuis le profil, validation par un code réel |
| Code de récupération | Secours pour une 2FA déjà activée ; chaque code fonctionne une fois |
| Google Workspace | Configuration OAuth complète, compte ERP existant et domaine autorisé |
| Microsoft 365 / OIDC institutionnel | Configuration institutionnelle à fournir et recette du fournisseur réel |

La 2FA demeure volontaire par défaut. `ENFORCE_2FA_STRICT=true` exige une configuration confirmée pour les administrateurs sur les routes sensibles déjà protégées par `require-admin-2fa`. Ce paramètre ne constitue pas une vérification OTP fraîche par opération. Ne l'activer qu'après l'enrôlement et la conservation des codes de secours par les administrateurs.

## État local observé, sans secrets

Lecture du conteneur local : environnement `local`, debug actif, URLs applicative et frontend en HTTP, proxies de confiance non renseignés. Google possède les paramètres requis ; Microsoft et OIDC ne les possèdent pas. La présence de paramètres ne prouve pas leur validité chez le fournisseur.

104 comptes actifs, zéro compte avec 2FA activée ; 53 jetons stockés dont 52 déjà expirés. Aucun de ces comptes ou jetons n'a été modifié par les tests. Les jetons expirés sont rejetés par Sanctum ; leur nettoyage peut être automatisé séparément.

## Avant une exposition en production

1. Appliquer au déploiement distant `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://…` et `FRONTEND_URL=https://…` avec le nom réel de l'établissement. Configurer précisément les proxies de confiance et les origines CORS, puis vérifier les cookies dans le navigateur public. Les valeurs locales ne permettent pas de certifier celles du serveur distant.
2. Enrôler d'abord les administrateurs en 2FA, conserver leurs codes hors ligne, essayer une récupération contrôlée, puis activer la politique obligatoire sur les opérations sensibles.
3. Réaliser une connexion Google réelle avec un compte de recette. Pour Microsoft, limiter le tenant à celui de l'université. Vérifier les URI de retour exactes chez chaque fournisseur. Les tests automatisés emploient des jetons signés de synthèse et des réponses HTTP simulées.
4. Ajouter une procédure administrative de récupération d'accès avec contrôle d'identité et trace d'audit, sans réintroduire de code maître. Prévoir ensuite les passkeys si l'établissement souhaite une connexion sans mot de passe.

## Vérifications

- Recette ciblée backend finale : **23 tests, 87 assertions**, réussis sur `encg_roles_remediation_test`. Aucun email réel envoyé ; faux comptes et fausses réponses des fournisseurs.
- Frontend : **55 tests unitaires**, TypeScript, lint et build réussis.
- Navigateur Chromium : **4 parcours**, réussis avec API simulée : transmission de remember, récupération 2FA, révocation réelle demandée à l'API et erreur de chargement des sessions.
- Recette élargie backend : **188 tests, 733 assertions**, réussis ; journal `backend/storage/logs/auth-security-final-20261026.log`. Les fichiers ciblés sont également exécutés explicitement, car la découverte de la suite ne les inclut pas tous. Deux avertissements de dépréciation PHP proviennent de la dépendance BaconQrCode ; aucune erreur de test.
