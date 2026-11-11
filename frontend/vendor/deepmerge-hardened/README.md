# Local hardened deepmerge

This private, vendored fork is derived from the bundled CommonJS source of MIT-licensed `deepmerge@4.3.1` (upstream: https://github.com/TehShrike/deepmerge). It replaces that transitive dependency in the PWA build chain through npm overrides. It is not an upstream release.

Security change for GHSA-gcqx-w48m-w2h4 / CVE-2026-93753:
- Reject `__proto__`, `constructor` and `prototype` in both target-copy and source-merge loops, before reading their values.
- Write own properties with `Object.defineProperty`, avoiding prototype setters.
- Fail closed when a proxy throws during property safety checks.
- Keep the existing merge API, symbol handling, arrays and custom merge options.

Run `npm run test:dependency-security`. Tests cover the documented exploit shapes and normal behavior through the installed transitive package, so a broken override also fails CI.

Maintain this fork until the upstream dependency chain supplies a verified fix. To retire it, remove the `deepmerge` override, update the lockfile, and run the security tests, dependency audit and Vite/PWA build. Never remove the tests solely to make an upgrade pass.
