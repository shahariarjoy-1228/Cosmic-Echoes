# Submission preparation

Cosmic Echoes is a verified hackathon release candidate within the tested scope. The feature freeze applies. Original rules and AI archive gaps block submission readiness. A public release and organizer submission await separate developer authorization.

## Judge-facing material

**Project** — Cosmic Echoes  
**Tagline** — Every star has a voice. Every echo creates a universe.  
**Event as recorded by the project** — Hub's Quest Epoch 1, Recursive Soundscapes Solo Hackathon.

**One line** — Cosmic Echoes turns recursive celestial trees into synchronized procedural music and visuals.

**Short description** — Place a star and watch it branch into a constellation as a pentatonic phrase unfolds. Each generation inherits part of its parent's shape and sound, then grows softer. Three musical environments and four recursion presets let you compose sparse or dense patterns. Pause, resume and replay a take, then export its melody, ambience and effects as a WAV.

**Technical description** — A placement creates a deterministic tree of celestial events, each with a position, parent and timestamp. Recursion stops at the configured depth and checks both live and recording capacity before admitting a complete tree. The mapper derives bounded pentatonic pitches from root position and child relationships. Web Audio schedules soft synthesis and ambience with release-aware voice limits. Canvas draws from the same composition position, using the Web Audio clock. A finalized in-memory recording preserves the events and the notes actually admitted during playback. Replay restores those instructions. OfflineAudioContext renders the same recorded mix, then the exporter writes 44.1 kHz stereo PCM16 WAV. The application uses HTML, CSS and native JavaScript modules and runs over ordinary static HTTP without a build step or runtime service. The root application limits a take to 60 composition seconds and distinguishes early Stop, which cuts the exported audio at the endpoint, from natural completion, which can retain a bounded tail. Recursion and scheduling limits keep dense scenes manageable during playback.

**Innovation** — Each recursive choice leaves a visible and audible trace. Branching shapes the constellation and melodic relationships, while decay softens both descendants and sound.

**AI disclosure** — The developer directed the project, made integration and scope decisions, and performed manual verification. ChatGPT assisted planning and mentoring. Codex assisted implementation, debugging, verification and documentation. The running instrument uses browser-based procedural rules and synthesis. [Disclosure and recovery inventory](AI_USAGE.md) · [Prompt index](../PROMPT_CHAIN.md).

