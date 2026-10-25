# Design commun de l’ERP ENCG

## Règles communes

Le socle visuel est partagé par les espaces administration, professeur, étudiant et les formulaires d’authentification/admission. Les gabarits documentaires/PDF, les aperçus officiels et la composition éditoriale de la page publique conservent leur mise en page propre.

| Élément | Règle |
|---|---|
| Marque | Bleu ENCG `#1A3673`, bleu profond `#142959`, rouge d’accent `#A31F24` |
| Surfaces | `background`, `card`, `muted`, `border`; adaptation automatique au thème |
| Texte | Inter, avec Noto Sans Arabic et polices système en repli; monospace conservé pour les données pertinentes |
| Titre de page | `erp-page-title`, 22–28 px selon la largeur, graisse 700; même règle dans `PageHeader` |
| Bandeau institutionnel | `erp-page-banner`, dégradé bleu commun; textes clairs et contenus existants conservés |
| Cartes | Surface sémantique, bordure discrète, rayon 16 px et ombre légère |
| Champs | Rayon 10 px, hauteur par défaut 44 px, focus visible; 16 px sur mobile pour éviter le zoom automatique |
| Actions | `Button` et variantes communes; bleu pour l’action principale, rouge pour une action destructive, vert pour le succès |
| États | Succès, avertissement et erreur gardent des couleurs distinctes, accompagnées de libellés |
| Tableaux | En-têtes lisibles, bordures et surfaces communes, alignement logique compatible RTL, défilement dans leur conteneur |
| Navigation | Sidebar et navigation mobile sur la même palette; avatar de compte cohérent avec la marque |

L’interface conserve ses différences fonctionnelles : une page de planning, une liste et un dashboard n’ont pas besoin de la même composition pour partager le même design system.

## Mise en œuvre

- Tokens globaux : `frontend/src/index.css` et `frontend/src/shared/design-system/tokens.ts`.
- Composants de présentation : `frontend/src/shared/design-system/workspace.css`.
- Composants canoniques : `PageHeader`, `Button`, `Input`, `Card`, `StatCard`, `Badge`, `Table` et `AppShell`.
- Migration des classes sur plus de 260 fichiers de fonctionnalités, environ 200 fichiers portant des titres harmonisés et 90 bandeaux institutionnels. Les styles utilisent les couleurs sémantiques pour éviter les cartes blanches et textes sombres figés dans le thème sombre.
- Correction des anciennes classes de badge contenant des expressions `color-mix` non valides dans les utilitaires, ainsi que des couleurs presque transparentes. Les selects natifs ne forcent plus leur géométrie avec des règles `!important`; les sélections multiples gardent leur comportement natif.
- Les classes de présentation ont été modifiées via l’AST JSX, sans remplacement global dans les routes, libellés ou gestionnaires. Les expressions de concaténation de classes sont laissées intactes pour préserver leurs espaces significatifs. Une écriture transitoirement bloquée par le montage Windows est réessayée.
- Le titre des examens précède maintenant le cockpit de préparation. Un retour API de suivi mal formé ne bloque plus tout le dashboard : il produit un état d’indisponibilité local.

## Maintenir la cohérence

Pour une nouvelle page, réutiliser `PageHeader` et les composants partagés, les surfaces `bg-card`/`bg-muted`, les textes `text-foreground`/`text-muted-foreground` et les variantes sémantiques. Éviter de recréer une palette bleue, un bouton ou une carte propres à chaque module. Conserver les couleurs distinctes nécessaires aux graphiques et aux états métier.

Le contrôle ciblé se lance avec :

```text
docker exec encg_frontend npm run design:check
```

Il détecte le retour des anciennes classes couvertes par la migration. Ce contrôle ne remplace pas la vérification visuelle et ne prétend pas valider toutes les combinaisons CSS possibles.

## Vérifications

Les 55 tests unitaires frontend ont réussi. La compilation TypeScript, le lint et le build de production ont réussi pendant la passe. La dernière exécution globale est détaillée ci-dessous après sa fin.

Les tests visuels dédiés parcourent les trois profils, chacun en clair/sombre et sur desktop/mobile. Ils contrôlent la taille et la graisse du titre, le partage du layout, les débordements horizontaux et les contrastes des paires de couleurs sémantiques (ratio minimal 4,5). Un scénario contrôle la géométrie des champs natifs en RTL.

Les scénarios de non-régression couvrent aussi login, admissions, documents, notes, examens, réinscription, affectations, appel et préparation du semestre. Les réponses API navigateur sont synthétiques. Tous les états de tous les écrans n’ont pas été inspectés manuellement : les captures représentent des écrans sélectionnés.

Dernière exécution : **58 scénarios Chromium réussis**, dont 15 consacrés au design (12 vues des profils, deux mesures de contrastes et un scénario RTL). Les 55 tests unitaires ont également réussi. TypeScript et build de production réussis; lint sur 507 fichiers sans erreur ni avertissement. `design:check` ne détecte plus de classe à migrer dans son périmètre. `git diff --check` ne relève plus d’erreur de whitespace.

Les modifications de fonctionnalités concernent **265 fichiers**. L’inventaire détecte 203 fichiers utilisant explicitement `erp-page-title` et 90 fichiers utilisant `erp-page-banner`; le composant partagé `PageHeader` complète ce périmètre. Ces nombres désignent des fichiers, pas un décompte certifié des routes.

Captures représentatives avec données synthétiques :

- [Administration, clair](screenshots/design-admin-light-desktop.png)
- [Administration, sombre](screenshots/design-admin-dark-desktop.png)
- [Étudiant, mobile](screenshots/design-student-light-mobile.png)
- [Professeur, mobile sombre](screenshots/design-professor-dark-mobile.png)

Les douze captures sont conservées dans le même répertoire. Les aperçus ont été produits par les vraies pages React du build de production; les réponses métier des scénarios sont simulées.

Aucune modification du schéma ou des données backend n’est nécessaire pour ce travail de présentation. Aucun déploiement distant effectué.
