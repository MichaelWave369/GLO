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


## Field essentials (P0.3 candidate)

Following resource-user suggestions from Scout, the new private-report UI supports more categories: public bathrooms, verified-by-organization food programs (NOT discarded-food safety claims), showers, laundry, warming/cooling centers, Wi-Fi, sharps disposal, pet support, and official overnight shelters. Extra categories are currently **local note categories**. Public Overpass Scout coverage is still limited to water, designated shelter/covered seating, and explicit USB-charging tags.

Local notes now include self-reported hours, a time-stamped "worked when observed" status, and unknown/yes/no accessibility/access fields. The values describe a person's observation, not current operational status or official provider policy. Demographic "safe space" classifications are deliberately absent pending a proper source and safety policy.

Other additions:
- Offline-readable U.S. crisis contacts 911/988/211. Calling/texting requires a usable connection.
- Low-battery dark/list-only mode: map and agent dock are unmounted to save rendering and data use.
- English/Spanish toggle for critical tools and the private-pin form (agent panel translation is still incomplete).
- Accountless peer-sharing by URL fragment, with *explicit exact-location disclosure*; QR codes are generated on-device after approval.
- Panic clear covers the screen immediately, requests confirmation, then clears GLO's local reports and hides in-memory map data. It **cannot erase** already shared links, downloaded backups, browser history, OS screenshots, hosting logs, or other devices.

There is no claim that an offline app cache equals an offline street basemap.


## P0.4: offline public Scout resource packs

