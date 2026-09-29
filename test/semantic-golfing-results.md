# Semantic Golfing validation

The game has 51 distinct rounds across 11 levels, with eight rounds in the final level. Its 260 positive goals use 3-7 bars per round. Briefs stay short, and character budgets grow from 120 to 370. Existing scores are preserved.

## Parcel patrol regression

The pickup check now explicitly accepts relative places such as “my home,” “at mine,” and “the porch.” Having somebody's package or naming a pickup time alone does not specify a pickup place. The brief asks where to collect the parcel, rather than conflating its current location with a future pickup location.

The exact reported message is retained in `test/fixtures/game-paraphrases.ts`:

> I got your package, come pick it at my home at 5pm

| Model | Has their parcel | Pickup location | Pickup time | Round passes |
| --- | ---: | ---: | ---: | --- |
| Gemma 4 5B E2B Q8_0 | 100.0% | 100.0% | 100.0% | Yes |
| Gemma 4 5B E2B Q6_K | 100.0% | 100.0% | 100.0% | Yes |
| Qwen 3.5 2B Q4_K_M | 87.2% | 87.6% | 96.9% | Yes |
| Qwen 3.5 0.8B Q8_0 | 98.9% | 92.4% | 98.1% | Yes |

Removing each of the three required details produces 12 omission checks across the four models. All 12 leave the removed detail below its threshold and the round unsolved. Typing the exact reported sentence at 75 ms per character through the app's single-flight runner produces 37 observed evaluations: all four completed messages pass, and no tested greeting or fragment of eight characters or fewer wins. Coalescing skips intermediate input states while inference runs.

## Complete-round results

These results supersede the earlier catalog's validation counts. Every round has a natural winning reference on every built-in model. A separate conversational suite tests every example, including rejected valid wording; it does not stop at the first win.

| Model | Rounds with a winning reference | Conversational messages accepted |
| --- | ---: | ---: |
| Gemma 4 5B E2B Q8_0 | 51 / 51 | 99 / 107 |
| Gemma 4 5B E2B Q6_K | 51 / 51 | 98 / 107 |
| Qwen 3.5 2B Q4_K_M | 51 / 51 | 63 / 107 |
| Qwen 3.5 0.8B Q8_0 | 51 / 51 | 71 / 107 |

Together with Signal Mixing, the audit covers all 103 rounds on all four models and 211 conversational messages per model. Passing references establish solvability, not universal acceptance of reasonable wording. The smaller Qwen models still reject many valid paraphrases. Those failures remain in the fixtures, and the `paraphrases` phase intentionally exits unsuccessfully while they remain.

Questions were refined using complete messages, omitted-detail counterexamples, and alternative phrasings. Changes address relative places, pronouns, quantities, original versus delivered items, and initial versus return locations. Changes that made ordinary complete references fail were reverted. No thresholds, model probabilities, or win rules were changed, and there are no model-specific exceptions or keyword shortcuts.

The omission and contradiction stress suites are not claimed to pass. Models can still infer absent details or miss contradictory statements. For example, Qwen 0.8B can mistake the sandwich that arrived for the unspecified original order. This is a model-judged writing game, not a reliable logical validator.

Every round rejects both `h` and `hello` on every model: 408 checks, with no false wins. Across both games there are 824 such checks; 256 unchanged observations were retained with exact question hashes, and 568 were evaluated again. These two inputs are a regression check, not exhaustive coverage of incomplete messages.

Regression checks pass: 42 unit tests, app and website TypeScript, evaluation-runner TypeScript, focused lint, and the production app build. The native macOS icon test is skipped on this Linux host.

## Method and reproduction

Checks use published node-llama-cpp 3.22.1 on Linux ARM64 CPU, a maximum context of 4096 tokens, three parallel questions, and eight threads. Models run sequentially; each context and model is disposed before the next loads. Complete boards use the app's request construction, answer mapping, and win rules. Coverage only counts observations whose full question-set SHA-256 and input text match the final catalog; unchanged observations are retained between revisions. Raw local evidence is in `/tmp/game-language-check`.

The models directory must contain `gemma-q8.gguf`, `gemma-q6.gguf`, `qwen-2b.gguf`, and `qwen-0.8b.gguf`.

```sh
npm run test:levels -- --game lock --phase solutions --models-dir /path/to/models --output /tmp/golf-solutions.jsonl
npm run test:levels -- --game lock --phase paraphrases --models-dir /path/to/models --output /tmp/golf-paraphrases.jsonl
npm run test:levels -- --game lock --phase omissions --models-dir /path/to/models --output /tmp/golf-omissions.jsonl
npm run test:levels -- --game lock --round 2-1 --phase typing --typing-interval 75 --models-dir /path/to/models --solutions-file /tmp/golf-solutions.jsonl.solutions.json --output /tmp/parcel-typing.jsonl
```

Typing uses the app's single-flight runner. At 75 ms per keystroke, inference coalesces intervening edits; it does not evaluate every possible prefix. A complete meaning can legitimately pass before the final punctuation.

These are native Node evaluations, not a four-model Electron playthrough. The previously reproduced `SIGTRAP` while loading the three larger models in Electron 44.4.5 on this Linux ARM64 host remains a separate limitation. Earlier desktop interaction and score-persistence checks are not counted as native validation of the revised questions.
