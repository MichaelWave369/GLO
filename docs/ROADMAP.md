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
