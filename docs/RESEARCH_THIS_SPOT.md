# P1-K: Research This Spot — manual field-to-agent handoff

**Status:** local-first implementation; agent-side live feeds/relays are **not** implemented.

This milestone was informed by field usability feedback: a person should be able to ask an AI about an area using coordinates captured on a phone **without first creating a public or private pin**. The original field transcript and research notes contain sensitive location and personal context. **Do not commit those unredacted documents or personally identifying campsite details to this public repo.**

## What exists now

1. Tap **Research this spot** on a private resource or public mapped candidate, or **Research a location without a pin** under Keep your own data.
2. Coordinates from the chosen map resource are shown for review. Without a selected pin, both fields begin **blank**. GPS is requested **only** if the person taps **Use my location once**, and is neither stored as history nor transmitted by GLO.
3. Type a short question. The default scope is an **approximate area** with latitude/longitude rounded to two decimals. Exact 6-decimal coordinates require deliberate selection. Inspect the serialized packet and separately acknowledge what will be copied.
4. Press **Copy for an AI**, then personally choose where to paste. A text preview is available if clipboard permissions are denied. Copy is not a network call, does not provide the AI with a key, and does not expose pin ID, title, note, access details, recheck history or other observations. **The user-authored question itself could include private details, so review the entire packet.**
5. **Only for an existing private pin:** a person can manually write a titled research note, explanation and optional HTTPS source link. That requires an explicit save action. The note gets a fixed \`condition: not-verified\`, \`provenance: manually-copied-research\`, and \`visibility: device-only\`. GLO never automatically believes or accepts incoming agent text.
6. Research notes are held in a **separate IndexedDB object store** (database v4) with a cap of 12 notes per private pin, without changing the verified report/recheck structure. Deleting a pin removes attached research notes in the same transaction; panic clear erases reports, public packs, street sketches **and** research annotations.

## Not implemented, by design

- No live agent endpoint, cloud AI, web crawler, accounts, encrypted relay, QR capability tokens, watchers, phone sensors background access, automatic agent writes or continuous tracking.
- No parcel ownership/permit verification in the client, and no implied permission to enter property or claim a safe camping route.
- No guarantee of "zero remote trace": the **GLO button** performs no network request, but the clipboard recipient and the device/browser/OS/network may keep records beyond GLO's control.
- No guarantee that the source URL or research output is true or current. A citation link is not physical verification.
- **Crucially: research annotations are NOT included in the existing v1 private backup/restore format.** Do not conflate GLO's well-tested private-pin backup with research-note recovery. This needs a separate versioned export/restore protocol with explicit consent and full testing before we can promise round-trip recovery.

## Next proposals, not yet claims

- P1-L: explicit, reversible research-annotation export/restore with privacy review, round-trip tests, duplicate protection and compatibility with v1 backup.
- P1-M: local privacy inspector that documents which app-owned stores and known network interfaces are touched, with limited, truthful claims; no magical "proof no data was ever recorded".
- Then optional offline parcel/data directories and a resource-query template: nearest category within distance, with **separate** observation, directory and inferred result labels. Ownership is not access permission; last-edit timestamps are not live availability.
- Any capability-based live agent portal, encrypted relay, background alerts or safety check-ins must have independent threat modeling, informed consent, revocation and a real opt-in product need before implementation.
- Voice pinning and safety check-ins were explicitly deferred in the field feedback. Maintain the low-battery/offline/emergency interface as a first-class priority.

## Crediting sources

The underlying concept and field observations came from a human collaborator's original GLO proposal and subsequent traveler feedback, alongside the builder and AI collaborators. Record contributions accurately with consent. This public document intentionally omits sensitive field coordinates and names so the source transcript cannot accidentally become a location disclosure.

**Ledger Above Ego. Good Lookin' Out.**
