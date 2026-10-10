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
- Selecting **Search public map** sends the *current map center* and a fixed search radius to the external Overpass API. Search is user-triggered, never automatic, and may expose IP/request time to Overpass. No private reports or GLO Bro questions are included.
- GLO Bro is presently a local rule-based guide. It does not send questions to any AI provider; there is currently no remote model endpoint.
- Once the service worker has installed successfully, the frontend shell can load offline with locally stored observations, depending on platform cache policies. Downloadable offline street maps are NOT implemented.

We do not promise absolute anonymity. The goal is minimal data collection, explicit choices, and no unnecessary personal identification.

## Sensitive location and food-safety boundaries

Never document private sleeping spots, encampment locations, private homes, or identifiable persons. Do not place real contact information in notes. Resource reports do not certify opening times, safe drinking water, physical accessibility, or food safety. A later community posting system must remove/minimize personal identifiers, require explicit user-controlled publication, and moderate submissions.
