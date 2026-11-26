# Hub's Quest Epoch 1 Hackathon Requirements

The deliverables, weights and AI policy below reflect the developer's earlier project record. The original Hub's Quest Epoch 1 rules PDF and an authoritative organizer source were unavailable during Phase 12. Exact wording, source pages, eligibility, team restrictions, deadline and timezone, platform, fields, publication and deployment rules, required assets and disqualification criteria remain unverified. The six product deliverables retain their scoped Phase 10 acceptance. [Compliance matrix](SUBMISSION.md#compliance-matrix).

## Mandatory deliverables

| # | Requirement | Implementation files | Judge action | Scoped automated and developer evidence |
|---|---|---|---|---|
| 1 | A functional recursive algorithm with configurable parameters. | `js/recursion.js`, `app.js` | Change branching and compare the displayed count. | Recursion and root placement/count tests passed. Developer confirmed parameters, echoes and count feedback. |
| 2 | An interactive simulation or visualization. | `js/visuals.js`, `app.js`, `index.html` | Place a second root and resize the window. | Visual and root integration tests passed. Developer confirmed placement, resize and multiple roots. Physical touch unverified. |
| 3 | A procedural music-generation system that uses the recursive process. | `js/recursion.js`, `js/music.js`, `js/audio.js` | Listen to a root and its descendants in two environments. | Music, audio and synchronization suites passed. Developer confirmed all environments and synchronized recursive echoes. |
| 4 | A user interface with parameter controls and audio playback. | `index.html`, `style.css`, `app.js`, `js/audio.js` | Pause, resume, stop and replay. | Root transport and form tests passed. Developer confirmed controls, playback, pause/resume and replay. |
| 5 | A working audio export feature. | `js/export.js`, `js/audio.js`, `js/controller.js`, `app.js` | Prepare, download and play a WAV. | WAV format and root preparation tests passed. Developer confirmed root download and independent-player playback. |
| 6 | A polished, accessible experience designed around relaxation and enjoyment. | `index.html`, `style.css`, `app.js`, `js/visuals.js`, `js/music.js`, `js/audio.js` | Compose with the keyboard and enable reduced motion. | Root checks passed at six widths, with visible keyboard focus. Developer confirmed keyboard placement, reduced motion and calm presentation. Formal accessibility and physical touch unverified. |

## Provisional evaluation weights

- Relaxation and user experience — 35%
- Musical quality — 25%
- Creative use of recursion — 15%
- Visual design — 10%
- Interaction and usability — 10%
- Technical execution — 5%

## Judge walkthrough

| Criterion | Product and evidence | Judge action |
|---|---|---|
| Relaxation and user experience (35%) | Sparse placement, ambience, monitoring control and Focus Mode. Developer accepted the calm presentation. [User guide](USER_GUIDE.md) | Let a Quiet Orbit root decay while listening in Focus mode. |
| Musical quality (25%) | Three pentatonic environments, soft synthesis and bounded voices. Music/audio tests and manual listening passed. [Musical mapping](ARCHITECTURE.md#musical-mapping) | Compare a short Deep Space phrase with a fresh Nebula Dreams take. |
| Creative use of recursion (15%) | Each parent shapes descendant timing, geometry and pitch. Generation and limit checks passed. [Algorithm](ALGORITHM.md) | Compare Quiet Orbit's three events with Nebula Bloom's 40. |
| Visual design (10%) | Canvas glow, ripples, connections and palette changes. Visual tests and developer manual checks passed. [Captures](assets/README.md) | Change environment between takes and briefly enable reduced motion. |
| Interaction and usability (10%) | Pointer and keyboard placement, feedback, transport, recording and export. Root tests and manual checks passed. [User guide](USER_GUIDE.md) | Place a star with the keyboard, pause, replay and download. |
| Technical execution (5%) | Native browser modules, shared audio clock, atomic bounds and offline WAV. Final automated QA passed. [Evidence](TESTING.md#phase-10-automated-qa) | Inspect the timing evidence and verify the download plays. |

The original rules PDF remained unavailable during Phases 11 and 12. The accepted evidence and limits are recorded in the [testing record](TESTING.md).

## AI usage requirement

The earlier project record describes permission to use AI coding agents and a requirement to preserve original prompts and corresponding responses in the repository, with possible disqualification for omissions. Confirm the exact policy, attachment handling and disclosure terms with the organizer. Archive completeness remains outstanding.

The [prompt index](../PROMPT_CHAIN.md) tracks archival status.
