import assert from "node:assert/strict";
import {setImmediate} from "node:timers/promises";
import {test} from "node:test";
import {DecisionRunner} from "../src/state/DecisionRunner.ts";
import {createQuestion, validateDecisionInput, type DecisionRequest, type DecisionResult} from "../shared/decision.ts";
import {examples} from "../src/state/examples.ts";

test("one evaluation at a time; only the latest edit runs next, including after errors", async () => {
    const calls: DecisionRequest[] = [];
    const pending: Array<ReturnType<typeof Promise.withResolvers<DecisionResult>>> = [];
    const runner = new DecisionRunner((request) => {
        calls.push(request);
        const deferred = Promise.withResolvers<DecisionResult>();
        pending.push(deferred);
        return deferred.promise;
    });
    const request = (document: string): DecisionRequest => ({modelId: "qwen-0.8b", input: {...examples.noul[0]!.input, document}});
    const result: DecisionResult = {answer: {type: "noul", value: 0.8}, duration: 12};

    const first = runner.setInput(request("A"));
    await setImmediate();
    const skipped = runner.setInput(request("B"));
    const latest = runner.setInput(request("C"));
    assert.equal(calls.length, 1);
    pending[0]!.resolve(result);
    await setImmediate();
    assert.deepEqual(calls.map(({input}) => input.document), ["A", "C"]);
    assert.equal(runner.state.state.running, true);
    pending[1]!.resolve(result);
    await Promise.all([first, skipped, latest]);
    assert.equal(runner.state.state.running, false);
    assert.equal(runner.state.state.result?.request.input.document, "C");
    await runner.setInput(request("C"));
    assert.equal(calls.length, 2);

    const failed = runner.setInput(request("D"));
    await setImmediate();
    const recovered = runner.setInput(request("E"));
    pending[2]!.reject(new Error("Inference failed"));
    await setImmediate();
    assert.equal(calls[3]?.input.document, "E");
    pending[3]!.resolve(result);
    await Promise.all([failed, recovered]);
    assert.equal(runner.state.state.error, undefined);

    const reverting = runner.setInput(request("F"));
    await setImmediate();
    void runner.setInput(request("G"));
    void runner.setInput(request("F"));
    pending[4]!.resolve(result);
    await reverting;
    assert.equal(calls.length, 5);

    const obsolete = runner.setInput(request("H"));
    await setImmediate();
    void runner.setInput(undefined);
    pending[5]!.resolve(result);
    await obsolete;
    assert.equal(runner.state.state.result, undefined);
    assert.equal(runner.state.state.running, false);
});

test("example questions match the API and reject incomplete or oversized input", () => {
    for (const variants of Object.values(examples)) {
        for (const {input} of variants) {
            assert.equal(validateDecisionInput(input), undefined);
            assert.equal(createQuestion(input).type, input.type);
        }
    }
    assert.deepEqual(createQuestion(examples.noul[0]!.input).criteria, {
        true: examples.noul[0]!.input.criteria[0], false: examples.noul[0]!.input.criteria[1]
    });
    assert.deepEqual(Object.keys(createQuestion(examples.choice[0]!.input).criteria!), ["0", "1", "2"]);
    assert.throws(() => createQuestion({...examples.noul[0]!.input, criteria: ["Yes"]}));
    assert.throws(() => createQuestion({...examples.choice[0]!.input, criteria: ["", "B"]}));
    assert.throws(() => createQuestion({...examples.score[0]!.input, document: "x".repeat(32_001)}));
    assert.doesNotThrow(() => createQuestion({...examples.score[0]!.input, criteria: Array(10).fill("Level")}));
    assert.throws(() => createQuestion({...examples.score[0]!.input, criteria: Array(11).fill("Level")}));
});

test("incomplete edits retain the last result and skip pending inference until valid again", async () => {
    const calls: DecisionRequest[] = [];
    let pending = Promise.withResolvers<DecisionResult>();
    const runner = new DecisionRunner((request) => {
        calls.push(request);
        return pending.promise;
    });
    const request: DecisionRequest = {modelId: "qwen-0.8b", input: examples.noul[0]!.input};
    const incomplete = {...request, input: {...request.input, instruction: ""}};
    const result: DecisionResult = {answer: {type: "noul", value: 0.7}, duration: 10};
    const first = runner.setInput(request);
    await setImmediate();
    void runner.setInput(incomplete);
    pending.resolve(result);
    await first;
    assert.equal(calls.length, 1);
    assert.equal(runner.state.state.result?.duration, 10);
    assert.equal(runner.state.state.running, false);

    await runner.setInput(incomplete);
    assert.equal(calls.length, 1);
    assert.equal(runner.state.state.result?.duration, 10);
    await runner.setInput(request);
    assert.equal(calls.length, 1); // Restoring the evaluated input does not need another run.

    pending = Promise.withResolvers<DecisionResult>();
    const resumed = runner.setInput({...request, input: {...request.input, instruction: "Does the message mention a team?"}});
    await setImmediate();
    assert.equal(calls.length, 2);
    pending.resolve(result);
    await resumed;
    assert.equal(runner.state.state.result?.request.input.instruction, "Does the message mention a team?");
});

test("a failed evaluation can be retried once without editing the input", async () => {
    let attempts = 0;
    const pending = Promise.withResolvers<DecisionResult>();
    const runner = new DecisionRunner(async () => {
        if (++attempts === 1)
            throw new Error("Temporary failure");
        return await pending.promise;
    });
    const request: DecisionRequest = {modelId: "qwen-0.8b", input: examples.noul[0]!.input};
    await runner.setInput(request);
    assert.match(runner.state.state.error!, /Temporary failure/);
    await runner.setInput(request);
    assert.equal(attempts, 1); // State synchronization must not retry errors in a loop.

    const retry = runner.retry();
    await setImmediate();
    await runner.retry();
    assert.equal(attempts, 2);
    assert.equal(runner.state.state.error, undefined);
    pending.resolve({answer: {type: "noul", value: 0.9}, duration: 8});
    await retry;
    assert.equal(runner.state.state.result?.duration, 8);
    await runner.retry();
    assert.equal(attempts, 2);
});
