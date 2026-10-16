# GLO Pin privacy architecture (P0 prototype)

**No account, email, password, advertising ID, telemetry SDK, profile, or automatic report upload.**

## Local-only information

- Observations, including their exact location and optional notes, live in this browser's IndexedDB.
- Map center and optional device location stay in current application memory. GLO Pin does not create a travel-history database.
- Reports contain a random report ID only, not a persistent author ID or user account.
- The backup download occurs only when a user presses the button. Backups contain **exact coordinates and notes** and must be treated as private.
- There is no community server to receive posts, edits, or automatic sync.

## Network access and its limits

- Initially accessing the website contacts GitHub Pages hosting and may create network logs there.
- Online OpenStreetMap tiles are OFF by default. Enabling the control contacts OpenStreetMap tile infrastructure and can disclose requested map regions, IP address, and timing to that service.
- Browser/device location services may use providers outside of GLO Pin when a user explicitly requests a location. The app itself does not send coordinates to its backend.
- The app has no ad scripts, analytics, or identity SDK.
- Selecting **Search public map** sends a rounded map center (three decimal places, approximately 100 m scale) and a fixed search radius to the external Overpass API. Search is user-triggered, never automatic, and may expose IP/request time to Overpass. No private reports or GLO Bro questions are included.
- GLO Bro defaults to a local rule-based guide, with no network requests for conversation.
- On supported desktop browsers only, users can choose **Check on-device AI**. Checking availability does not download a model. Starting an unavailable model may initiate a substantial browser-managed model download after the user accepts the explicit warning. The on-device prompt includes the typed question and a small list of public OSM results, but no saved private notes or precise location coordinates. Browser vendors can have their own download behavior and privacy policies. GLO Pin has no cloud AI endpoint.
- Once the service worker has installed successfully, the frontend shell can load offline with locally stored observations, depending on platform cache policies. Downloadable offline street maps are NOT implemented.

We do not promise absolute anonymity. The goal is minimal data collection, explicit choices, and no unnecessary personal identification.

## Sensitive location and food-safety boundaries

Never document private sleeping spots, encampment locations, private homes, or identifiable persons. Do not place real contact information in notes. Resource reports do not certify opening times, safe drinking water, physical accessibility, or food safety. A later community posting system must remove/minimize personal identifiers, require explicit user-controlled publication, and moderate submissions.


## Field essentials, peer links and clearing

- Local notes may include observation timestamps, reportedly working/nonworking status, self-reported hours, and access attributes. None are independently checked. Do not infer a facility is currently open.
- The crisis directory is shipped with the app so text can be read offline after the PWA shell was successfully cached. Dial and SMS links still depend on available device connectivity.
- Low-battery mode unmounts the interactive street map and agent dock; the remaining list uses available on-device entries.
- Peer sharing requires a person to approve disclosing the title, category and exact coordinates. Shared URLs keep the payload after a # fragment. No report ID, note, author identifier or timestamp is included, but exact location may be sensitive and links may appear in browser history, messaging apps, screenshots and clipboard contents. QR generation happens entirely in the browser.
- Panic clear first covers the screen, then requires confirmation before clearing this app's local report records. Its goal is fast protection from casual visual inspection, not an absolute forensic erasure guarantee. It cannot delete files exported earlier, shared links, browser or OS history, memory outside the app, provider logs, or external copies. It does not intentionally clear unrelated GitHub Pages applications' storage.
- The Spanish UI is currently partial. Important crisis and reporting controls are translated, but the entire agent/research panel is not.

- The observation timestamp is explicitly user-entered and may be wrong. GLO records a separate save timestamp for provenance; neither timestamp proves the facility currently operates.


## Offline public pack boundary (P0.4)

