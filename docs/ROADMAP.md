# GLO Pin implementation roadmap

## P0: accountless local-first prototype (current PR)

Deliver a React resource-map shell with three initial resource categories, IndexedDB observations, an explicit geolocation button, opt-in online OSM tiles, a local backup, unit tests, and GitHub Pages deployment.

**Acceptance:** green build and tests; browser verification of add/filter/search/delete; the app shell launches offline after prior installation/load; local observations remain available; zero street-tile requests before opt-in. CI alone does not establish phone or offline acceptance.

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
