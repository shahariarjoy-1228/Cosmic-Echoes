# Recursive celestial engine

Placing a star creates a tree. The star you place is the root at depth 0. Each star emits the configured number of children until it reaches the maximum depth. A depth of 0 emits only the root.

| Control | Range | Starlight default |
|---|---:|---:|
| Maximum depth | 0–4 | 3 |
| Children per star | 1–3 | 2 |
| Decay | 0.35–0.85 | 0.65 |
| Spread angle | 30–180° | 100° |
| Base generation delay | 0.40–2.00 s | 0.80 s |
| Tempo | 40–80 BPM | 55 BPM |

The root starts facing up. A single child continues along its parent's angle. Siblings spread evenly around that heading. Each child moves one parent radius in its own direction, with both coordinates clamped to the normalized 0–1 canvas. A child inherits its parent's radius, duration and amplitude multiplied by decay. Each generation starts `base delay × 55 / BPM` seconds after the previous one. Siblings share an onset. Identical inputs produce identical events.

```text
emit(star, path):
    append star
    if star.depth equals maximum depth: return
    for each child index:
        derive child position, depth, envelope and onset
        emit(child, path extended by child index)
```

```text
Depth 0             root
                   /    \
Depth 1           A      B
                 / \    / \
Depth 2         AA AB  BA BB
```

The traversal emits parents before children in depth-first order. Event IDs encode the root ID and child path. Each child carries a parent ID, so Canvas can draw the corresponding line. The timestamp controls playback order.

With branching factor **b** and maximum depth **d**, the number of stars is **1 + b + … + bᵈ**. For b > 1, this is **(bᵈ⁺¹ − 1) / (b − 1)**. For b = 1, it is **d + 1**. Examples are depth 0 → 1, unary depth 2 → 3, binary depth 3 → 15, ternary depth 3 → 40 and ternary depth 4 → 121. Generation visits each event once, with up to O(d) work per event to copy and encode its path. It retains the resulting events and uses at most d + 1 recursive frames.

Before placement, the controller checks the whole tree against the 121-event per-root limit and the 300-event live and recording budgets. A rejected tree creates zero stars or notes. Expired visuals free live slots. Recorded events retain their recording slots until the recording ends and a new one begins or the recording is cleared.

See the [generator](../js/recursion.js) and [shared timeline](ARCHITECTURE.md#synchronization).
