# Original level evaluation report

This report covers the original catalogs. Its results do not validate either redesigned game; see the current [Signal Mixing](signal-mixing-results.md) and [Semantic Golfing](semantic-golfing-results.md) evaluations.

Validated on 2026-09-26 using the current catalog and updated node-llama-cpp checkout. Every round has a natural winning answer on each built-in model, verified through real Electron inference. Classification still has the limitations below; the negative suite is not entirely passing.

## Catalog and real Electron playthrough

Each game has 11 levels and 51 rounds: 102 rounds total. Level 11 has eight rounds, and advanced rounds have up to seven visible conditions. Shorter successful messages earn higher scores; latest and best level scores are stored separately per model and shown in **My scores**, alongside game totals.

| Built-in model | Rounds completed in Electron | Completed levels saved | Completed typing evaluations |
| --- | ---: | ---: | ---: |
| Gemma 4 E2B Q8_0 | 102 / 102 | 22 | 542 |
| Gemma 4 E2B Q6_K | 102 / 102 | 22 | 444 |
| Qwen 3.5 2B Q4_K_M | 102 / 102 | 22 | 629 |
| Qwen 3.5 0.8B Q8_0 | 102 / 102 | 22 | 982 |
| **Total** | **408 / 408** | **88** | **2,597** |

The playthrough typed reference answers character by character through the real UI, checked model and question identities, and saved every level. It also checked that editing a winning answer immediately disables completion until a matching result arrives. Scores were verified in the four-model table. Tests used an isolated profile with hardlinked model files; existing user scores and models were untouched.

Current replays used 75ms per character. Retained Gemma Semantic Golfing runs with unchanged questions used 15ms per character. The app coalesces edits during inference, so typing every character does **not** evaluate every prefix. Greeting checks separately waited for each response. None of the observed greeting prefixes or inputs up to eight characters completed a round; longer unfinished inputs can still do so, as described below.

Coverage counts only results matching current question hashes and current reference answers. Natural answers are in [level-solutions.ts](fixtures/level-solutions.ts), outside the shipped application. A winning reference establishes solvability, not acceptance of every reasonable phrasing.

## Negative-input sweep

Each model was tested against 1,647 current-question cases: 1,326 common-input cases, 102 single-meaning near misses, 204 copied-label cases, three missing-detail cases, and 12 additional praise fragments. Common inputs include greeting fragments, `I`, `I am`, punctuation, numbers, unrelated text, and an instruction to mark everything as matched.

| Model | Cases checked | Common / near-miss / missing-detail false wins | Copied-label false wins |
| --- | ---: | ---: | ---: |
| Gemma Q8 | 1,647 | 0 | 33 |
| Gemma Q6 | 1,647 | 0 | 41 |
| Qwen 2B | 1,647 | 0 | 13 |
| Qwen 0.8B | 1,647 | 0 | 13 |
| **Total** | **6,588** | **0** | **100** |

Copied-label failures remain part of the suite, and the runner correctly exits unsuccessfully for them. An observed false win is retained even if a later attempt rejects the same input. Identical document/question evaluations can be reused within a model run; negative-sweep timings are therefore unsuitable for performance comparisons.

## Changes supported by playtesting

- Signal Mixing evaluates independent binary category questions. Both targets must reach 70%, while distractors must remain below 70%. Semantic Golfing requires every noul condition to reach 70%.
- Tightened definitions for animal names, actual questions, refusals, repairs, named historical references, food, technology, leisure, and praise. For example, a repair now requires an identified broken object and a described repair after Gemma Q6 accepted `I` in a repair/offer round.
- Replaced overlapping distractors and corrected reference answers that omitted required times or prices. Every reference was checked against its character budget and requested details.
- Added clearer natural alternatives where models rejected reasonable answers: explicit invitations, actual lessons, food offers, and reviews describing a concrete bad experience. Questions and thresholds were not loosened to admit these references.
- Updated the tutorial to use `I absolutely love the cake! I hated the rude service.` All four models accept this 53-character example.
- Kept the shared document format `Text: <JSON-quoted message>`. Broader prompt rewrites and additional validity checks were rejected when they weakened natural answers. Completion depends on visible conditions and the character budget, without a hidden classifier or minimum-length gate.

## Remaining model limitations

1. **Copied labels can pass without evidence.** Models sometimes accept the names of requested conditions instead of text that demonstrates them. There are 100 recorded false wins in the negative corpus.
2. **Longer unfinished messages can pass too early.** Gemma Q8 accepted `Let me help repair your cr` before a broken object was actually named. Other traces include `Great food, slow se` and `Thanks! I hated the awf`. The zero short-prefix result above does not cover every unfinished sentence.
3. **Natural phrasing and borderline scores vary.** Qwen 2B's invitation reference moved from 72.6% to 69.8%, and a Qwen 0.8B complaint reference moved from 71.2% to 68.5%. Clearer references provide larger margins, but some reasonable phrasings are still rejected. Gemma Q6 can also classify a statement as a question.

The playthrough establishes that the full progression is solvable with ordinary messages on all four models. It does not establish perfect semantic judgment or prevent every shortcut.

## Runtime and observed latency

- node-llama-cpp: `29d26bc48f80a5b2c98b780592357adfe8143ec7` on `gilad/structuredDecisionsImprovement`.
- llama.cpp: v0.5.0 / `7fe450e19305b828c199d602c23a8337aaa1f03b`, with patches supplied by node-llama-cpp's source-download command.
- Linux ARM64 CPU, 10 available CPUs, approximately 15 GiB RAM; no GPU inference.
- Built with the supported `GGML_CPU_REPACK=OFF` option because repack allocations trapped inside Electron. No custom library-source edits; the node-llama-cpp root working tree is clean.

These are local observations from the latest winning full-message UI evaluation for each model/round. They mix three-to-seven-question rounds, different messages, and cached prefixes; they are not a controlled cross-platform benchmark.

| Model | Median evaluation | 95th percentile |
| --- | ---: | ---: |
| Gemma Q8 | 2.37 s | 2.92 s |
| Gemma Q6 | 3.51 s | 4.86 s |
| Qwen 2B | 2.28 s | 2.71 s |
| Qwen 0.8B | 1.02 s | 1.22 s |

## Application checks and reproduction

All ten automated application checks, lint, TypeScript, Vite, Linux ARM64 unpacked packaging, and the packaged native-runtime smoke test pass. The packaged app also loaded Qwen 0.8B and completed a real three-condition decision. macOS, Windows, and Linux x64 jobs are configured but were not run on this machine; no release was published.

Separate Electron editing and persistence checks cover caret stability, current-input completion, shorter replay, model separation, atomic writes, concurrent saves, reloads, and corrupt-file protection. Layout checks cover both themes, compact windows, independent scrolling, seven bars, eight-round result screens, and score tables. Mock inference in layout/editing checks is separate from the real-model playthrough above.

The native runner is [levels.eval.ts](levels.eval.ts); it uses the app's actual request construction and win rules and records question hashes, probabilities, and durations. [README.md](../README.md) contains commands for solution, negative, typing, editing, persistence, and packaged-runtime checks.

Raw local evidence is under `/tmp/live-decisions-levels-cpu`, including `runtime.txt`, `electron-solutions.jsonl`, `electron-typing.jsonl`, `validated-evidence.json`, `negative-coverage.json`, and `final-report-data.json`. Both positive and negative coverage have no missing current-catalog cases. The temporary Electron harness is `/tmp/decision-browser-tools/levels-real.mjs`; its isolated profile is `/tmp/live-decisions-play-test`.
