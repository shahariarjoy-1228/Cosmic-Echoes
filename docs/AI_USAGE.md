# AI use and transcript recovery

The developer chose the project direction, made scope and integration decisions, performed manual verification and owns submission preparation. ChatGPT supported ideation, mentoring, prompt preparation and review. Codex assisted with implementation, debugging, tests and documentation. The running application generates events, graphics and audio locally using deterministic rules and browser APIs. It uses no runtime AI service.

The [prompt index](../PROMPT_CHAIN.md) and [original records](../ai-logs/) document the available exchanges. “Archived” means the file contains the original prompt and corresponding final response. Archive completeness for the hackathon remains outstanding. All 41 indexed paths resolve. Of these, 25 records are archived, 15 are incomplete and one is empty. The archived records cover 40 exchanges because S19 contains 16 pairs. The extra unindexed 018 file is empty.

| Record | Prompt or attachment | Response | Recovery status |
|---|---|---|---|
| 001 | Text present. Rules PDF referenced by name only | Missing | Incomplete |
| 002–005 | Text present | Missing | Incomplete |
| 006–008 | Text present. Original screenshots missing | Missing | Incomplete |
| 009–012 | Original image prompts missing | Missing | Incomplete |
| 013, 015, 017–020, 026 | Present, including original task attachments where applicable | Present | Archived |
| 014 | Exact submitted prompt missing | Missing | Incomplete |
| 016 | Missing | Missing | Indexed empty file |
| Extra 018 | Missing | Missing | Unindexed empty file with duplicate identifier |
| S01–S17 | Original project prompts or submitted attachments | Original Codex replies | Archived |
| S18 | Original initial setup prompt | No final reply in the available session | Incomplete |
| S19 | 16 archive coordination prompts in source order | 16 corresponding Codex replies | Archived |
| Phase 11 implementation | Original task attachment preserved | Final response generated after the inventory | Incomplete |

Recover the original ChatGPT replies for 001–012 and 014, the submitted prompt for 014, the original screenshots for 006–012, and the rules PDF referenced in 001. Confirm the source and contents for 016 and whether a reply to S18 exists elsewhere. Archive the Phase 11 final response and any subsequent review. Confirm whether any project exchanges occurred outside the indexed sessions. Reconcile the duplicate-ID empty file after confirming it contains no undiscovered material. Review archive content for credentials and unrelated private data before submission. See the [hackathon archive requirement](HACKATHON_REQUIREMENTS.md#ai-usage-requirement).
