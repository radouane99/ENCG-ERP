# Accueil public et programmation des admissions

## Comportement livré

Le popup automatique qui annonçait systématiquement une session ouverte, avec une année universitaire figée, est supprimé. Le calendrier visible dans l'accueil et la page d'inscription est désormais calculé par le backend à partir des campagnes enregistrées par l'administration.

| Configuration administrative | Affichage public et création de dossier |
| --- | --- |
| Brouillon | Campagne invisible, aucun accès à l'inscription pour cette campagne |
| Publiée, avant la date d'ouverture | Prochaine ouverture et dates officielles ; aucun formulaire de création |
| Publiée, pendant la période | Inscriptions ouvertes ; accès à la campagne sélectionnée |
| Publiée, après la clôture | Inscriptions fermées ; aucune nouvelle création |
| Fermée manuellement | Campagne fermée côté serveur, même si sa date de clôture est future |
| Calendrier indisponible | Message d'indisponibilité et réessai ; aucune ouverture inventée |

L'ouverture intervient à 00 h 00 à la date de début, et la clôture après la totalité du dernier jour, dans le fuseau `Africa/Casablanca`. Les dates sont des jours entiers, comme dans le formulaire existant ; aucune heure arbitraire supplémentaire n'a été introduite.

Le calendrier est revérifié au retour sur l'onglet et au plus toutes les 60 secondes quand il est visible. Une actualisation est également prévue à la prochaine limite programmée. L'interdiction serveur s'applique indépendamment de ce délai d'affichage. Les protections de limitation des requêtes publiques sont conservées.

## Administration seule responsable de la programmation

Chemin : Admissions et nouvelles inscriptions → Campagne et concours → Campagnes et échéances. Choisir la campagne, définir les dates, puis :

- **Brouillon** pour préparer sans publier.
- **Publiée — selon les dates** pour annoncer une ouverture future ou accepter les dossiers pendant la période.
- **Fermée** pour arrêter les inscriptions immédiatement côté serveur.

Aucun changement automatique des dates, du statut ou des dossiers existants n'a été effectué. La campagne locale actuelle « Concours TAFEM 2026 » est configurée du 01/01/2026 au 31/12/2026 : le calendrier la considère donc ouverte pendant cette période. À la demande de l'utilisateur, seule l'administration décide de modifier cette programmation ; aucune nouvelle échéance n'a été inventée par l'agent.

## Parcours du candidat

Chaque session affiche son concours, son niveau d'entrée et ses dates. Le lien transporte l'identifiant de campagne jusqu'à l'activation ou à la création du compte. TAFEM et CNAEM sont distingués. Une campagne future plus récemment créée ne masque plus une campagne déjà ouverte.

Les comptes et dossiers déjà existants gardent leur lien de connexion et leur suivi après la fin des inscriptions. Les liens personnels d'activation continuent d'être contrôlés par leur parcours serveur existant.

Le backend vérifie l'établissement et les dates, même si un visiteur tente d'appeler directement l'API. Les brouillons et les campagnes d'une autre institution ne sont pas exposés. L'année courante du cursus ne remplace plus le choix de campagne lors d'une nouvelle admission : une campagne de rentrée suivante peut accepter des dossiers lorsque l'administration l'a programmée.

## Organisation de l'accueil

L'accueil présente le portail de l'établissement, le calendrier admissions, les espaces par rôle, les questions fréquentes, l'assistance et les contacts. Les blocs promotionnels redondants, la roadmap interne et les témoignages non établis sont retirés de cette page. Les éléments visuels ne prétendent plus utiliser une blockchain ; la décision pédagogique illustrée renvoie au jury plutôt qu'à une compensation inventée.

Affichage français, anglais et arabe pour le calendrier, avec disposition RTL. Sur la page d'inscription, le même calendrier utilise une présentation compacte.

## Vérifications

- Backend : **32 tests / 261 assertions**, réussis pour le calendrier et les admissions. Contrôles : brouillon, ouverture future, limites à minuit, fermeture manuelle, isolation institutionnelle, accès API direct et coexistence de campagnes TAFEM/CNAEM.
- Une régression existante de l'OCR a été révélée par cette exécution : dépendance à `cal_days_in_month()` alors que l'extension PHP correspondante n'est pas installée. Le contrôle est remplacé par `checkdate()`, intégré à PHP ; la suite admissions/OCR repasse.
- Frontend : **55 tests unitaires**, TypeScript, lint et build final réussis. **Cinq parcours Chromium** réussis : fermé sans popup, prochaine ouverture sans création de compte, transmission de la campagne et fermeture administrative, erreur réseau sans statut inventé, et formulaire sur écran mobile de 390 px sans débordement. Les captures desktop et mobile ont été inspectées.
- L'appel HTTP effectué depuis le conteneur Nginx vers l'API réelle a renvoyé le calendrier de la campagne locale, confirmant le branchement au backend. Le contrôle HTTPS depuis l'hôte a expiré après 15 secondes : il ne constitue pas une validation du trajet public distant.

Aucune migration ni modification des campagnes réelles n'est nécessaire pour cette évolution.
