# P1-T: First genuine manual observation acceptance

**Original review trail:** [GLO Public Source Observation Actions run #38985444980](https://github.com/MichaelWave369/GLO/actions/runs/38985444980), manually dispatched on main after PR #30 merged.

Source of the static regression fixture: the glo-public-website-observation artifact from that specific GitHub Actions run. The separately executed HEAD observation, schema check, and artifact upload steps all completed successfully. The Actions artifact is short-lived (three-day retention), so a **public-only exact copy** of its JSON observation, with no additional fields, is pinned under tests/fixtures/manual-211-observation-2026-10-16.json for regression checks. The fixture is a tested example, not an authenticated or live source feed. The run logs and their authenticity remain external to this repository's JSON copy.

## What was actually observed

| Property | Value |
| --- | --- |
| Requested URL | https://www.211.org/ |
| Method | HEAD; redirect following disabled |
| Observation timestamp (UTC) | 2026-10-17T00:14:42.832Z (October 16 in Pacific time) |
| Result | redirect_unfollowed |
| HTTP status | 301 |
| Service availability | unknown |
| Publication approval | not-approved |

**Interpretation:** The remote public website returned an HTTP redirect to the CI runner's HEAD request. This establishes neither the destination of the redirect (the receipt intentionally does not store the Location header) nor whether the redirected page contains a valid directory, nor whether any provider is open or available. It is **not** a public feed import, publisher verification, or permission to publish a service claim. No user/private coordinates or notes were present in the receipt.

## Replaying the acceptance chain

Run npm test from the repo root to check the pinned public observation against the strict schema and execute offline: validated 301 receipt → explicit non-publishing draft for each of three dispositions → independent SHA-256 pair comparison. These are deterministic replay tests with the real observed JSON. They are **not** another online observation, an authenticated person-level approval, or phone browser acceptance.

To exercise the live manual workflow yourself, open the [GLO Public Source Observation Actions page](https://github.com/MichaelWave369/GLO/actions/workflows/glo-public-source-check.yml), select **Run workflow** on main, and inspect the resulting glo-public-website-observation artifact. That workflow is manual-only: it performs a fixed public website HEAD request without following redirects, validates the result and emits a review-only artifact, with no site publication or provider status changes.

For field acceptance, download the receipt JSON from the ZIP and open it under GLO's **Public source check desk**, then deliberately select a disposition, acknowledge the limitations, prepare a local review draft, download it, and compare the pair in GLO. Check both English and Spanish, offline phone file pickers, accessible focus, mismatch warnings, and that **LOCAL CONTENT MATCH ONLY / PUBLICATION BLOCKED** remain visible. Do not submit actual personal locations or private service-recipient details.

## Outstanding independent gates

- [ ] One real Android and iOS file-picker / reviewer acceptance test.
- [ ] Source publisher authorization, applicable data licensing, and a reviewed organizational directory adapter (211 protected API access is **not** assumed).
- [ ] Authenticated reviewer identity and separate auditable publication authority (not supplied by SHA-256).
- [ ] Independently supported service-operation evidence before any verified status claim.
- [ ] Optional Infinite Commons interchange contract only if there are multiple real independent publishers.

The first manual Actions receipt **closes only the “run public-site observation at least once” sub-check**. [Issue #11](https://github.com/MichaelWave369/GLO/issues/11) stays open.
