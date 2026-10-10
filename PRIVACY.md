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
