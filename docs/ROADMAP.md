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


## P1-F: public-only changes since your last look

- [x] Compare bounded, user-triggered Scout source scans to prior same-area source snapshots by stable OSM IDs
- [x] Treat OSM name, category, mapped location and mapped hours changes as **map-field changes**, not verified service changes
- [x] Separate edits to map timestamps from meaningful record-field differences
- [x] Label newly returned and not returned **as query results**, never opening/closure
- [x] Compare against previous deliberately saved/restored offline OSM snapshots without extra network calls
- [x] Avoid comparing different neighborhoods (250 m center-shift bound) and warn if source query was capped
- [x] Show concise summary and collapsed source-linked details in normal online Scout view
- [x] Add pure regression tests for field changes, unknowns, incomplete results and exclusion of local reports
- [ ] Field-test on mobile using a saved pack followed by a later real on-demand search
- [ ] Confirm empty, offline and query-failure states cannot be mistaken for closure or current operation
- [ ] Add structured independently sourced operator-status notices only with explicit publisher authorization and audit receipts


## P1-G: private, offline Field Recheck Ledger

- [x] Keep original observation immutable; append later dated observations as self-reported, device-only receipts
- [x] Append atomically to the original report row in IndexedDB, no schema upgrade or separate orphan store
- [x] Cap to 20 rechecks per pin, 240-character notes, reject malformed/future/pre-original observations and forged verified status
- [x] Show private-history timeline, current self-reported recheck result, and thumb-sized phone form
- [x] English/Spanish recheck labels and readable charcoal/mint controls
- [x] Recheck changes local freshness audit date but never public operational status
- [x] Deleting pin deletes history; panic clear wipes rows; private backup naturally includes complete history
- [ ] Scout offline/airplane mode add → recheck → reload → inspect original/updated history on Android/iOS
- [ ] Scout test statuses working / not working / unknown and pre-original/future dates
- [ ] Confirm no private check enters public OSM packs, GLO Bro public source list, QR/shared pin or external requests
- [ ] Verify low-battery, Spanish, print, screen readers, and backup disclosure on real devices


## P1-H: privacy-reviewed local exports

- [x] Replace one-tap private backup with an explicit Data Safety Review.
- [x] Default to counts-only overview; clearly mark as **NOT A BACKUP**.
- [x] Safely project only derived counts; exclude names, exact coordinates, notes, IDs, visit and recheck content in overview.
- [x] Full private JSON requires separate mode selection and plain-text/sensitive-data acknowledgement; preserve original backup format with history.
- [x] Show private pin count, recheck count, coordinate-bearing pins and note-bearing pins on-device before selection.
- [x] Works offline and in low-battery mode; bilingual labels and dark mobile hit targets.
- [x] No upload, background export, account/identity, encryption promises or silent sharing.
- [x] Add regression tests for scoped export content and explicit full-backup acknowledgement.
- [ ] Scout phone QA: preview → counts overview → inspect file for private data; full backup warning and content; cancel; low-battery, Spanish.
- [ ] Scout verify no file is downloaded before consent and panic clear does not claim to erase downloaded files.
- [ ] Consider truly encrypted local export **only after** a rigorous cryptography/restore/security design review.


## P1-I: private offline backup recovery

- [x] Add **Recover private backup** alongside explicit local export review.
- [x] Parse only the full v1 private JSON format; reject counts-only overview, public OSM packs, unknown schemas, hidden fields, spoofed verified status, malformed and oversized files.
- [x] Limit to 1.5 MB, 200 pins per file, 20 rechecks per pin, 400 total on device.
- [x] Private preview summarizes only pins/rechecks/new/conflicting IDs; no titles, notes, coordinates or automatic upload.
- [x] Require separate user review/acknowledgement and final browser confirmation.
- [x] Atomic **add-only** IndexedDB restore; skip existing IDs, preserve newer local notes and histories; no silent overwrites or partial merges.
- [x] Normalize optional metadata in historical files into self-reported, not-verified, device-only records; retain valid multiline notes.
- [x] Regression tests for round-trip backup, invalid files, duplicate IDs, forged verification, conflict-safe import, repeated import, storage cap, panic-clear race.
- [ ] Field-test Android/iOS airplane-mode choose → preview → restore → reload, and import into a device with existing changed pins.
- [ ] Check file picker accessibility, Spanish/low-battery UI, local storage pressure, 1.5 MB rejection.
- [ ] Design interoperable encrypted exports only after cryptographic review and secure passphrase/key handling.


