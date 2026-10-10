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
