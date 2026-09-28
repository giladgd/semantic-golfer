import assert from "node:assert/strict";
import {setImmediate} from "node:timers/promises";
import {test} from "node:test";
import {DecisionRunner} from "../src/state/DecisionRunner.ts";
import {createQuestion, getDecisionCriteria, isValidCriterion, validateDecisionInput,
    type DecisionRequest, type DecisionResult} from "../shared/decision.ts";
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
    assert.equal(isValidCriterion(undefined, "choice"), false);
    for (const criterion of ["", " \n\t ", "x".repeat(1_001)]) {
        assert.equal(isValidCriterion(criterion, "choice"), false);
        assert.match(validateDecisionInput({...examples.choice[0]!.input, criteria: [criterion, "Valid"]})!, /Fill in each criterion/);
    }
    for (const criterion of ["Valid", "  Valid  ", "x".repeat(1_000)]) {
        assert.equal(isValidCriterion(criterion, "noul"), true);
        assert.equal(validateDecisionInput({...examples.noul[0]!.input, criteria: [criterion, "Valid"]}), undefined);
    }
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

test("noul can evaluate with one or both descriptions empty", async () => {
    const calls: DecisionRequest[] = [];
    const runner = new DecisionRunner(async (request) => {
        calls.push(request);
        return {answer: {type: "noul", value: 0.8}, duration: 12};
    });
    for (const criteria of [["", "No"], ["Yes", ""], ["", ""], [" \n\t ", " "]]) {
        const input = {...examples.noul[0]!.input, criteria};
        assert.equal(validateDecisionInput(input), undefined);
        assert.ok(criteria.every((criterion) => isValidCriterion(criterion, "noul")));
        assert.deepEqual(createQuestion(input).criteria, {true: criteria[0], false: criteria[1]});
        await runner.setInput({modelId: "qwen-0.8b", input});
        assert.deepEqual(calls.at(-1)?.input.criteria, criteria);
        for (const type of ["choice", "score"] as const) {
            assert.ok(criteria.some((criterion) => !isValidCriterion(criterion, type)));
            assert.throws(() => createQuestion({...examples[type][0]!.input, criteria}));
        }
    }
    assert.equal(calls.length, 4);
    assert.equal(isValidCriterion(undefined, "noul"), false);
    assert.equal(isValidCriterion("x".repeat(1_001), "noul"), false);
    assert.throws(() => createQuestion({...examples.noul[0]!.input, criteria: ["x".repeat(1_001), ""]}), /1,000 characters/);
});

test("choice and score ignore trailing empty rows, but retain internal errors and option limits", () => {
    for (const type of ["choice", "score"] as const) {
        const base = examples[type][0]!.input;
        for (const trailing of [[""], [" \n\t "], ["", " ", ""]]) {
            const input = {...base, criteria: ["First", "Second", ...trailing]};
            assert.equal(validateDecisionInput(input), undefined);
            const criteria = getDecisionCriteria(input);
            assert.deepEqual(criteria, ["First", "Second"]);
            assert.equal(getDecisionCriteria({...input, criteria}), criteria);
            assert.deepEqual(input.criteria, ["First", "Second", ...trailing]);
            assert.deepEqual(createQuestion(input).criteria, type === "choice" ? {"0": "First", "1": "Second"} : criteria);
        }
        assert.match(validateDecisionInput({...base, criteria: ["First", "", "Third", ""]})!, /Fill in each criterion/);
        assert.match(validateDecisionInput({...base, criteria: ["First", ""]})!, /at least two/);
        assert.match(validateDecisionInput({...base, criteria: ["", ""]})!, /at least two/);
        assert.match(validateDecisionInput({...base, criteria: ["First", "Second", " ".repeat(1_001)]})!, /1,000 characters/);
        const limit = type === "choice" ? 50 : 10;
        const full = {...base, criteria: Array.from({length: limit}, (_, index) => `Option ${index + 1}`)};
        assert.equal(Object.keys(createQuestion(full).criteria!).length, limit);
        assert.throws(() => createQuestion({...full, criteria: [...full.criteria, "Extra"]}));
        assert.throws(() => createQuestion({...full, criteria: [...full.criteria, ""]}));
    }
    const noul = {...examples.noul[0]!.input, criteria: ["", ""]};
    assert.equal(getDecisionCriteria(noul), noul.criteria);
    assert.deepEqual(createQuestion(noul).criteria, {true: "", false: ""});
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