## P1-J: Scout field review localization and confidence fixes

- [x] Scout confirmed private backup round-trip, two historical checks, preserved newer local recheck on re-import, cached airplane-mode operation and crisis visibility in low-battery Spanish mode.
- [x] Translate resource chips, sidebar distance, map controls/popups, offline neighborhood sketch and public pack panels.
- [x] Translate GLO crew status, Scout source/freshness warnings, GLO Bro interface, and deterministic local guide response to Spanish.
- [x] Avoid false **Browser online** claim from navigator.onLine. Show connection-not-checked rather than unearned network availability; do not add background fetch.
- [x] Improve low-battery LOCAL FIRST badge and connection status contrast, including dot colors.
- [x] Explain zero-new-pin re-import explicitly, while keeping restore disabled and existing observations unchanged.
- [x] Render Download requested notice in selected UI language; add bilingual locale regression tests.
- [ ] Scout mobile re-test: toggle English/Spanish across full page, 320–430px layout, low battery, offline, GLO Bro questions, same-file reimport.
- [ ] Verify OS-provided permissions/browser errors, user-written notes and OSM titles remain clearly recognized as untranslated source content.
- [ ] Real-device contrast and screen-reader audit at low brightness; verify install/PWA cache update behavior.


## P1-K: Research This Spot / manually-reviewed agent notes

- [x] Optional pin-based or pin-free local research question, permission-on-tap coordinates only
- [x] Preview of exact exported fields, approximate 2-decimal area default and explicit exact-point approval
- [x] Single clipboard handoff, zero agent credentials, no tracking or backend
- [x] Manual write-back: separate local research annotation with permanently UNVERIFIED provenance
- [x] Research notes capped at 12 per pin; pin deletion and panic clear erase them
- [x] Bilingual EN/ES controls, works offline and in low-battery list
- [x] Tests of packet disclosure, annotation schema, storage isolation, deletion and panic clear
- [ ] Scout/Ori real-phone acceptance: pin-free GPS workflow, English/Spanish, 8% battery, clipboard denial fallback, private-pin annotation deletion
- [ ] P1-L: versioned private research export/restore. Existing v1 backup does NOT include annotations; never promise otherwise
- [ ] Independent privacy inspection / carefully bounded evidence, no claimed zero-network/zero-device trace
- [ ] Cached resource queries and optional trustworthy directories with separate confidence labels
- [ ] Optional targeted research API/agent relay only with separate consent, real authentication and revocation design. No unattended sharing
- [ ] Explicitly park voice pinning and long-duration absence check-in as future research, not automatic notifications


## P1-L: separate local research backup and recovery

- [x] Keep the legacy v1 private-pin/recheck backup schema unchanged.
- [x] Explicitly reviewed export of a separate versioned glo-research-private-backup JSON artifact.
- [x] Strict size, provenance, timestamp, URL, field and duplicate-ID validation on import.
- [x] Preview counts for addable, duplicate, missing-pin and full-capacity notes before acknowledgement.
- [x] Atomic, add-only local restore with actual live pin ID/capacity rechecks, panic-clear epoch protection, no cloud or agent writes.
- [x] Preserve unverified research vs self-observed Field Recheck Ledger distinction.
- [x] Unit regression coverage for format boundaries, overwrite resistance, missing pins and caps.
- [ ] Real-phone export → fresh-device v1 pin restore → research restore → reimport acceptance, including airplane mode and Spanish UI.
- [ ] Manually test concurrent-tab panic clear and interrupted/download-blocked behavior on supported mobile browsers.