The Public Scout now searches carefully scoped additional OpenStreetMap tags for **public restrooms** (\`amenity=toilets\`), **food banks and soup kitchens** (\`amenity=social_facility\` plus \`social_facility=food_bank/soup_kitchen\`), and **mapped shower facilities** (\`amenity=shower\`). A tag is a mapped claim, NOT proof of a free, safe, accessible, currently operating service. Other categories still depend on private notes or future official source adapters.

After clicking **Search public map**, you may explicitly **Save this Scout search offline**. It saves up to 160 public map records in a small local IndexedDB snapshot with OSM IDs, map edit timestamps, source links, source scan timestamps, and limited provenance metadata. The app accepts at most 10 saved regions. No personal observations, device ID, author or location history are included in the pack. The latest saved public pack is restored locally on the next launch without network access. You can load, delete, import or export a pack without a server or account.

Importing an untrusted JSON pack is restricted to the GLO public OSM schema, size limits, exact OSM source links, a bounded record count, and non-verified status. The importer refuses unknown/private fields and does not replace personal observations. Exports carry OpenStreetMap attribution and ODbL metadata.

**Important:** this is *offline resource record storage*, **not an offline street-map package or guaranteed offline navigation**. Records can go stale, hours and fees may be wrong, and missing resources do not mean no services exist. Use the snapshot age warnings. There is no automatic background refresh or claim of verified safety/availability.

Panic clear removes both personal GLO reports and local saved public packs in one app-owned IndexedDB transaction. It cannot erase shared files, previously shared links, browser history, or other devices.


## P0.5 mobile field-usability improvements (Scout test findings)

- **Add a private pin** scrolls the new form into view and, only after that explicit tap, requests browser location permission. A denied/unavailable result leaves coordinates **blank**, never silently set to the Stroudsburg start viewport.
- Use your location again or **Pick on map**. A map tap fills coordinates and returns to the editor. The form refuses to save until a real location is selected or entered.
- Save confirmation appears immediately next to the private pin list rather than only in the banner above the fold.
- Emergency call/text actions, source/list controls, map zoom and online-tile checkbox use larger touch targets. Readability and color contrast improved at phone sizes.
- Mobile source results start at six, with a Show more button, rather than a nested scrolling box. The Offline Scout pack tools are now in a collapsible section **after** Scout so the flow reads from search to save.
- Main heading/eyebrow have Spanish versions, source-search icon uses reliable text, hours placeholder is short, formatting artifacts are fixed, and favicon.ico accompanies the existing SVG.
- Automated unit tests enforce that missing coordinates cannot accidentally become (0,0).

The update still needs human validation of accessibility, zoom controls, geolocation-permission denial/retry, Spanish screen-reader output, and actual offline/low-battery behavior on real phones. A green CI build is not that validation.


## P1-A: locally saved OSM neighborhood street sketch

GLO Pin can now optionally fetch **actual public road, walkway and waterway geometry** from an OSM Overpass query centered on the currently selected map view (a bounded 1.1 km neighborhood). This renders via Leaflet's own line drawing and continues to display after the device goes offline, because the selected street sketch is stored in the GLO-owned IndexedDB database.

Click **Download roads & paths here** below the map and explicitly consent to a geographically rounded request. This contacts the public Overpass server, which may receive your IP address and approximate map location. The app never sends private notes or a GPS/location history. On startup it reopens the most recently saved sketch **without** contacting Overpass.

Up to four small neighborhood sketches can be stored; schema and size limits prevent unlimited downloads. The app uses **OSM data**, not forbidden bulk downloads from OpenStreetMap's public raster tile server. Source and ODbL attribution appear in the UI. Street lines do not turn a source record into proof of public access.

**This is a first useful offline street-and-path sketch, not full-featured offline mapping.** Missing/unlabeled segments, graph routing, elevation, accessibility, address search, complete basemap tiles, and turn-by-turn navigation are NOT implemented. Highways and paths are drawn from OSM as of the download time and may have changed. Test on real Android/iOS devices before relying on the display for travel. Official map tile requests remain opt-in and separate.

The v3 IndexedDB migration is additive: existing \`reports\` and \`publicPacks\` persist, and panic clear now erases \`streetSketches\` in the same app-owned transaction.


## Scout's second phone-width review (P1-B usability pass)

Scout confirmed nine prior issues fixed and called out five remaining rough edges. This pass:
- Prevents stale local-save confirmation when the saved report is deleted, using its private report ID rather than a persistent message string.
- Opens the Add Pin editor with blank coordinates and no geolocation permission request. **Only an explicit Use my location action requests device location**. Map/manual selection still works independently.
- Replaces the missing U+2316-style location glyph with a portable inline SVG in the Scout crew and empty-list state.
- Eliminates public Scout source duplicates from the main private-pin list. The Scout pane is the sole source-results list in normal mode; the low-battery list deliberately combines saved private pins and mapped public candidates.
- Collapses the optional four-agent roster; increases the remaining close-button and online-tiles toggle hit areas (48 px), and keeps important search/help controls visible.

Existing offline source pack, downloaded road sketches, crisis actions and panic-clear paths are preserved. Phone interaction and permission-denial paths still require manual testing with Scout; CI cannot verify human ergonomics.


## P1-C: GLO Pocket Plan — cross-repo design reuse

The **GLO Pocket Plan** is an offline, no-account, user-initiated mini checklist inspired by [KindBridge369's Pocket Plan](https://github.com/MichaelWave369/kindbridge369/blob/main/docs/v0.4-pocket-plan.md) and local resource worksheet. It gives a plain-language first step, what to ask/check, and an optional place and personal next step for food, water, phone charging, bathrooms, shelter, pets or another essential need.

To keep the user in control:
- The plan is not sent to GLO Bro, an API, or public Scout. It is not saved to IndexedDB, a sync feed or a server; the component retains a temporary draft only while mounted.
- A selected map/resource name is **not** included unless the person checks an explicit opt-in checkbox. Exact coordinates, private report IDs and notes are **never** added to copied/printed plan text.
- A selected source is labeled either "Personal device note" or "OpenStreetMap map record" and never equated with verified availability. This follows the evidence/source separation used in [Peekaboo](https://github.com/MichaelWave369/Peekaboo).
- Copy and print are deliberate user actions. Browser clipboard content, print queues, paper, downloads and screenshots cannot be wiped by GLO panic clear. The user must clear those separately.
- Critical plan topics and control labels are available in English and Spanish; other portions of GLO remain partially translated.

This is an original small GLO feature based on reusable patterns, **not** an installed dependency on KindBridge, Aidora, Peekaboo, Vessie, or OpenField. Future cross-repo work should review each source repo's license and test its fit before pulling code or data.
