export function assertDecisionSupport(modelPrototype: {createDecisionContext?: unknown}) {
    if (typeof modelPrototype.createDecisionContext !== "function")
        throw new Error("The installed version of node-llama-cpp is too old for this app.");
}
