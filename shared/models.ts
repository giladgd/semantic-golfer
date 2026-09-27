// Recommended variants from node-llama-cpp's structured-decisions guide.
export const models = [
    {id: "gemma-q8", name: "Gemma 4", parameters: "5B E2B", quant: "Q8_0", size: "5.0 GB",
        uri: "hf:giladgd/gemma-4-E2B-it-GGUF:Q8_0"},
    {id: "gemma-q6", name: "Gemma 4", parameters: "5B E2B", quant: "Q6_K", size: "3.9 GB",
        uri: "hf:giladgd/gemma-4-E2B-it-GGUF:Q6_K"},
    {id: "qwen-2b", name: "Qwen 3.5", parameters: "2B", quant: "Q4_K_M", size: "1.3 GB",
        uri: "hf:unsloth/Qwen3.5-2B-GGUF:Q4_K_M"},
    {id: "qwen-0.8b", name: "Qwen 3.5", parameters: "0.8B", quant: "Q8_0", size: "0.8 GB",
        uri: "hf:unsloth/Qwen3.5-0.8B-GGUF:Q8_0"}
] as const;

export type DownloadableModelId = typeof models[number]["id"];
export type ModelId = DownloadableModelId | `local:${string}`;

export function getModel(id: string) {
    const model = models.find((model) => model.id === id);
    if (model == null)
        throw new Error("Unknown model");
    return model;
}
