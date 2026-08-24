# Tests ENCG ERP — 7 principes ISTQB + outils

Les tests **montrent des défauts**, ils ne prouvent pas l’absence de bugs. On ne vise pas 100 % de chemins ; on vise le **risque métier ENCG** (notes LMD, rôles, guichet, émargement, convocations, TAFEM, auth).

## Les 7 principes, appliqués ici

| # | Principe | Ce qu’on fait dans ce repo |
|---|---|---|
| 1 | Le test montre la **présence** de défauts | Pest / Vitest / Playwright : un échec = bug. Un vert ≠ « zéro bug ». |
| 2 | Le test **exhaustif** est impossible | Priorité P0 : auth, LMD (seuil 6 / 10, V·RAT·NV), Grande École sans paiement, PDF/guichet. Pas de suite Cypress en plus de Playwright. |
| 3 | Tester **tôt** (shift left) | Unitaire `LmdRules` / `lmd.ts` **avant** l’UI. CI sur `docker-v2` à chaque PR. |
| 4 | Les défauts se **regroupent** | Groupes Pest `lmd` et `security`. Plus de tests autour de délibération, notes, routes sensibles. |
| 5 | Paradoxe du **pesticide** | Si les mêmes E2E passent toujours, ils ne trouvent plus rien. On ancre `data-testid`, on ajoute un viewport mobile, on change les assertions quand l’UI change. |
| 6 | Le test dépend du **contexte** | Contexte = Grande École Fès, 3 rôles, FR/AR, Docker. Pas de tests « paiement Grande École ». E2E mock API (pas besoin du VPS). |
| 7 | L’absence d’erreurs est un **leurre** | Suite verte + UAT scolarité (PV, convocation, TAFEM) avant go-live. Voir `PRODUCTION_CHECKLIST.md`. |

## Pyramide (quoi lancer, dans quel ordre)

```
        Playwright  (peu, parcours critiques)
       Vitest       (UI / lib front)
      Pest Feature  (HTTP, métier, RBAC)
     Pest/PHPUnit Unit (LMD, formules pures)
```

## Outils — on **garde** ceux-là (déjà dans le projet)

| Couche | Outil | Commande |
|---|---|---|
| Backend unitaire + feature | **Pest 3** + Laravel | `cd backend && php artisan test` |
| Cluster LMD | Pest `--group=lmd` | `composer test:lmd` |
| Cluster sécu | Pest `--group=security` | `composer test:security` |
| Analyse statique | **PHPStan / Larastan** | `composer analyse` |
| Style PHP | **Pint** | `./vendor/bin/pint --test` |
| Front unitaire | **Vitest** + Testing Library | `cd frontend && npm run test:unit` |
| E2E | **Playwright** (Chromium + Pixel 5) | `npm run test:e2e` / `npm run test:e2e:mobile` |
| Qualité JS | **oxlint** + `tsc --noEmit` | `npm run lint` |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

Ne **pas** ajouter Selenium, Cypress, JMeter, Postman comme pile principale : duplication et coût. Optionnel plus tard : **k6** (charge `/up` + login), **OWASP ZAP** (scan auth), **Infection** (mutation = pesticide).

## Quoi tester en P0 (cluster défauts)

1. Auth + 401/403 (`SensitiveRoutesRequireAuthenticationTest`)
2. Décision LMD V / RAT / NV, éliminatoire &lt; 6
3. Verrouillage optimiste notes
4. Guichet statuts FR + PDF
5. Émargement / justificatif
6. Convocations + SMS `log`
7. TAFEM import (pas le chatbot)

## Règle Grande École

`LmdRules::filiereRequiresPayment` : tests paiement **uniquement** `licence` / `master_specialise` / `formation_continue`. Jamais d’UI paiement sur `grande_ecole`.
