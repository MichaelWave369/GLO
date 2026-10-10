# GLO Pin

**Good Lookin' Out.**  
**Find what you need. Share what you know.**

GLO Pin is a free, accountless, local-first community resource map. It is being built for everyone, with a particular focus on people who have limited connectivity and need practical information about public resources.

## P0: working foundation (this PR)

- React + Vite + Leaflet, mobile-responsive layout.
- Drinking water, public electrical charging, and covered public seating.
- Add, inspect, search, filter, and delete **private device-local observations**.
- Store observations using browser IndexedDB, with no user accounts or personal identifiers.
- Request the current location only when the user presses a location button; no location history.
- View local markers without network connectivity, if the app shell was previously cached/installed.
- Online OpenStreetMap tiles remain OFF until the user explicitly enables them.
- Manual, labeled **private JSON backup** containing the user's exact reports.
- **GLO crew:** user-triggered OSM Scout, edit-age Freshness analysis, local privacy boundary Guard, and free offline-capable GLO Bro **rule-based guide**.
- Source records are distinct from private pins. Public OSM results are only queried on explicit action and never labeled verified operational status.
- PWA application-shell caching and a GitHub Pages build pipeline.
- Small deterministic tests of the observation and privacy contract.

The initial map is centered on **Stroudsburg, Pennsylvania** for prototype convenience, not because GLO Pin knows where you are. This release has **no seed data claiming public resources exist**. The app starts with zero observations.

### Honest limitations

This is an early prototype, NOT a verified community resource directory. Reports are self-reported and unverified. There is no submission server, account system, automatic sync, or public data publishing yet.

**Full offline street maps do not exist in P0.** With internet disabled or external map tiles not enabled, local pins remain visible against a coordinate grid, but roads and other geographical details are absent. That is not navigable offline map coverage. The PWA app shell also requires an initial successful load and depends on browser installation/caching support.

Video, photos, public camera views, live community databases, and food-safety verification are not included. **GLO Bro's default is a free local decision-tree guide**. Compatible desktop Chrome browsers can optionally use Chrome's on-device Prompt API for real model-generated text if a model is available or the user explicitly approves the model download. Most phone browsers cannot use it. No cloud AI endpoint, accounts, or app-provided downloads are required for the default guide.

## Run locally

Node.js 22 or newer:

    npm install
    npm test
    npm run dev

For production build:

    npm run build
    npm run preview

The web build uses the GitHub Pages base path /GLO/. After merging and a successful workflow, set **Settings → Pages → Build and deployment → GitHub Actions** if it is not already selected.

Proposed site URL once deployment is actually confirmed: https://michaelwave369.github.io/GLO/

## Privacy and safety

Read [PRIVACY.md](PRIVACY.md). GLO Pin doesn't have accounts, telemetry, or a report-upload API. Observations remain in local IndexedDB unless users explicitly download their own backup. Exact coordinates and notes can still be sensitive. Connecting to GitHub Pages and optionally to OpenStreetMap tile servers does expose network requests to those providers.

Do not map specific sleeping locations, encampments, or identifying details of vulnerable people. Never mistake a community observation for a guarantee that water is potable, a facility is accessible, or discarded food is safe to eat.

## Where the architecture came from

- [Peekaboo](https://github.com/MichaelWave369/Peekaboo) for provenance-aware Leaflet mapping and OSM acquisition ideas.
- [Aidora](https://github.com/MichaelWave369/Aidora) for local-first observations and export principles.
- [KindBridge369](https://github.com/MichaelWave369/kindbridge369) for needs-first resource discovery.
- [Parallax OpenField](https://github.com/MichaelWave369/openfield) for evidence and uncertainty distinctions.
- [Infinite Commons](https://github.com/MichaelWave369/Infinite-Commons) for independent, portable snapshot contracts.

These other repositories are **not required to run GLO Pin** and are not modified by this PR.

See [the roadmap](docs/ROADMAP.md) and [contribution guidance](CONTRIBUTING.md).

## Licenses and future data governance

Source code: [MIT License](LICENSE), copyright GLO contributors. Any future community resource database needs a separately agreed open-data license and documented OpenStreetMap ODbL attribution/compatibility requirements. Code being MIT-licensed does not automatically license external mapping data.

GLO Pin is designed to be useful without knowing who created it. The long-term goal is a community-maintained, independently mirrorable public resource commons.
