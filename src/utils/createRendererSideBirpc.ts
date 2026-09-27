import {createBirpc} from "birpc";

export function createRendererSideBirpc<
    const ElectronFunction extends object = Record<string, never>,
    const RendererFunctions extends object = Record<string, never>
>(
    toRendererEventName: string,
    fromRendererEventName: string,
    rendererFunctions: RendererFunctions
) {
    return createBirpc<ElectronFunction, RendererFunctions>(rendererFunctions, {
        timeout: -1, // Model inference can take longer than birpc's default timeout on CPU.
        post: (data) => window.ipcRenderer.send(fromRendererEventName, data),
        on: (onData) => window.ipcRenderer.on(toRendererEventName, (event, data) => {
            onData(data);
        }),
        serialize: (value) => JSON.stringify(value, (_, item) => (item instanceof Error ? String(item) : item)),
        deserialize: (value) => JSON.parse(value)
    });
}
