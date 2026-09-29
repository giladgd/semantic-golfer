# Signal Mixing validation

The revised game replaces independent topic matching with competing communication goals. There are 11 levels and 52 rounds; the final level has eight rounds. Players read a concrete brief, bring every goal above its target, and keep the risks below their limits. Each round defines its own number of goals. Budgets grow with the detail the task needs.

| Level | Practice focus | Character budget | Human solve-time target per round |
| --- | --- | ---: | --- |
| 1 | Tactful, specific requests | 150 | Up to 1 minute |
| 2 | Constructive friction | 190 | 1-2 minutes |
| 3 | Ownership and repair | 250 | 3-5 minutes |
| 4 | Useful boundaries | 310 | 5-8 minutes |
| 5 | Honest uncertainty | 360 | 7-10 minutes |
| 6 | Scope, time, and money | 430 | 8-12 minutes |
| 7 | Privacy and trust | 490 | 10-14 minutes |
| 8 | Messages for two audiences | 550 | 11-16 minutes |
| 9 | Contingency plans and consent | 630 | 12-18 minutes |
| 10 | Difficult corrections and ethical limits | 710 | 14-22 minutes |
| 11 | Combined constraints | 850 | 15-30 minutes |

The timing ranges are design targets, not measured human results. Automated inference can establish that a particular answer passes and that a particular shortcut fails; it cannot establish that a round takes most people a specified time or that nobody can find another shortcut. Human playtesting is still needed to measure difficulty.

## Complete-round results

These counts supersede the earlier catalog's validation results. The game has 222 independent positive requirements across 52 rounds, plus its risk bars. The largest rounds have 14 bars. Every round has a natural winning reference on every built-in model; a separate suite tests both conversational rewrites for every round without stopping at the first success.

| Model | Rounds with a winning reference | Conversational messages accepted |
| --- | ---: | ---: |
| Gemma 4 5B E2B Q8_0 | 52 / 52 | 98 / 104 |
| Gemma 4 5B E2B Q6_K | 52 / 52 | 95 / 104 |
| Qwen 3.5 2B Q4_K_M | 52 / 52 | 53 / 104 |
| Qwen 3.5 0.8B Q8_0 | 52 / 52 | 78 / 104 |

Together with Semantic Golfing, this covers all 103 rounds on all four models and 211 conversational messages per model. Rejected valid messages remain in `test/fixtures/game-paraphrases.ts`; the `paraphrases` phase exits unsuccessfully if any are rejected. Winning references establish solvability, not that every reasonable answer passes. Qwen models remain particularly sensitive to wording.

The questions distinguish each required action instead of relying on a general tone score. For example, declining dinner, thanking the host, and offering another way to connect have separate bars. The audit refined ordinary paraphrases, implicit pronoun references, conditional plans, credit corrections, and consent. Context-specific risk definitions stay local to their rounds: salary wording must not change the charger request, and accepting public feedback must not mean promising control of future decisions. Changes that rejected straightforward complete references were reverted.

Goals still require 70%, and risks must remain below 60%. The game uses actual model probabilities without rescaling, per-model exceptions, or keyword rules.

## Limits of the checks

Focused probes included missing-detail and explicit-risk counterexamples. The broader omission, contradiction, and copied-instruction stress suites are not claimed to pass for the revised catalog. In particular, small models can miss a later contradictory offer of decision-making power even after correctly accepting ordinary public feedback. A passing solution does not prove that every incomplete or manipulative answer is rejected.

The earlier all-omissions-passing figures applied to an older question set and must not be treated as results for this revision. Old raw evidence remains under `/tmp/signal-mixing-v2`; current complete-board and conversational evidence is under `/tmp/game-language-check`.

Every round rejects both `h` and `hello` on every model: 416 checks, with no false wins. Across both games, the 824 checks include 256 retained observations with exact current question hashes and 568 new evaluations. This does not establish that every longer incomplete message is rejected.

Regression checks pass: 42 unit tests, app and website TypeScript, evaluation-runner TypeScript, focused lint, and the production app build. The macOS-only native icon test is skipped on this Linux host.

## Method and reproduction

Checks use published node-llama-cpp 3.22.1 on Linux ARM64 CPU, a 4096-token maximum context, three parallel questions, and eight threads. Models run sequentially, with each context and model disposed before the next loads. The evaluator uses the app's request construction, complete question sets, answer mapping, and win rules. Results are only retained when their complete question-set SHA-256 and input text match the final catalog.

```sh
npm run test:levels -- --game signalMixing --phase solutions --models-dir /path/to/models --output /tmp/signals-solutions.jsonl
npm run test:levels -- --game signalMixing --phase paraphrases --models-dir /path/to/models --output /tmp/signals-paraphrases.jsonl
npm run test:levels -- --game signalMixing --phase omissions --models-dir /path/to/models --output /tmp/signals-omissions.jsonl
npm run test:levels -- --game signalMixing --phase negatives --negative-scope risks --models-dir /path/to/models --output /tmp/signals-risks.jsonl
```

The models directory must contain `gemma-q8.gguf`, `gemma-q6.gguf`, `qwen-2b.gguf`, and `qwen-0.8b.gguf`. Fixtures and evaluation tools stay outside the shipped application.

Native Node evaluations are separate from desktop playtesting. The existing Electron 44.4.5 `SIGTRAP` on this Linux ARM64 CPU host prevents loading the three larger models in a desktop playthrough here. Earlier Qwen 0.8B Electron checks validated interaction and score persistence; they are not presented as four-model desktop verification of these revised questions.
