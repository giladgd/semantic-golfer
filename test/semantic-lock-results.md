> Historical report for the original three-round game. The expanded catalog uses revised questions; see [levels-results.md](levels-results.md) for current validation.

# Semantic Lock evaluation

Tested on September 24, 2026, using the local CPU build of node-llama-cpp on Linux ARM64. Each model used a warmed decision context with a maximum of 4,096 tokens and three parallel questions, matching the app.

The final wording was checked against 43 samples across all three levels. Twelve typing sequences were evaluated character by character, including greetings, unrelated text, single-condition matches, and winning sentences. This produced 306 evaluations per model: 918 total. Changed levels were rerun after tuning.

## Results

| Model | Complete samples with all locks in their expected states | Unexpected individual lock scores, including prefixes | Premature round unlocks |
| --- | ---: | ---: | ---: |
| Qwen 3.5 0.8B Q8_0 | 42 / 43 | 1 | 0 |
| Qwen 3.5 2B Q4_K_M | 39 / 43 | 4 | 0 |
| Gemma 4 E2B Q8_0 | 42 / 43 | 2 | 0 |

Expected states use the game's 70% threshold. Every model completed at least one winning sample in every level. Gemma Q6_K was not tested.

Before the fix, Qwen 0.8B scored `h` at **76.9%, 73.1%, 74.2%**, incorrectly opening the first round. With the final questions and quoted text boundary, its scores were **52.3%, 50.9%, 58.1%**. Qwen 2B scored **10.1%, 15.5%, 8.4%**; Gemma scored below **0.01%** for each condition. The 70% target and displayed probabilities were not adjusted.

## Remaining model errors

- `Want pizza? I'm so excited!`: the question condition scored 68.4% on Qwen 0.8B, 8.8% on Qwen 2B, and approximately 0% on Gemma.
- Qwen 2B also under-scored the question in `Wow, pizza! Want to make some together?` (54.9%) and `I love cake! Shall we bake one?` (67.1%).
- Qwen 2B scored bad weather at 52.8% for `I'm sorry about the awful weather. Let's reschedule our picnic for next week instead.`
- Gemma anticipated food at `Wow, pizz` (99.9%), before the word was complete. The other two conditions remained below the target, so the round stayed locked.

The real-model check deliberately reports these mismatches with a nonzero exit status. These results establish the tested behavior; they do not guarantee classification of arbitrary text. No keyword rules, minimum-length workaround, or probability clamping were added.

## Electron verification

Real keyboard checks passed with Qwen 0.8B and Gemma Q8: typing `hello` kept every round locked, all three rounds were playable, and replacing a winning sentence immediately disabled advancement. Rapidly typing a sentence produced two or three actual evaluations, with the final request matching the current textarea. Both model pickers list models largest first. Signal Mixing retains its original document format and its previously tested first-round solution still wins.

## Repeat

```sh
npm run --silent test:semantic-lock -- /path/to/model.gguf > results.jsonl
# Recheck one level:
npm run --silent test:semantic-lock -- /path/to/model.gguf 3 > round-3.jsonl
```

Each JSONL result includes the complete sample, current prefix, expected conditions, actual probabilities, timing, win state, and mismatched conditions. Expectations are checked before evidence appears and on complete samples; scores are allowed to fluctuate while the rest of a sentence is being typed.
