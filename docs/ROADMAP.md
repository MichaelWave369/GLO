# GLO Pin implementation roadmap

## P0: accountless local-first prototype (current PR)

Deliver a React resource-map shell with three initial resource categories, IndexedDB observations, an explicit geolocation button, opt-in online OSM tiles, a local backup, unit tests, and GitHub Pages deployment.

**Acceptance:** green build and tests; browser verification of add/filter/search/delete; the app shell launches offline after prior installation/load; local observations remain available; zero street-tile requests before opt-in. CI alone does not establish phone or offline acceptance.

## P0.2: governed source scout and GLO Bro

- Four limited agent roles visible in the app: Scout (user-initiated Overpass discovery), Freshness (OSM last-edit metadata), Guard (private/public separation), and GLO Bro (offline local guide).
- GLO Bro uses explicit decision rules by default. Supported desktop Chrome browsers can optionally run real browser-native AI through the Chrome Prompt API. This is user-initiated, requires browser hardware support and potentially a large model download, and is never mandatory. Mobile devices retain the local guide. Cloud AI is not connected.
- All OSM results are evidence of a mapped record only. Open, safe, or functioning claims remain unsupported without separate verification.
- No automated background crawlers or agents, no private data uploads, no resource reputation scores in this phase.

**Acceptance:** build and tests pass; on-demand scout action and fallback behaviors work; human mobile review verifies clear provenance and separation; zero Overpass calls until the user clicks Search.

## P1: real downloadable offline maps

- Choose a rights-cleared offline renderer/package system (e.g. MapLibre + PMTiles).
- Download selected geographic areas instead of the entire world.
- Verify package integrity, source rights/attribution, freshness, storage size, and deletion.
- Search area resources with all radios disconnected.
- Keep private notes distinct from public regional datasets.

**Acceptance:** demonstrate a usable Stroudsburg street map, pins, and local search in airplane mode on inexpensive Android hardware. A tileless grid or browser tile cache is insufficient.

## P2: portable and governed community observations

- Freeze an open resource schema with source, timestamp, current-status uncertainty, and expiry.
- Separate OBSERVED from CONFIRMED_BY_OPERATOR, INFERRED, and UNKNOWN.
- Add explicit publish-preview, consent confirmation, and publish receipts.
- Build moderation and anti-spam controls that do not depend on end-user accounts.
- Strip personal information, protect private/sensitive locations, and validate time-sensitive reports.
- Publish independently downloadable and mirrorable geographic resource snapshots.
- Select a separate compatible open-data license, including attribution and OSM ODbL handling.

**Acceptance:** abuse tests, privacy tests, safety review, reproducible snapshot validation, no auto upload, and independent mirror import/export.

## P3: voluntary Stroudsburg field pilot

Invite a small group of testers to try the prototype without collecting personal identities or housing status. Ask about usefulness, readability, offline search, battery, storage, stale data, and simple contribution flows. No nonprofit endorsement should be claimed without permission.

**Acceptance:** field-test receipts and real-user findings, with unresolved safety issues explicitly recorded before wider rollout.

## Later, only if useful

Publicly published weather/conditions cameras, more public-resource categories (restrooms, free Wi-Fi, official food programs), accessibility data, independent community mirrors, and sustainable multi-maintainer governance.

The project must not become a surveillance network, user-profile service, or a misleading food-safety rating system.


## P0.3 field-essentials pilot (Scout suggestions)

- Add more categories as private notes, not unverified public-feed claims.
- Add timestamped working-status observations, hours and narrowly defined accessibility/access details.
- Cache U.S. 911/988/211 reference card in the PWA application shell with accurate network limitations.
- Provide a list-only dark mode that unmounts the map and agent dock.
- Ship a Spanish beta for key interactions and document untranslated areas.
- Add explicit opt-in peer pin links and locally generated QR codes with coordinate disclosure.
- Add a panic cover and destructive private-record clearing with honest scope and data-loss warning.
- Explicitly exclude personal sleeping spots, demographic safety labels without publisher consent or evidence, and public sharps/needle claims without trusted-source policy.