Follow-up P1-M remains an accurately scoped privacy inspector. Do not claim the absence of outside OS/provider records or real-world service verification.


## P1-M: honest local privacy inspector

- [x] Add a deliberate **Inspect my privacy** entry under Keep your own data, available offline, including in low-battery mode.
- [x] Show counts-only snapshot of four GLO-owned IndexedDB stores in one readonly transaction (pin rechecks are inside pin rows).
- [x] Document current tile-layer mount state, automatic-possible service-worker update checks, user-triggered Overpass/OSM actions, GPS, optional AI, links and outbound sharing.
- [x] Present English/Spanish accessibility-friendly charcoal/mint controls, no external fetch, location prompt, file export or mutation on inspection.
- [x] Explicitly disclose limits: no forensic audit, traffic recording, absence-of-logs proof or outside-provider/device history access.
- [x] Add regression tests for count-only inventory, unchanged local records, fetch-free reads and UI-condition-derived tile state.
- [ ] Android/iOS: fresh browser and existing-data counts; airplane mode and low-battery mode; restored research and recheck histories; after panic clear verify zero local counts.
- [ ] VoiceOver/TalkBack/keyboard audit for headings, count announcements and offline refresh.
- [ ] Review real PWA update requests and online map tile behavior using device network tooling; the inspector alone is not proof of network activity.

Potential future work: official-source directory adapters with evidence grades, kept separate from self-reported field observations. Do not introduce surveillance or automatic uploads merely to create a more impressive dashboard.


## P1-N: offline nearby finder (candidate)

- [x] Search origin entered deliberately or copied from map center/selected resource. No automatic Stroudsburg-as-GPS, geolocation prompt or network call.
- [x] Filter private device pins and currently loaded OSM Scout results (from current scan or opened offline pack) by category and straight-line radius: 0.5, 1, 2, 5 or 10 km.
- [x] Show 12 nearest entries with full match count, self-reported vs mapped provenance, and recorded/query dates. Never show private note or recheck text in finder cards.
- [x] English/Spanish, offline and low-battery friendly. No publishing, uploads, export, storage writes or agent credentials.
- [x] Tests for coordinate/radius validity, limits, duplicates, stale provenance, unverified status and no fetch.
- [ ] Android/iOS acceptance with saved offline pack, airplane mode, map-center versus selected-pin origin, VoiceOver/TalkBack, 320px and Spanish.

Distances are geographic straight lines, NOT accessible paths, safe routes or travel-time estimates. An empty result means no matches in loaded records, not no nearby resource. OSM records and personal observations do not prove opening hours, food/water safety or entry permission.


## P1-O: search all saved offline public Scout areas

- [x] Preserve P1-N loaded-only defaults and explicit manual/map/selected-resource origin; no implicit device location.
- [x] Opt-in, one-click, read-only local search across up to ten already saved and validated public OSM packs; no Overpass call, account, background scan or network test.
- [x] Deduplicate overlapping OSM object IDs by newest *query date*, with loaded-result tie preference; do not misrepresent edit or scan age as operating status.
- [x] Public-only allowlist, verified-unverified boundary, separate source-scope badges and incomplete-pack warning, nearest-result cap unchanged.
- [x] A selected saved-pack result receives a transient map marker without changing the current Scout pack, map-data publish state or offline stored notes.
- [x] English and Spanish text, low-battery behavior, narrow-phone controls; restore private Pocket Plan's name-only selection boundary.
- [x] Regression tests for overlapping snapshots, malicious/imported pack fields, source date precedence, no fetch, SQLite-free IndexedDB, panic clear and private data exclusion.
- [ ] Field testing: prepare two saved regions, airplane mode, find across both, source badge, on-map temporary marker, Spanish and low-battery at 320–430px.
- [ ] Confirm re-query after deleting a pack, outdated/capped packs, service-worker updated frontend, and VoiceOver/TalkBack interaction.

A saved public-source record is NOT verified available, legal to enter, suitable for navigation or complete local coverage. No private device observations are uploaded.
