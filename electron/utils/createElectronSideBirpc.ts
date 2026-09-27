import {BrowserWindow, ipcMain} from "electron";
import {createBirpc} from "birpc";

export function createElectronSideBirpc<
    const RendererFunction extends object = Record<string, never>,
    const ElectronFunctions extends object = Record<string, never>
>(
    toRendererEventName: string,
    fromRendererEventName: string,
    window: BrowserWindow,
    electronFunctions: ElectronFunctions
) {
    let listener: ((event: Electron.IpcMainEvent, data: string) => void) | undefined;
    return createBirpc<RendererFunction, ElectronFunctions>(electronFunctions, {
        post: (data) => window.webContents.send(toRendererEventName, data),
        on: (onData) => {
            listener = (event, data) => {
                if (event.sender === window.webContents)
                    onData(data);
            };
            ipcMain.on(fromRendererEventName, listener);
        },
        off: () => {
            if (listener != null)
                ipcMain.off(fromRendererEventName, listener);
        },
        serialize: (value) => JSON.stringify(value, (_, item) => (item instanceof Error ? String(item) : item)),
        deserialize: (value) => JSON.parse(value)
    });
}