**Acceptance:** automated tests/build pass; browser tests for sharing and import, low-battery map unmount and offline crisis copy; human mobile/a11y testing; demonstrate panic clears local IndexedDB and does not claim deletion of exported or third-party data.


## P0.4 offline public Scout records (separate from street maps)

- Use conservative OSM tags for publicly mapped toilets, food-bank/meal services and showers; do not imply fees/availability.
- Preserve verified-versus-mapped distinctions with explicit OSM links and scan/edit dates.
- User-triggered local snapshot saving, bounded IndexedDB storage, explicit import/export of strictly validated **public-only** JSON packs.
- Make saved public records visible to GLO Bro and the low-battery list while offline.
- Panic clear must erase both app-owned private observations and locally saved public packs without touching other apps on GitHub Pages.
- Include OSM attribution, ODbL metadata, unknown access/hours warnings and source staleness thresholds.

**Acceptance:** CI tests/build pass, manual airplane-mode reload demonstrates offline saved records and local GLO Bro results; strict import rejection of private fields; successful v1-to-v2 IndexedDB upgrade preserves reports; Android battery/accessibility checks; no automatic Overpass calls on startup. Note that this is **not** the P1 licensed offline street-basemap deliverable.


## P0.5 mobile UX acceptance checks (Scout)

- [ ] Add pin directly opens/scrolls to editor, requests location only after tap, and leaves coordinates blank if permission denied
- [ ] Map selection returns to editor with explicit coordinates; never assume default viewport
- [ ] Saving reveals an in-context local-only confirmation; no accidental public publishing
- [ ] 44×44 px minimum effective touch targets for critical buttons including 911/988/211, pin actions, map zoom, and tile switch
- [ ] Shorter phone workflow: Scout search before collapsed offline packs; source results visible without nested scroll traps
- [ ] Readable text, adequate visual contrast, translated main Spanish heading, shortened hours prompt
- [ ] Real favicon.ico and SVG link resolve without 404
- [ ] Android, iOS, keyboard/screen reader, and low-power acceptance runs are recorded separately from unit CI


## P1-A: first real offline street sketch (current candidate)

