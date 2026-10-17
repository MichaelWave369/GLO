# P1-U: desktop browser review-chain acceptance

**Observation date:** October 16, 2026 (Pacific).

The project owner supplied **two screenshots from an actual desktop browser session** after GLO PR #31 was merged and the GLO Pin Pages workflow succeeded. The images were inspected in conversation but **are not committed** to the public repository, avoiding unnecessary publication of a user's browser environment.

The screenshots show the following rendered UI states:

1. The manually generated United Way 211 source observation from [Actions run #38985444980](https://github.com/MichaelWave369/GLO/actions/runs/38985444980) was loaded. GLO displayed HEAD, HTTP 301, and **redirect NOT followed**.
2. The user acknowledged that a website observation does not prove a service provider is open, and selected **Retain this website observation as unverified evidence**.
3. GLO displayed **Draft ready**, an SHA-256 preview, and **PUBLICATION BLOCKED · SERVICE STATUS UNKNOWN**.
4. After choosing the downloaded review draft in the paired-file checker, GLO displayed **LOCAL CONTENT MATCH ONLY**, the retained review disposition, a SHA-256 preview matching the draft section, and **PUBLICATION BLOCKED · SERVICE STATUS UNKNOWN**.

**Acceptance achieved:** The happy-path observation-import → local draft creation → SHA-256 pair comparison was observed through the UI of a real **desktop** browser. This is separate from the deterministic regression test added in P1-T. The browser was not independently instrumented by CI; screenshot-level evidence does not independently confirm the network provenance, full hash, downloaded file contents, platform-specific browser version or user-device accessibility behavior.

**UI issue observed:** Both native file selectors still showed their reset/default **No file chosen** state after a successful import and comparison. GLO intentionally clears the native file input to permit selecting the same file twice. P1-U adds bilingual, accessible, state-derived text to clarify that the local validated receipt or pair result is currently loaded, *without* displaying arbitrary filenames, persisting files or implying outside verification.

## Still open

- [ ] Physical Android and iOS device file pickers and browser SHA-256 support.
- [ ] Screen reader behavior, keyboard focus and invalid-file recovery on devices.
- [ ] Prove that a deliberately tampered review draft displays rejection in the UI.
- [ ] Independently authorized organizational publisher feed, licensing and authentic reviewer identity.
- [ ] A separately governed publication channel with audited approvals and actual real-world service status.

This evidence supports **desktop UI happy-path acceptance only**. A successful local hash match is not a digital signature or provider-status verification. Issue #11 stays open.