Use the [GitHub repository](https://github.com/shahariarjoy-1228/Cosmic-Echoes), [deliverable map](HACKATHON_REQUIREMENTS.md), [demo scripts](DEMO_SCRIPT.md), [presentation outline](PRESENTATION.md) and [sample WAV](assets/audio/quiet-orbit-sample.wav). Official form fields, participant information, deadlines, word limits and any required public URLs await the original rules. Supply private participant details only through the verified submission channel where required.

## Compliance matrix

Product wording is based on the existing project record. Original pages and exact official wording remain unavailable. The accepted [verification record](TESTING.md) supplies automated and manual evidence for the six product rows.

| ID | Recorded requirement or field | Source | Required or actual evidence | Status and action | Blocking |
|---|---|---|---|---|---|
| P1 | Configurable recursive algorithm | Product map row 1 | Recursion and placement checks; change branching and compare count | Verified within product scope | No |
| P2 | Interactive simulation or visualization | Product map row 2 | Visual and root tests; place a star and resize | Verified within product scope; physical touch open | No |
| P3 | Procedural music using recursion | Product map row 3 | Music, audio and sync tests; listen to the parent and echoes | Verified within product scope | No |
| P4 | Adjustable controls and audio playback | Product map row 4 | Root transport and form tests; pause, resume and replay | Verified within product scope | No |
| P5 | Working audio export | Product map row 5 | WAV and root export tests; prepare, save and play a WAV | Verified within product scope; sample listening pending | No |
| P6 | Polished, accessible relaxation experience | Product map row 6 | Layout checks and developer testing; keyboard placement and reduced motion | Verified within product scope; formal conformance open | No |
| A1 | AI-use disclosure | Project rules record | Disclosure prepared; official policy unavailable | Pending source verification | Yes |
| A2 | Original AI prompts and actual responses | Project rules record | Prompt index and authentic records; gaps enumerated | Incomplete; recover missing originals and archive this final response | Yes |
| A3 | Original attachments | Archive references | Original rules PDF and earlier screenshots missing | Blocked on source files and permitted handling | Yes |
| R1 | Repository accessibility and ownership | GitHub metadata; official rules pending | Public repository; GitHub account namespace verified | Pending source verification for eligibility and visibility rules | If required |
| R2 | Final repository synchronization | Git and live remote | Phase 11 synchronized at audit baseline; Phase 12 changes local | Pending developer action after archive and content review | Yes |
| D1 | Deployment or live URL | Official source unavailable | Static candidate; Pages disabled at audit | Pending source verification and separate authorization if needed | If required |
| D2 | Demonstration, presentation and video | Official source unavailable | Scripts, outline and fallback ready; rehearsal and sample listening open | Pending source verification and developer rehearsal | If required |
| F1 | Eligibility, solo/team limits, identity and institution | Official source unavailable | Project was developed as solo; organizer conditions unavailable | Pending source verification and developer confirmation | Yes |
| F2 | Deadline, timezone, form, fields, file formats and submission channel | Official source unavailable | Original organizer material required | Blocked | Yes |
| F3 | Judging criteria and disqualification conditions | Project rules record; official source unavailable | Historical criteria and weights remain provisional | Pending source verification | Yes |

## Release gates

| Gate | Decision | Evidence or next action |
|---|---|---|
| A · Product integrity | Verified | Approved source and tests match `9c0e64a`. Chrome initialized at the root and a preview subpath. [Smoke evidence](TESTING.md#phase-12-local-release-smoke). |
| B · Documentation integrity | Verified locally | Setup, 153 local link and anchor occurrences, and authentic demonstration assets verified. Official rules alignment remains provisional. |
| C · Official rules | Blocked | Obtain the original PDF or official organizer source and check organizer submission details. |
| D · AI archive | Blocked | Reconcile missing replies, attachments, empty record and current response. |
| E · Demonstration | Pending developer action | Rehearse, review slides and listen independently to the sample. |
| F · Repository synchronization | Pending developer action | Review, commit and synchronize the final approved submission files. |
| G · Deployment | Pending source verification | Pages disabled. Deploy only if useful and allowed after checking the rules and obtaining approval. |
| H · Submission | Pending | Developer approves and completes the actual official submission, then keeps a genuine receipt. |

## Demonstration rehearsal

- [ ] Run the app from the clone over loopback HTTP with audio routed to the intended output. Confirm the initial Canvas renders and that the app is silent before activation. Start a session, place a root and leave time for the audible and visual echoes.
- [ ] Compare Quiet Orbit and Nebula Bloom, explain their event counts, and change an individual parameter. Switch environment between takes.
- [ ] Demonstrate pause and resume, keyboard placement, Auto Meditation and Focus mode. Keep each take below 60 composition seconds when demonstrating early Stop.
- [ ] Finalize and replay a take. Prepare and download a new WAV. Play it and the supplied Quiet Orbit sample independently. Record browser, device, WAV filename and observed results.
- [ ] Run both timed scripts, rehearse the four slides aloud, and keep the screenshots and WAV accessible offline. Check title, tagline, participant details if required, feature and architecture claims, recursion explanation, test evidence and limitations. Confirm that the provisional judging weights and fallback fit the organizer's rules.

## Git and deployment plan

The audit opened on clean `main` at `1fedfd03feb1f12a7ed1c01258f5f4b4b314e1df`, tracking `origin/main`. Live remote `HEAD` and `main` matched. Phase 10 is committed at `9c0e64a`, and the Phase 11 documentation and approval are in `50bf600` and `1fedfd0`. The remote account namespace is `shahariarjoy-1228`. Public metadata showed a public repository with Pages disabled.

1. After resolving archive gaps and publication rights, review `git status --short --branch`, `git diff --check`, and `git diff --exit-code 9c0e64a -- app.js index.html style.css js tests`. Review new files and check that the screenshot and WAV paths are tracked. The hygiene scan found no common credential signatures. Historical transcripts contain local paths and need a publication review before any new archive material is pushed.
2. Separately authorize staging, committing and pushing. Stage only reviewed file paths, inspect `git diff --cached --check` and `git diff --cached --stat`, then use a message such as `docs: prepare hackathon submission and reconcile AI archive`. Use a regular push after rechecking the live remote and reconciling any divergence with the developer.
3. Before submitting, compare `git rev-parse HEAD` with `git ls-remote origin refs/heads/main`. Check the repository and required evidence links in the access context the judges will use. Audit the archive again after adding this final response and any later exchanges.

The app has a root `index.html`, relative case-matched ES module and style paths, and uses Canvas 2D, Web Audio, OfflineAudioContext and a browser Blob download. It has no required backend route, external asset service, private API key or hardcoded localhost runtime dependency. Phase 10 Chrome integration checks passed beneath `/preview/`.

If hosting is permitted and the developer authorizes it, GitHub Pages is a potential static host. Publishing `main` at `/(root)` would include archive and documentation content in the publishing source. Prefer a separately approved deployment branch such as `gh-pages`, with only the verified `index.html`, `style.css`, `app.js` and `js/` at its root, if the rules permit this separation. A maintainer can then select **Settings → Pages → Deploy from a branch**, choose that branch and `/(root)`, and save. Exact repository controls depend on permissions, which were not verified. Use the URL reported by GitHub once deployment succeeds. [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Post-deployment checks remain pending. At the actual HTTPS URL, confirm the deployed commit or artifact, module and CSS requests, Canvas, initial silence, gesture-started audio, manual placement and recursive synchronization, pause/resume, Auto Meditation, Focus mode, recording finalization, replay, WAV preparation and actual download, independent playback, browser errors and intended documentation links.

## Submission checklist

- [ ] Obtain the official rules and confirm eligibility, deadline/timezone, channel, fields, judging criteria, required evidence and visibility/deployment policy.
- [ ] Confirm product integrity and review the accepted evidence and limitations.
- [ ] Recover the missing authentic records and attachments or follow organizer-approved handling. Review private or restricted material and recheck the index.
- [ ] Rehearse and independently play the sample. Complete any organizer-required video, presentation or deployment checks.
- [ ] Review and synchronize the authorized final commit. Confirm the remote revision and required access.
- [ ] With separate authorization, complete the official submission and retain its actual confirmation. Preserve any subsequent AI exchanges required by the rules.