- [x] Bounded, explicit Overpass \`way[highway]\` / \`way[waterway]\` geometry query; no bulk requests to the OSM public raster tile server
- [x] Save up to 4 small source-attributed street/footpath/waterway packs in isolated local IndexedDB
- [x] Render local geometry underneath GLO pins even without internet or online street tiles
- [x] Restore last saved sketch without network permission, preserve existing private observations on v3 migration
- [x] Atomic panic-clear of sketch store with existing app-owned data
- [ ] Verify road completeness at Stroudsburg and bounds of extract on low-end devices
- [ ] Test click-download / reload / airplane-mode road and pin visibility on real Android and iOS
- [ ] Prove no Overpass or tile calls on app startup; validate screen-reader support and data budgets
- [ ] Add optional full licensed region vector tiles with labels and rendering, if real field testing requires it

**Do not promote P1-A as a full offline street map, route engine, or safety-verification system.** This is a bounded linework baseline that users may download, save, and view next to known resource pins without connectivity.


## Scout second pass: targeted phone UX (P1-B)

- [x] Clear saved confirmation when its exact private report is deleted
- [x] Require explicit tap of **Use my location** before geolocation prompt when editing a new pin
- [x] Replace unsupported glyphs with portable SVG map-pin icons
- [x] Show public Scout results once in normal view; retain combined public/private list in low-battery mode
- [x] Increase remaining × and online-tiles switch effective tap areas to 48 px
- [x] Fold optional crew roster to reduce vertical scrolling
- [ ] Scout to validate permission denied → manually choose coordinates → save → delete while in low-battery mode
- [ ] Scout to verify no duplicates in a five-result public source scan
- [ ] Phone accessibility audit for 320–430 px widths and VoiceOver/TalkBack


## P1-C: intentionally small cross-repo bridges

First implementation: **KindBridge369 → GLO Pocket Plan**, adapted to GLO's React shell and no-account/offline boundary, plus **Peekaboo → distinct note-vs-OSM provenance** in optional resource text.

Potential, *not yet wired*:
- **Peekaboo:** source changed since last local snapshot, with timestamps and neutral warnings; do not call changed data verified.
- **Aidora:** conservative personal-information export review with explicit user-directed data exchange; do not import the current BoardPack device IDs or message threads.
- **FieldCloudWorker:** read-only scheduled public-only checks and bounded receipts, with manual review before anything appears as current/verified. No private phone location or user notes in workers.
- **Infinite Commons:** deterministic optional artifact schema and offline validation, only if multiple publishers emerge.
- **Vessie/Anti-M and BudgetGenius:** governance principles and strict budget caps, **not** a runtime/server dependency.
- **RepoRider:** contributor/developer workflow tools, not a user-facing help feature.

Acceptance: test small pure functions, no automatic persistence/network requests, no private-coordinate inclusion in copied plans, explicit copy/print disclosures, accessible phone and Spanish testing. Keep GLO useful on low-battery phones.


## P1-D: FamilyVault privacy-by-default bridge

- [x] Check FamilyVault source: vault entries private to creator by default; grants require explicit, scoped read/write permissions; full family-role backend is not suited for account-free GLO
- [x] Build bounded **local share preflight** with approximate area / exact point precision and optional resource name, all off/restricted by default
- [x] Strictly validate v2 shared-link schema; preserve legacy v1 incoming link support
- [x] Render approximate handoffs as geographical areas, not navigable precise resource locations
- [x] Acknowledge copied links are **not revocable**, even if GLO's local reports are deleted or panic-cleared
- [x] Test precise data exclusion and malicious/unknown share fields
- [ ] Scout phone test: default field preview, switching precision clears approval, name opt-in, QR, map region, legacy v1 links
- [ ] Accessibility, link-forwarding and approximate-geography tests on real phones

Do not import FamilyVault auth/RBAC/medical APIs into GLO. This is a design-pattern adaptation, not interoperability with private family records.


## P1-E: Scout field audit cleanups

- [x] Source-level regression: a deleted pin cannot still resolve to an approved share target
- [x] Share UI closes upon deletion and cannot be fed a stale report after list refresh
- [x] One local-only save receipt, no duplicate top-of-page success banner
- [x] Correct "Resource category" duplicate label
- [x] User-approved VitePWA update notice; online, foreground-only checking with 20-minute throttling
- [ ] Real mobile delete-during-share test, including rapid approval/QR generation
- [ ] Real device update test across two deployed revisions, offline then online, and unsaved draft protection
- [ ] Accessibility audit of update alert and per-field sharing approvals

Field report from Scout: scoped shares and decoded QR payloads passed default, precision-only, title-only and rapid-toggle checks. Do not convert that into a claim of an independent security audit.


## Dark UI acceptance checklist

- [x] Use approved charcoal/mint mockup as visual direction; default to dark on first page load
- [x] Apply to hero, forms, filter pills, map background/zoom/popups, crisis panels, Scout/GLO Bro, Pocket Plan, offline packs, share approvals and update banner
- [x] Improve linework and marker contrast in local tileless map; preserve tile-toggle opt-in and OSM attribution
- [x] Use dark browser / PWA theme color, with white paper printing
- [x] Add deterministic foreground/background contrast tests and dark-section coverage test
- [ ] Scout: inspect 320/390px and widescreen; field labels, map controls, focus ring, long notes, emergency call targets, share preview and copy/QR contrast
- [ ] Scout: confirm online tile CSS colors do not impair legibility; switch tiles off for the best dark look
- [ ] Scout: check low-battery vs standard mode, Pocket Plan print, installed PWA status bar and Spanish labels

The visual change is intentionally CSS-first. Data sources, local storage, location prompts, privacy permissions and service-worker update mechanics remain unchanged.
