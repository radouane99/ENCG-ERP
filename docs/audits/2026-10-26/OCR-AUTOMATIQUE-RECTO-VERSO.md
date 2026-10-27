# OCR automatique des dossiers d’admission

## Parcours candidat

1. Déposer le baccalauréat, la CNIE et le relevé de notes. Aucune case d’activation ni sélection de moteur OCR.
2. Pour la CNIE : sélectionner une photo recto puis une photo verso, ou un PDF contenant les deux faces. Les deux photos sont assemblées en une seule version PDF privée de deux pages. Une photo CNIE seule est refusée par l’API.
3. Le backend enregistre une extraction locale dans la même transaction que le document, puis programme le traitement après validation de la transaction. Un dépôt identique ne crée pas une deuxième extraction. La photo d’identité n’est pas traitée par OCR.
4. Les extractions de plusieurs documents sont suivies indépendamment. Les résultats d’une version retirée ou remplacée ne préremplissent pas le formulaire.
5. Les champs vides sont remplis et suivent la sauvegarde automatique existante. Une saisie présente n’est pas écrasée. Le candidat vérifie le dossier avant l’envoi.

## Données extraites

| Document | Données exploitables lorsqu’elles sont imprimées et lisibles |
| --- | --- |
| CNIE recto/verso | CIN, noms/prénoms FR/AR, naissance, lieu de naissance FR/AR, adresse de résidence FR/AR, sexe, nationalité si présente |
| Bac | CIN, Massar/CNE, identité, série/spécialité avec son option, mention imprimée, année, établissement, académie et province de l’établissement |
| Relevé | Identité, CIN/Massar, série/spécialité, moyenne générale, régionale, nationale et contrôle continu lorsqu’ils figurent sur le document |

La CIN et le CNE extraits sont comparés aux identifiants officiels existants ; ils ne réécrivent pas l’identité du compte. Les différences sont signalées à la revue. Le lieu de naissance, le lieu de résidence et la province du lycée sont des informations distinctes. Une mention n’est pas calculée à partir d’une moyenne ; une traduction absente n’est pas inventée.

Les clés de sortie des anciens parseurs (`moyenne_bac`, `mention`, `birth_city_fr`, `address_fr`, etc.) sont converties en champs canoniques. Les limites du formulaire et les bornes de notes sont contrôlées. Les fins de ligne et les accents sont conservés pour séparer les rubriques et les deux faces.

## Exploitation et limites

Le parcours automatique utilise le traitement local, sans appel à un fournisseur cloud. Le traitement nécessite le worker de file d’attente habituel. Le mode cloud explicite existant reste distinct et n’est pas activé automatiquement par le dépôt.

Une image floue, une face absente ou un modèle de document non reconnu peut laisser des champs vides. Le dossier reste enregistré ; les propositions sont à vérifier et les champs manquants peuvent être complétés. La reconnaissance ne prouve pas l’authenticité d’une pièce.

Les styles existants sont conservés. Les nouveaux contrôles CNIE reprennent les mêmes champs, couleurs et espacements.

## Vérifications

- Suite de workflow admission et parseur : 35 tests, 312 assertions réussis sur base de test.
- Vérification ciblée après normalisation du sexe, conservation de l’option et refus du recto seul : 6 tests, 40 assertions réussis.
- Vitest admission : 5 tests réussis, dont les adresses FR/AR et les moyennes séparées.
- Scénario navigateur : CNIE recto puis verso, dépôt du bac pendant l’extraction et récupération des deux résultats, sans appel explicite du navigateur à l’API de démarrage OCR.
- Scénarios navigateur existants : OCR desktop/mobile, QR, autosave, conflit, revue finale FR/AR et contrôle des images.
- TypeScript, lint et build frontend vérifiés.

Les documents des tests sont synthétiques ; aucune mesure de précision sur un corpus de pièces réelles n’est revendiquée.
