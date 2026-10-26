# Harmonisation visuelle du portail public

## Changements

- Palette institutionnelle bleu ENCG, fonds clairs et accent doré limité aux repères. Thème sombre cohérent avec les couleurs de l'application.
- Styles partagés dans `frontend/src/features/public/public-portal.css` : surfaces, boutons, titres, pictogrammes, états, onglets et listes de documents. Classes dédiées au portail, sans remplacement global du thème ERP.
- Guide avec étapes numérotées reliées visuellement et colonne séparée pour les pièces sur ordinateur ; disposition verticale sur téléphone.
- Annonces avec bordure d'accent, hiérarchie titre/texte/date et action PDF identifiable. Badges distincts pour ouvert, prochaine ouverture et fermé.
- Formulaires d'administration, annonces et boîte des demandes alignés sur les mêmes surfaces et boutons, avec titres adaptés au contexte administratif.
- Typographie et espacement des sections harmonisés ; animations décoratives réduites. La texture du fond utilise du CSS local plutôt qu'une image externe.
- Navigation dédiée sur téléphone et tablette, fermeture après sélection ou touche Échap, choix de langue dans le menu mobile. Accès clavier visible et prise en compte de la réduction des animations.

La programmation, les autorisations et les contrôles serveur restent les sources de vérité pour les admissions et publications.

## Validation

- TypeScript, lint et build de livraison réussis ; 55 tests unitaires réussis.
- 11 scénarios de navigateur distincts vérifiés : cinq scénarios calendrier/inscription et six scénarios contenu public/administration, dont thème sombre et navigation téléphone/tablette.
- Captures inspectées sur ordinateur, téléphone de 390 px et tablette de 820 px. Les captures utilisent des données de recette, pas des dossiers réels.

## Aperçus

- `public-design-guide-desktop.png` : guide sur ordinateur.
- `public-design-guide-dark.png` : guide en thème sombre.
- `public-design-mobile-navigation.png` : navigation sur téléphone.
- `public-design-admin-editor.png` : formulaire d'administration et publication.
