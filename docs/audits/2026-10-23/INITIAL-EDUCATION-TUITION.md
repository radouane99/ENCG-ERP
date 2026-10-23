# Gratuité de la formation initiale — TAFEM / CNAEM

Règle métier confirmée par le porteur du projet : formation initiale ENCG gratuite, quel que soit le concours d’accès ou le niveau d’entrée (TAFEM en première année ; CNAEM aux niveaux concernés). Les masters à temps aménagé, licences d’université et masters/diplômes d’université sont des cursus payants. Le régime dépend du cursus d’inscription, pas du concours passé autrefois par une personne.

## Corrections

- La page de réinscription gratuite affiche uniquement validation académique et confirmation annuelle. Aucune étape financière, mention de frais, facture, régie ou rappel de règlement, y compris lorsque le dossier attend encore la validation académique.
- Le backend ne consulte et ne retourne aucune facture pour le cursus gratuit. Une ancienne facture erronée ne peut pas bloquer la confirmation ; les champs de facture retournés sont nuls. La demande de simulation de paiement est interdite pour ce cursus.
- Création de facture et enregistrement de règlement refusés côté serveur pour les formations gratuites, même si le client forge les paramètres ou utilise une facture historique.
- Les factures historiques de cursus gratuits sont exclues des impayés et des relances de scolarité. Elles restent conservées dans la base pour réconciliation administrative ; aucune suppression ni transformation des paiements historiques.
- Le sélecteur financier propose uniquement les cursus payants et les étudiants ayant une inscription ou un parcours correspondant. Le contrôle serveur de l’année et du cursus reste obligatoire.
- La classification est centralisée dans LmdRules, réutilisée par Filiere et son filtre SQL. Les codes explicites master_temps_amenage, licence_universite, master_universite et diplome_universite sont disponibles ; les codes historiques restent compatibles.
- Le catalogue administratif présente explicitement gratuit/payant. L’API expose payment_required calculé par le serveur. La création de cursus et la modification du type sont réservées aux administrateurs/direction habilités, dans leur établissement ; la modification du type est journalisée.
- La recherche globale ne propose plus les raccourcis administratifs de régie au rôle étudiant, y compris lors du choix de rôle sur un compte disposant de plusieurs rôles.

Aucune migration ni modification de données métier nécessaire. Inventaire en lecture seule au moment de l’intervention : six filières existantes, toutes grande_ecole, donc gratuites. Aucun type n’a été changé automatiquement à partir du nom d’un diplôme ou du concours d’origine.

## Vérification

- Scénarios HTTP PostgreSQL synthétiques : TAFEM S1, CNAEM S5/S7, facture historique erronée, refus de facturation et de règlement, absence de relance, confirmation gratuite ; masters à temps aménagé, licence et master d’université nécessitant un règlement réellement vérifié ; restriction des changements de classification.
- Première suite ciblée : 19 tests, 209 assertions réussies avant ajout de la régression de permissions du catalogue.
- Frontend : 43 tests unitaires réussis, TypeScript et build réussis ; lint : zéro erreur, 210 avertissements existants.
- Chromium, API simulée : 13 tests réussis, incluant gratuité avant/après confirmation, maintien du parcours payant et raccourci régie absent pour l’étudiant, sur desktop et mobile.
- Suite complète PostgreSQL finale : **392 tests réussis, 1 449 assertions, zéro échec** (369,60 secondes).

## Recommandations suivantes

1. Séparer dans le catalogue le type de diplôme, le régime formation initiale/continue et le régime financier gratuit/payant, avec validation et historique, plutôt que multiplier les codes de type. Conserver la gratuité comme invariant de la formation initiale.
2. Ajouter aux seuls cursus payants un barème par année et des échéanciers, avec exonérations ou prises en charge explicitement approuvées.
3. Prévoir une liste administrative de rapprochement des anciennes factures erronées, avec annulation motivée et conservation du journal ; aucune suppression automatique.

Ces recommandations sont proposées pour une prochaine évolution ; les corrections ci-dessus sont déjà implémentées.