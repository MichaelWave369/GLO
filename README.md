# GLO Pin

**Original GLO concept: Dustin.** This software is a collaborative implementation of his Good Lookin' Out idea.

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


## P1-D: FamilyVault-inspired least-privilege peer handoff

Adapted the **principle** from [FamilyVault](https://github.com/MichaelWave369/FamilyVault): confidential data should be private by default, with an explicit, scoped access decision before anything is revealed. FamilyVault itself uses authenticated accounts, user roles and revocable database grants; **GLO does not copy any of that server architecture**.

When a person explicitly chooses **Share location**, GLO now proposes a **limited public handoff**:
- Default **approximate area**: latitude/longitude rounded to two decimal places, plus generic resource category. No personal/custom name, author, note, private ID or precise source position.
- Optional **include name**, separately checked by the person who shares. The custom title can still reveal sensitive details, so it is off by default.
- Optional **exact location**, requiring an explicit precision change. Exact coordinates are up to six decimals; use only for publicly accessible resources that need precise wayfinding.
- Each choice resets approval and clears previously displayed QR/copy status. Before creating a link, a preview spells out the outgoing fields and a confirm dialog describes the consequences.
- Receiving approximate shared URLs render as a **900 m approximate region**, not an exact pin or confirmed entrance. Incoming v1 exact-location links remain readable for backward compatibility, with unverified provenance labels.
- No automatic sharing, accounts, tracking, external backend, resource verification or private note upload.

**Important limitation:** GLO peer links are not FamilyVault permission grants. Once copied, scanned, forwarded or captured, **they cannot be revoked by GLO**. A recipient may keep the full URL, name, and coordinates. Browser history, clipboard contents, screenshots and external copies are not cleared by GLO's panic-clear function. The URL fragment is handled locally by GLO, but anyone who receives it can read it.


## P1-E: Scout's post-sharing field audit

Scout independently decoded handoff JSON and QR payloads across default, exact-only, name-only and rapid permission toggles. Scout reported all scoped-data privacy checks passing. Follow-up hardening:

- Deleting a private pin closes any open share panel immediately. The panel also derives its target from the current private/OSM data, so stale objects do not retain approval controls after removal.
- Saving a pin shows **one** local-only receipt near the pin list instead of duplicating it in the top notification banner.
- The reviewed export preview now has one concise "Resource category" label.
- Adds a service-worker **new version available → Update now** notice through the existing VitePWA prompt registration. Checks are foreground/online-only and throttled to 20 minutes; changes do not silently reload a half-written private note.
- After an update is found, a tap applies it and reloads the app. Offline resources already saved on the device remain in the app's IndexedDB, which is not cleared by service-worker activation.

The update banner requires a device to load this version at least once. A device still running an older cached build without the update detector cannot retroactively display the new notice; after one manual cache refresh the notice can handle future releases. A browser's cache, service-worker lifecycle and device settings can delay discovery. This is **not** a promise of immediate updates, automatic installation, or offline-to-online connectivity.


## Default charcoal + mint appearance

GLO Pin now opens in the darker **charcoal/mint visual theme**, matched to the approved dark dashboard mockup rather than the formerly bright white/cream background. The dark palette covers the hero, navigation, private-pin cards, resource and assistant panels, crisis/call controls, location form, saved street sketches, sharing preflight, offline packs, update notice, QR preview and Leaflet map chrome.

- The **tileless/offline map** uses a dark legible grid. Stored OSM linework colors are brighter for dark contrast.
- Opt-in online OpenStreetMap raster tiles use a *client-side visual color filter* to reduce brightness. This affects only their appearance, not the OSM data, provenance or permission model. Colors are not a trustworthy indicator of road classification or safety.
- The low-battery screen remains distinct and legible; printing a Pocket Plan retains a white page with dark text.
- The default-dark change introduces **no new location requests, account requirement, network calls, or migration of private local reports**, and keeps the previously reviewed update prompt and emergency controls.
- Colors and readable defaults have deterministic CSS token/contrast tests; automated tests and Pages deployment do **not** replace real phone-width and screen-reader review.


## P1-F: what changed in the public map? (Peekaboo-inspired evidence comparison)

When a person deliberately reruns **Search public map**, GLO can compare the newly returned public OpenStreetMap records with the previously loaded **same-neighborhood** public snapshot. This is an original, local, bounded interpretation of evidence-change principles from [Peekaboo](https://github.com/MichaelWave369/Peekaboo), not imported code.

- **Changed map details** means differences in the normalized public record name, category, OSM opening-hours text or mapped coordinate position (over approximately 15 m). These are differences in **map data**, not service verification.
- **OSM edit timestamp changed only** means the underlying OSM edit date changed but none of the above visible fields changed.
- **Newly returned** means absent from the earlier bounded query results, **not** a new or open service.
- **Not returned this time** means absent from the latest query, **not** a closed, removed or inaccessible service.
- Comparisons require both scans to have grounded centers within 250 meters; otherwise GLO clearly declines to compare unrelated neighborhoods. If an Overpass request hit its cap, GLO warns that records may be missing.
- The optional details lists are collapsed by default and link directly to official OSM object pages. On the phone, showing 12 examples per category avoids another huge scroll.
- Both the previous saved/loaded OSM pack and the fresh scan are public source data. No device ID, private note or report is included in the comparison, and it runs locally without a second network request.

**What this does not prove:** no comparison can determine whether a drinking fountain works, a shelter is open, a pantry has supplies, a bathroom is accessible, or anyone is safe. For those, follow the provider's official information or a fresh human observation and preserve its provenance.


## P1-G: private Field Recheck Ledger (original observations preserved)

Open any saved **private pin** and tap **Recheck** to record another in-person observation, including when the visit occurred, whether the resource appeared to work, and a short optional note. Each entry stays attached to the original pin in the device's existing IndexedDB \`reports\` store. Earlier entries and the original status are **not overwritten**. The expandable **Private observation history** shows all entries with their dates and unverified provenance, newest observed visits first.

- The recheck is **self-reported**, **device-only** and **not independently verified**. Even a recent "appeared working" observation does not establish current availability, operating status, safety, access, fees, or suitability for other people.
- Recheck is offline-capable and requires **no account, automatic geolocation, API request, publication or resource provider connection**.
- Rechecks are limited to **20 per pin** and notes to 240 characters. The full pin and its history are saved as one record in an IndexedDB transaction; no schema migration or separate orphan history is needed.
- Existing private backup JSON includes the rechecks as part of the saved \`reports\` rows. This file is **sensitive** and may contain timestamps and private observations, and it is not protected by GLO after download.
- Deleting the private pin also deletes its history. **Panic clear** erases the whole app-owned private database row as before; exported backups, screenshots, shared links, browser history and other devices are outside GLO's deletion scope.
- Public OSM Scout sources are **not** eligible for private rechecks here: first make a separate device-only observation of the public resource. Observations cannot alter public map/provider status.
- Freshness audits use the most recent valid personal observation (not just the first one), without declaring a site verified.

Human phone acceptance still required: offline recheck, three different states, history after reload, private backup, deletion, panic clear, low-battery, Spanish and screen-reader checks.


## P1-H: privacy-reviewed, local-only exports (Aidora-inspired)

GLO now puts a **Data Safety Review** in front of its private export button, adapting the privacy-by-default review idea from [Aidora](https://github.com/MichaelWave369/Aidora). All code is written in GLO, not imported from Aidora's messaging stack.

The **default** is a counts-only overview, labeled \`GLO-Pin-OVERVIEW-NOT-A-BACKUP.json\`. It contains only overall counts of private pins/rechecks and category totals. It is **not a restorable backup**. It excludes report names, notes, exact/approximate coordinates, visit times, contact information, device IDs and history content. Even counts may disclose which categories someone tracks.

The **full private backup** is a separate, deliberate selection and requires acknowledgement that the resulting \`GLO-Pin-PRIVATE-SENSITIVE-backup.json\` includes every pin, exact coordinates, private notes, timestamps and all recheck receipts. It uses the same \`glo-pin-private-backup\` JSON format and schema as before, retaining full fidelity. **It is not encrypted**. This project does not claim secure encrypted vault storage or cross-device restore.

Both files are created locally, only following a user click, without upload, login, or a source lookup. Browsers can save downloaded files to folders synchronized externally by the operating system. A private backup can persist after the GLO panic clear action and can be read by anyone with access to the file. The user must protect or remove outside copies themselves. The interface is bilingual (English/Spanish), dark-mode and low-battery compatible, with thumb-size controls and a no-export close action.

Export tests ensure private identifiers/coordinates/notes/visit history never enter a counts-only overview, and full export remains behind a separate acknowledgement.


## P1-I: private offline backup recovery

GLO can now **recover private reports and append-only recheck histories from a full GLO backup**, including the previously exported v1 \`glo-pin-private-backup\` format. Use **Keep your own data → Recover private backup**. This is a local, user-directed read of the selected JSON file, with a counts-only preview. The app does not upload the file, request location, use an account, or contact the map service.

**Safety boundaries:**
- Only a full private backup is accepted. Counts-only overviews, OSM resource packs, unsupported schemas, unknown fields, forged verified/official statuses, malformed locations, timestamps and rechecks are refused.
- Files are limited to **1.5 MB**, with up to **200 pins per import**, **20 rechecks per pin**, and **400 total pins** after restoration; too-large files and malformed batches are rejected.
- The review lists only counts, the export date, how many pins have IDs already present, and how many are missing. It does not display private titles or notes on the preview screen.
- An explicit acknowledgement plus a browser confirmation are required before adding anything.
- **Add-only, transactional import:** pin IDs already on this device are skipped, not overwritten, not partially merged, and not considered identical just because their IDs match. No existing local observation or recheck history is replaced. If any write fails, the entire import transaction aborts.
- Restored pins preserve original timestamps, private notes and valid recheck histories. Imported observations remain **self-reported, device-only, not independently verified**.
- Panic clear is guarded against an in-flight restore in the same tab; exported JSON files, other tabs, browser caches and cloud-synced downloads remain outside the app's deletion guarantee.
- GLO does not currently support encrypted private backups or recovery of deleted source files.

Real-device QA still required for file chooser behavior, offline restore after reload, low-battery view, Spanish, conflicts, capacity, and screen readers.


## Scout 2026-10-10: Spanish, browser connectivity and recovery messaging

Scout's real-phone field review passed full private export with complete recheck history, new-profile recovery with exact preserved details, add-only re-import protecting newer local observations, cached offline operation, crisis visibility and combined Spanish/low-battery operation. That is field acceptance for these tested paths, **not** a blanket audit of privacy or real-world service availability.

P1-J closes the follow-up mobile UX issues:
- Resource types, filter chips, sidebar distance/status text, the map controls/popups/privacy explanation, OSM offline street-sketch controls and public pack panel are localized in Spanish.
- Scout's visible controls, freshness/source-change labels, GLO Bro forms and deterministic offline rule responses now support Spanish, including common Spanish water/food/power/weather queries. **User-written notes, map feature names and optional on-device AI responses are not automatically translated.** These may remain in the source language.
- **Browser connection indicator:** \`navigator.onLine\` cannot prove internet reachability. GLO no longer claims "Browser online" from that hint. It says **Connection not checked / Conexión sin comprobar** when a network interface may exist, or **Offline / Sin conexión** when the browser reports offline, and resynchronizes on focus/visibility. No background internet probe or location transmission is introduced. On-demand public requests can still fail independently.
- The low-battery **LOCAL FIRST / PRIMERO LO LOCAL** chip now uses a pale mint background with dark text. The connectivity dot is amber until reachability is established, not an unearned green success signal.
- If a selected backup contains only pin IDs already on this device, its non-destructive preview now explicitly states **nothing was changed**, in English and Spanish. The restore button remains disabled.
- The post-export **Download requested** notice is localized at render time, so toggling language no longer leaves that particular persisted notice in the wrong language.

No changes to backup schema, private storage, QR shares, offline cache, location consent, public status provenance or panic clear behavior.


## P1-K: Research This Spot (local, consent-reviewed)

A field-inspired way to select a resource or enter coordinates without creating a pin, write a research question, and copy a **single, scoped packet** to a chosen AI. Two-decimal approximate-area coordinates are the default; six-decimal exact coordinates require explicit selection. No account, backend, token, ongoing location feed or automatic upload. Imported/pasted findings become **separate, manually reviewed UNVERIFIED research annotations** only on an existing private pin, not new field observations. See [Research This Spot design and safety boundaries](docs/RESEARCH_THIS_SPOT.md).

**Important limitation:** research annotations are NOT in the existing v1 private backup; users must separately retain important findings until research export/restore is released. They are deleted with their private pin or panic clear. No recorded private sleeping locations or unredacted field transcripts are published.

## P1-L: research notes have their own private backup

Open **Keep your own data → Research notes backup** for a separate, manual, research-only JSON download or recovery. The ordinary v1 private pin backup **still covers pins and rechecks only**. It has not been silently changed. To move everything to a new phone, recover the v1 private pins first and then recover the separate research-note file.

Research files contain manually entered titles, details, URLs, timestamps and matching **private pin IDs**. They are sensitive, plaintext, not encrypted, and may include sensitive locations in the text. A checkbox is required before downloading, and recovery shows counts with a separate acknowledgement and confirmation. No network access or account is needed.

The research-only format is versioned and strictly validated. Restore is **add-only** in one local transaction: existing note IDs are never overwritten; notes for missing private pins are skipped; each pin remains limited to 12 research notes. No public source records, observations or Field Recheck Ledgers are modified. Panic clear removes GLO-owned copies, **not downloaded backups**.

See [Research This Spot](docs/RESEARCH_THIS_SPOT.md) for its scope. Unit tests and CI are not a real-phone recovery acceptance test.


## P1-M: inspect what GLO keeps here and how it connects

Open **Keep your own data → Inspect my privacy**. This English/Spanish inspector displays **counts only** from GLO's four named local IndexedDB stores: private pins, research annotations, public Scout packs and downloaded road/path sketches. Reading these counts uses one local read-only transaction. Private pin text, exact locations, history, identifiers and research-note contents are not shown in the panel or exported. Rechecks are held inside each private pin record, not a separate store.

A separate list explains the app's known outbound surfaces, including the site host and automatic-possible PWA update checks, user-enabled online OSM tiles, user-triggered Overpass searches/downloads, device location buttons, optional on-device AI model downloads, external links, and user-approved shares/exports. The list **describes possible connections and current app state**; it does not intercept network requests or prove they did or did not occur.

The inspector works in offline and low-battery views. It performs no internet test, geolocation prompt, file operation or store deletion. GLO cannot inspect outside-provider records, downloaded backups, OS/browser histories or every possible network request. For the limitations and phone testing checklist see [PRIVACY.md](PRIVACY.md) and [the roadmap](docs/ROADMAP.md).


## P1-N: nearby resources from loaded records, offline

Open **Find nearby from loaded data** in the Resource Explorer. Enter coordinates manually or choose the displayed map center or selected resource. The map may still be showing the Stroudsburg pilot location, which is **not** your detected position. The finder does **not** request GPS or send any network query.

Select a category and a straight-line radius (0.5, 1, 2, 5 or 10 km). It filters local private observations and currently loaded public OSM candidates from a user-run Scout search or opened offline pack, then shows at most 12 nearest with counts, dates and separate source labels. It never includes personal note/recheck text in result cards, publishes results or sends coordinates to a server. It works in low-battery mode with no map navigation buttons.

This is **not** turn-by-turn navigation, a complete offline basemap, or verification that a resource is operational, safe, free, accessible, legal to enter or available today. An empty result means no matching records were loaded within that radius. Unit tests check source separation, invalid coordinates, evidence labels and query boundaries; real device acceptance is outstanding.
