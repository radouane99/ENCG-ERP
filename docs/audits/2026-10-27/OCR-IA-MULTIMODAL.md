# Extraction IA multimodale des admissions

Le dépôt programme automatiquement un traitement cloud lorsque la politique de l’établissement l’autorise et qu’un fournisseur est configuré. Sinon, le traitement local reste disponible. Le candidat ne choisit pas le moteur. Les styles existants sont conservés.

## Fournisseurs

1. Gemini reçoit le document PDF ou l’image directement en données intégrées, avec une réponse JSON demandée. Le traitement ne dépend plus uniquement du texte reconnu par Tesseract.
2. Si Gemini est absent, indisponible ou ne produit aucun champ exploitable, Groq Vision reçoit les images du document. Les PDF sont convertis temporairement en pages JPEG privées, par lots de trois images, puis les images temporaires sont supprimées.
3. Les résultats locaux restent disponibles si les fournisseurs refusent la demande, atteignent leur quota, dépassent le délai ou renvoient un JSON inexploitable. Une valeur cloud manquante ou invalide n’efface pas une valeur locale exploitable.

Les instructions imposent des valeurs imprimées, sans traduction inventée, décision d’admission ni calcul de mention. Les réponses passent par la liste des champs admis, la normalisation des identifiants/dates/notes et les limites du formulaire. La provenance document/version reste attachée à chaque proposition. Les champs administratifs et les données de santé ne deviennent pas éditables via les réponses IA.

## Configuration serveur

| Variable | Rôle |
| --- | --- |
| `GEMINI_API_KEY` | Secret Gemini ; ajouté par l’utilisateur et chargé dans le backend et le worker |
| `GEMINI_OCR_MODEL` | Modèle multimodal configurable ; `gemini-3.5-flash` validé et sélectionné dans cet environnement |
| `GROQ_API_KEY` | Secret Groq ; présent dans le backend vérifié |
| `GROQ_VISION_MODEL` | Modèle OCR visuel, défaut `qwen/qwen3.8-27b` |
| `GROQ_MODEL` | Modèle de génération général existant, distinct du modèle de vision |

Les modèles sont configurables. Les API et formats suivent les documentations [Gemini documents](https://ai.google.dev/gemini-api/docs/document-processing) et [Groq Vision](https://console.groq.com/docs/vision). Le fournisseur présent dans ce projet est **Groq**, distinct de Grok/xAI.

Les clés et les corps de requête/réponse ne sont pas journalisés ni exposés au navigateur. Les fichiers sont transmis directement aux API fixes des fournisseurs, sans rendre leur URL de stockage publique. La politique cloud peut être désactivée par l’administration.

## Bornes d’exécution

- Budget des tentatives cloud : 28 secondes ; une tentative par fournisseur et des délais réseau bornés.
- Extraction locale bornée à 15 secondes dans un traitement cloud et à 35 secondes dans un traitement purement local.
- Job : 55 secondes, sous le délai Horizon existant de 60 secondes et le délai de remise en file de 90 secondes.
- Secours Groq sur PDF : six premières pages au maximum, avec avertissement si le PDF contient davantage de pages. Avertissement également si le budget empêche de traiter tous les lots.
- Le contrôle humain avant soumission reste nécessaire ; aucune garantie de précision universelle n’est revendiquée.

## Vérification réelle ciblée

Une requête réelle à Groq Vision, avec un PDF entièrement synthétique, a retourné le Code Massar et la moyenne attendus (`17.25`) ainsi que les champs d’identité, spécialité et mention. Après ajout de la clé par l’utilisateur, une requête réelle à Gemini 3.5 Flash a également lu le PDF synthétique et retourné le Massar et la moyenne attendus, sans recours au fournisseur de secours ni avertissement. Les essais sur d’autres modèles ont rencontré des délais dépassés ou un refus de modèle ; le choix a été enregistré uniquement après réussite du test PDF. Aucun dossier réel n’a été envoyé pour ces vérifications.

Après autorisation explicite de l’utilisateur le 27 octobre, le signal de rechargement Laravel a été appliqué et un nouveau processus worker a été observé. Après ajout du secret et sélection de Gemini 3.5 Flash, un second signal de rechargement a été appliqué. La présence du secret (sans affichage), le modèle Gemini sélectionné et la politique cloud active ont été revérifiés dans le conteneur worker. Groq Vision reste le fournisseur de secours.

## Résultats des contrôles

- 37 tests backend réussis, 333 assertions : Gemini natif sur PDF (HTTP simulé), bascule vers Groq Vision, erreurs/quota/JSON invalide et maintien des résultats locaux, propriété des dossiers, versions et workflow d’admission.
- Scénario navigateur d’extraction automatique CNIE recto/verso puis bac réussi.
- TypeScript, lint, build frontend et contrôle de style PHP réussis.
- Correction d’un défaut du parseur CNIE : validation des dates via `checkdate`, sans dépendre de l’extension PHP Calendar absente du serveur. Une défaillance du parseur local ne bloque plus une extraction visuelle cloud autorisée.
