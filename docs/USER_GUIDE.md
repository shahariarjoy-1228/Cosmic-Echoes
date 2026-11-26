# User guide

Open the root page over [local HTTP](../README.md#run-locally). Load and listen at a comfortable monitoring volume. Audio begins after you select **Start session**.

1. Choose **Deep Space** (C major pentatonic), **Nebula Dreams** (A minor pentatonic), or **Solar Harmony** (F major pentatonic). The environment sets the scale and palette and is fixed during a session.
2. Choose a **Recursion preset**. Click the sky or use **Place center star**. For precise keyboard placement, enter normalized X and Y in the coordinate form and select **Place star**.
3. Use **Pause** and **Resume** to hold the shared timeline. **Stop** finalizes the recording early. A session also completes naturally at 60 composition seconds. **Replay** plays back a finalized recording. **Clear recording** discards the current take when available.
4. After recording, select **Prepare WAV**, then **Download WAV** when ready. **Cancel export** stops a preparation when shown and **Clear WAV** removes the prepared download. The recording remains available for retry. The monitoring slider affects live listening only. The downloaded file is 44.1 kHz stereo 16-bit PCM and includes the recorded melody, ambience and effects. Early Stop cuts all layers at the endpoint. Natural completion can retain up to four seconds of tail.

| Preset | Depth | Children | Decay | Spread | Base delay | BPM | Stars/root |
|---|---:|---:|---:|---:|---:|---:|---:|
| Quiet Orbit | 2 | 1 | 0.65 | 60° | 1.50 s | 45 | 3 |
| Starlight (default) | 3 | 2 | 0.65 | 100° | 0.80 s | 55 | 15 |
| Nebula Bloom | 3 | 3 | 0.60 | 140° | 1.20 s | 50 | 40 |
| Cosmic Cascade | 4 | 3 | 0.55 | 120° | 0.80 s | 65 | 121 |

Adjust depth, children, tempo, decay, spread or delay to shape subsequent placements. **Custom** appears when the settings differ from every preset. The recursion choice is independent of the musical environment.

- **Auto Meditation** attempts one preset-shaped root every five seconds of composition time. Pause suspends it and replay uses the original recorded stars. Turn it off to compose manually.
- **Focus mode** enlarges the sky and keeps transport, monitoring and center placement available. Select **Exit focus mode** or press Escape outside editing controls.
- Use **Follow system**, **Full motion**, or **Reduced motion** and toggle background particles, ripples and constellation lines independently. Reduced motion retains the recursive structure.
- If placement is rejected, check the status and the occupied and recorded counts. Retry after live events expire if live capacity was the limit. A full recording requires a fresh take. If the sky will not load, check that the URL starts with HTTP and that the Python server was launched from the repository root.
- Recordings are held in memory. Download the WAV before reloading or leaving. Use the [demo fallback](DEMO_SCRIPT.md#fallback) if live playback or export is unavailable.
