# Préinscription assistée et contrôle au guichet

## Parcours candidat

1. La scolarité ouvre une campagne pour un établissement, une formation initiale et une entrée TAFEM S1 ou CNAEM S5/S7. La liste officielle et les identifiants sont rapprochés avant activation du compte personnel.
2. Le candidat ouvre son dossier. La section des pièces apparaît en premier : bac, CNIE recto/verso, relevé et photo, ainsi que les justificatifs du parcours antérieur exigés pour CNAEM.
3. Il peut autoriser le préremplissage avant le dépôt. Chaque nouvelle pièce documentaire lance alors le traitement local existant ; la photo ne passe pas par OCR. Sans autorisation, la saisie manuelle fonctionne. Le cloud reste optionnel, selon la configuration institutionnelle et le choix explicite du candidat.
4. Les résultats remplissent les champs vides autorisés. Une saisie existante est conservée. Le bouton de report groupé permet de reprendre les propositions après comparaison avec la pièce. Massar/CNE, CIN et décisions administratives restent exclus de toute modification OCR.
5. Les propositions restent un brouillon à vérifier, compléter et enregistrer. Une erreur d’extraction ne supprime pas la pièce déposée. Les résultats d’une pièce remplacée ou retirée ne sont plus proposés dans son écran.
6. Après dépôt complet et soumission acceptée par le serveur, la fiche PDF de préinscription est accessible depuis le dossier. Elle contient la photo privée courante, les informations déclarées, le Massar/CNE, la référence, la campagne, l’établissement et la formation.

## QR et contrôle physique

Le QR est généré localement, sans service QR externe. Il contient une URL vers `/academic/enrollments` avec campagne, identifiant du dossier et Massar/CNE. Le Massar est aussi imprimé pour recherche manuelle.

L’agent scanne ce QR avec son lecteur habituel ou son téléphone. Sa connexion professionnelle est obligatoire. Le lien reprend le dossier après connexion par mot de passe, y compris après double authentification. Les restrictions de rôle et d’établissement restent appliquées par le serveur ; le QR ne donne pas un accès public aux pièces.

La scolarité compare chaque document numérique avec les originaux, enregistre la revue de la version courante, puis complète le contrôle physique propre à TAFEM ou CNAEM. L’inscription définitive exige les preuves et le numéro APOGEE officiel. Le QR de dossier n’enregistre pas automatiquement une présence et ne remplace pas le QR du rendez-vous.

La fiche confirme un dépôt ; elle ne contient ni signature inventée ni certification automatique d’authenticité. Les formations initiales TAFEM/CNAEM restent gratuites.

## Exploitation

- Vérifier `FRONTEND_URL` avant mise en production : le QR doit pointer vers le portail de l’établissement.
- Le worker Horizon doit être actif. Le moteur local utilise les outils PDF et Tesseract, disponibles localement avec les langues française, arabe et anglaise.
- La lecture de scans réels doit être évaluée sur un corpus autorisé. Aucun taux de précision sur de vrais documents n’est revendiqué par les tests synthétiques.
- En cas de document illisible, conserver la saisie manuelle et demander une nouvelle version lisible, puis effectuer le rapprochement humain.

## Continuité en cas de défaillance IA

Le résultat local est normalisé avant l’appel cloud. Un échec réseau ou timeout, une limitation de débit, une erreur du fournisseur, un JSON invalide ou une réponse sans champs utilisables conserve ce résultat. Le traitement se termine avec des propositions à vérifier, plutôt qu’avec un échec empêchant leur consultation.

L’appel IA conserve ses limites de 3 secondes pour la connexion et de 8 secondes pour la réponse, sans nouvelle tentative automatique. Une réponse partielle ne remplace que les valeurs autorisées, non vides et normalisées ; les champs manquants, imbriqués, inconnus ou invalides n’effacent pas les valeurs locales. Les détails de l’exception fournisseur ne sont ni retournés au candidat ni ajoutés aux journaux par ce traitement.

Les tests de continuité simulent le fournisseur ; ils ne transmettent aucune pièce réelle. Un test d’image scannée passe également par le vrai moteur Tesseract local avec une image synthétique issue d’un PDF, distinct du test de lecture du texte PDF.

## Validation locale du 24 octobre 2026

- 34 tests backend, 293 assertions : admission, OCR local réel sur PDF synthétique, propriété du dossier, versions des pièces, autorisations, PDF privé avec photo et QR, TAFEM/CNAEM et contrôle physique.
- 46 tests unitaires frontend réussis, dont protection du préremplissage et restriction du retour de connexion.
- Parcours navigateur sur desktop et mobile : préremplissage avec API simulée, conservation de la saisie, accès direct au dossier, contrôle physique CNAEM et réinscription distincte.
- PDF synthétique rendu et inspecté : une page A4, photo incorporée depuis le stockage privé, QR et informations lisibles.
- Horizon local en fonctionnement ; outils OCR et langues vérifiés. Aucune publication de calendrier, aucun déploiement ni envoi de document réel à un fournisseur pendant cette intervention.