- Public Scout snapshots are saved to a separate \`publicPacks\` IndexedDB store only when requested (or manually imported). Saving and importing never upload private reports.
- A public pack contains coarse search-center coordinates, exact OSM *public resource* coordinates, source links/ID, edit time, bounded source descriptions, and scanned/saved timestamps. It contains NO local observations, report notes, device identifier, or private location history.
- The last saved pack is reopened locally on app startup, including when offline; it does not trigger an Overpass request. No automatic background refresh.
- Imported packs must pass strict format, public-origin, OSM source-link, record-count and size validation. Import does not grant the content authoritative verification.
- Public packs may expose the map region the user chose to save if a user explicitly exports or shares the file. Treat sensitive selections as personal context.
- Panic clear erases both GLO-owned local stores atomically, but cannot remove exports or other copies.


## Offline streets (P1-A)

GLO only requests road/path/waterway features when the user explicitly presses **Download roads & paths here** and accepts the disclosure. The selected map center is rounded to 0.001° before it is sent to the public Overpass API; the source can see the request location, timing, IP address, and relevant browser information. This does not include private notes, private report IDs, or the full GPS location history. The app may receive complete OSM way geometry within a bounded neighborhood and retains only validated, small road/waterway sets.

Data is stored in a dedicated \`streetSketches\` IndexedDB store (up to 4 entries) under the GLO app's database. The most recent sketch is reloaded from on-device storage without networking, even if the device is offline. Selected map regions themselves may reveal sensitive context to anyone accessing this device; a successful panic-clear operation deletes saved sketches together with private reports and public-source snapshots. Browser caches, downloaded files, OS data, external network logs, and already-shared data remain outside that guarantee.

Map linework is OSM data made available under the ODbL. It does not represent a complete offline basemap, road legality, accessibility, safety, or navigation directions.


## GLO Pocket Plan (P1-C)

Pocket Plan text is generated from bundled, deterministic first-step templates entirely on device. Optional organization names and personal next-step text exist only in component memory; they are not written to storage, uploaded or passed to cloud AI. No location permission is requested. The selected resource's name and local-note/OSM provenance appear only if the user explicitly chooses to include them. The plan never includes selected resource coordinates, private notes or IDs. A person can copy or print a plan; clipboard history, external print systems, browser/OS retained data and paper are outside GLO panic clear. Plans do not establish provider hours, eligibility, fees or operational status.


## P1-D: Peer handoffs are not authenticated grants

The FamilyVault-inspired sharing controls implement a **local export preflight**, not account authentication, encryption, time-limited access or revocation. A new shared URL is created only after the person selects a location precision and confirms the field preview; by default it carries a rounded public **area** and generic category rather than custom resource titles and precise coordinates.

An approximate area may still reveal sensitive context. Name-sharing and precise coordinates are separate voluntary choices. Shared links and QR codes are effectively bearer disclosures: a reader who receives or copies them can retain and forward them. **GLO cannot revoke their access or reliably erase any copy**. Some devices retain URL history, clipboard contents, screenshots and downloads outside GLO. Old v1 links may already contain exact coordinates and remain valid.

No FamilyVault vault credentials, session cookies, database tables, medical records or encryption keys are used by GLO.


## P1-E cached-version and share lifecycle policy

An orphaned private pin must not leave a share-approval UI accessible. Deletion invalidates its in-memory sharing state and the UI independently checks for the record's continuing presence. This does not recall previously copied/sent hash links, screenshot QR codes or browser history.

PWA update detection contacts the application's own GitHub Pages origin only when the browser is online, visible, and a registered worker is present; foreground checks are throttled. Nothing in this update process sends private report data, GPS coordinates or notes. Choosing **Update now** reloads the application, which may discard unsaved form text. The user is warned before the choice. Saved IndexedDB entries are not intentionally modified by service-worker activation. Very old cached app versions may still require a manual reload/cache reset once, because code already cached cannot acquire new functionality without being replaced.


## On-device comparison of public map source changes

After a user explicitly starts a new Scout search, GLO compares the newly downloaded **public OSM candidate records** with an already-loaded public snapshot (including a locally saved public resource pack), provided both queries cover approximately the same neighborhood. Comparison happens in browser memory; it needs no additional fetch and never reads private notes or sends report coordinates. No shared account, activity tracking or change history is created.

Public OSM data may be stale, incomplete, erroneous or edited for unrelated reasons. “Newly returned”, “edited” and “not returned” describe map/query outputs only, **never** a provider's current real-world availability. A record that is missing from one query is not proof that the corresponding service closed or disappeared. If a query was truncated, conclusions are even more limited.


## Field Recheck Ledger privacy

A private resource pin can contain up to 20 append-only personal rechecks. These include an observation time, the device save time, a self-reported status, and an optional short note. The history is stored in the **same device-only IndexedDB row** as the initial report. GLO does not send these observations to Overpass, OpenStreetMap, another user, a cloud AI model, or an API. The old entry remains readable even if a later visit disagrees with it.

Downloading a private backup includes **all stored rechecks** because they are part of the pin's private record. A backup file can retain personal/sensitive details even after the user deletes a pin or uses panic clear. Do not export or share private recheck histories as public source data. A deleted pin has no surviving app-owned history entry in GLO's \`reports\` table, but external copies are beyond GLO's reach.

The app does not independently verify any field observation, claim of working equipment, resource availability, or safety. No background location access is needed for recheck.


## Data Safety Review (P1-H): local files have different privacy risks

Export requires an explicit review. The default **counts-only** JSON shows aggregate totals and resource-category counts, without names, notes, coordinates, timestamps of visits or individual report IDs. Counts can still expose resource interests. This file is not a backup and cannot restore GLO's private pins.

The separately selected **full private backup** carries all reports and recheck histories in plaintext JSON, including precise coordinates and potentially identifying descriptions. A separate checkbox confirms that sensitive information will leave GLO's IndexedDB and be saved outside the app. GLO does not upload the content, but device download folders may be synchronized to third-party cloud storage outside GLO's control. **Panic clear cannot remove downloaded files, external copies or backups.** Downloading a backup does not encrypt it or grant access controls. GLO does not currently support importing that private backup as a verified restore operation.

The user can close without downloading. A file download may be blocked by the browser; GLO reports a download request, not a guarantee the file was saved. The privacy review is inspired by Aidora's explicit redaction/export design, without importing any Aidora accounts or personal information.


## P1-I: private backup recovery has no external upload

A person can select an existing GLO private backup JSON file using their browser's file picker. Reading and validating the contents happens locally on the device. The file can contain exact latitudes and longitudes, titles, personal notes, accessibility observations and full recheck histories. Preview displays **counts rather than individual secrets**. The app does not send the content to any network destination.

The person must approve before a bounded **add-only** IndexedDB transaction adds missing pin IDs. IDs already present remain unchanged and are skipped. This does not merge two divergent versions of a pin; if the same identifier exists with newer local details, those details are intentionally preserved. The entire restore aborts on invalid data or failed writes, and does not claim that a historical personal observation proves a resource open, safe or operational.

Opening a selected file in GLO does not delete that file from Downloads or undo cloud synchronization performed by the browser or operating system. Browser-managed file picker caches and device-level traces are outside GLO's panic-clear promise. Panic clear erases app-owned local reports and their histories but cannot revoke external copies. The newly implemented safeguard prevents a pending import in the same tab from repopulating data after panic clear; it is not a cross-tab security lock.


## Scout mobile language and connection copy (P1-J)

The browser's \`navigator.onLine\` API indicates a network-interface hint, **not** verified internet service or access to Overpass. The header never states "Browser online" merely from that hint. It may report **Connection not checked** even when the device cannot reach the public internet. No background fetch is added, preserving offline operation and minimizing privacy exposure.

Spanish UI translation covers main explorer and map flows, Scout controls, offline packs, local rule-guided explanations and recovery feedback. It does not translate imported OpenStreetMap names, unstructured notes, third-party errors, optional locally generated model responses or external provider content; those are source data, not app-authored facts. The original private backup data and recheck histories are unchanged.


## P1-K: Manually shared research and annotation boundaries

**Research This Spot** is opt-in, local and per-question. Location fields begin empty without a chosen pin; the app requests location only on a deliberate button press. Sharing defaults to a coarse, 2-decimal map area, never a promised safe campsite or entrance. The copyable packet contains an entered question and approved coordinates, plus an optional resource category. It does **not** contain stored pin titles, IDs, notes or private recheck histories, and cannot grant access to GLO.

Copied text and pasted research can leave GLO's control via other apps, agents, browsers, clipboards and downloads. **This is not a zero-trace claim.** A user must review the entire request because the question they type can itself disclose sensitive facts. If they later paste findings back into a saved private pin, GLO stores the note in a separate, capped research-only local database table, labeled **NOT VERIFIED**, never as physical evidence. Its optional source URL is opened only by explicit user navigation.

Research annotations are erased with their pin and by panic clear. They are **not included in the v1 private pin backup**; P1-L now provides a separate research-only backup format and add-only restore. Field testing on real phones remains necessary.


## P1-L: separate research-note private backup

GLO can now manually export a separate, research-only, version 1 JSON file containing existing-pin-linked research annotations. This file includes **private pin identifiers**, human-reviewed research text, entered HTTPS citations, timestamps and unverified provenance. Research text or sources could expose sensitive locations and personal context; the file is **plaintext, not encrypted**. A deliberate acknowledgement is required before creating the download. It is never uploaded by GLO, but operating systems, download directories, backup apps, clipboard and file-sharing tools may retain copies.

Recovery reads only a user-selected JSON file locally, strictly validates its format and fields, and previews eligible, duplicate, missing-pin and full-history counts. The person must approve and confirm recovery. An atomic IndexedDB transaction re-checks current live pin IDs and existing note IDs; restoration is add-only and skips entries for absent pins, duplicate IDs or full (12-note) histories. It cannot update field observations or recheck histories. Restore the legacy v1 private pin backup first when moving to another device. The original v1 pin backup format remains unchanged and **does not contain research annotations**.

Deleting a pin cascades its research notes, and panic clear removes research notes in the same GLO-owned data-clear transaction. Neither action removes downloaded backup files or copies held outside this browser. Research is still **not independently verified**. There is no automatic background sharing, account, cloud sync, server or agent write privilege.


## P1-M: on-device privacy inspector, limited by design

The optional **Inspect my privacy** panel is a passive GLO-owned inventory, not a traffic recorder, network firewall, zero-trace certification or security audit. It opens only after a user taps its button. It calls GLO's IndexedDB helper for a read-only, single-transaction count of rows in the four app-owned stores: reports, researchAnnotations, publicPacks and streetSketches. It does **not** display or export stored notes, exact coordinates, private IDs, or personal research. A normal first-time IndexedDB open may initialize the GLO database schema when storage does not yet exist. Counts can change after the snapshot; an explicit Refresh reads them again, locally.

The panel separately documents **possible** network/outbound behavior, NOT actual past connections or provider access logs:
- Loading the site and checking its PWA service worker may contact GLO's GitHub Pages origin; foreground update checks can occur automatically under the app's update policy when online.
- The opt-in OpenStreetMap raster tile layer may request and reveal map regions to the tile host only while mounted.
- User-triggered Scout searches and neighborhood road downloads use a coarse Overpass query region and can expose IP/time/location context to Overpass.
- User-pressed location buttons invoke browser/device geolocation; browser/OS providers may be involved.
- Optional browser-managed AI model downloads are separate from GLO Bro's offline rules; links, clipboard, share, print and local file exports may disclose data after user actions.

Browser-reported online/offline state is a hint, not an active connection test. The panel makes no new outgoing requests and does not attempt a network probe, location permission, clipboard access, download or security scan. It cannot enumerate external hosting/provider logs, OS traces, downloaded backups, cached scripts/tiles, QR/clipboard recipients, other apps, or prove every network request absent. Panic clear removes GLO-owned IndexedDB records, not those outside copies. Real-phone accessibility, airplane mode, screen reader and update-policy behavior require human acceptance beyond CI.
