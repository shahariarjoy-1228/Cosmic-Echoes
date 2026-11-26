# Cosmic Echoes — Agent Instructions

## Project Context

Cosmic Echoes is a browser-based procedural music and cosmic visualization application for the Hub's Quest Epoch 1 solo hackathon.

The developer is a JavaScript beginner working with AI assistance under a 24-hour deadline.

## Development Priorities

1. Relaxation and user experience.
2. Musical quality.
3. Creative and genuine use of recursion.
4. Visual design.
5. Interaction and usability.
6. Reliable technical execution.

## Technology Constraints

- Use HTML5, CSS3 and vanilla JavaScript.
- Use Canvas 2D for visual rendering.
- Use the Web Audio API for procedural sound.
- Use OfflineAudioContext for WAV export.
- Do not introduce frameworks, backend services, databases, paid APIs or external runtime dependencies.
- Do not require a build step.
- Keep the implementation understandable to a beginner.

## Architecture

- Separate recursion, musical mapping, audio synthesis, visual rendering and export.
- The recursive generator must not directly draw graphics or play audio.
- Use a shared event timeline for audio and visual synchronization.
- Prefer deterministic behavior and bounded recursion.
- Maintain clear responsibilities for every module.

## Audio Requirements

- Use consonant scales and structured melodic relationships.
- Avoid unrestricted random frequencies.
- Use soft instruments, gradual envelopes and controlled reverb.
- Limit polyphony and prevent audio clipping.
- Initialize browser audio only after user interaction.
- Ensure graceful stopping and resetting.
- Include ambient layers and effects in audio export.

## Development Rules

- Implement only the explicitly requested development phase.
- Do not modify unrelated working functionality.
- Do not introduce unnecessary features.
- Preserve the mandatory deliverables documented in [docs/HACKATHON_REQUIREMENTS.md](docs/HACKATHON_REQUIREMENTS.md).
- Use readable names and concise comments.
- Explain important technical decisions in beginner-friendly language.
- Identify assumptions and unresolved issues.
- Never fabricate implementation status, test results or Git history.

## Testing Rules

- Verify recursion base cases and event counts.
- Check invalid parameters and maximum event limits.
- Verify playback, synchronization and export.
- Report which tests were actually executed.
- Clearly distinguish automated verification from manual listening and browser testing.

## Documentation

- Maintain docs/PROGRESS_LOG.md.
- Record actual testing results in docs/TESTING.md.
- Keep README.md consistent with implemented functionality.
- Preserve complete AI prompts and corresponding responses under ai-logs/.
- Maintain PROMPT_CHAIN.md as the AI interaction index.
- Never commit credentials or unrelated private information.

## Current Phase

Phase 10 is complete and developer-approved. Cosmic Echoes is a verified hackathon release candidate within the tested scope. Phase 11 documentation and demonstration preparation is complete and developer-approved within the documented scope. Rehearsal and original AI transcript recovery remain outstanding. The feature freeze remains in effect. Phase 12 — Final Submission is next planned and requires explicit authorization. See the [progress log](docs/PROGRESS_LOG.md).

Do not implement application functionality until explicitly instructed.