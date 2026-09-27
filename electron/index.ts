import {fileURLToPath} from "node:url";
import path from "node:path";
import {app, shell, BrowserWindow, nativeTheme} from "electron";
import {discoverModels} from "./llm/models.ts";
import {registerLlmRpc} from "./rpc/llmRpc.ts";
import {loadScores} from "./state/scores.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Preserve existing models and settings when the display name changes.
if (app.getPath("userData") === path.join(app.getPath("appData"), app.getName()))
    app.setPath("userData", path.join(app.getPath("appData"), "semantic-golfer"));
app.setName("Semantic Golfer");
if (process.platform === "win32")
    app.setAppUserModelId("ai.withcat.semantic-golfer");

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── index.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, "public")
    : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
    const overlay = () => ({
        color: nativeTheme.shouldUseDarkColors ? "#1a211c" : "#edf1eb",
        symbolColor: nativeTheme.shouldUseDarkColors ? "#e2eee5" : "#263c32",
        height: 60
    });
    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            scrollBounce: true
        },
        width: 1380,
        height: 900,
        minWidth: 760,
        minHeight: 600,
        title: "Semantic Golfer",
        icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
        titleBarStyle: "hidden",
        ...(process.platform === "darwin" ? {trafficLightPosition: {x: 20, y: 22}} : {titleBarOverlay: overlay()}),
        autoHideMenuBar: true,
        backgroundColor: overlay().color
    });
    const window = win;
    const updateTheme = () => {
        window.setBackgroundColor(overlay().color);
        if (process.platform !== "darwin")
            window.setTitleBarOverlay(overlay());
    };
    nativeTheme.on("updated", updateTheme);
    window.once("closed", () => nativeTheme.off("updated", updateTheme));
    registerLlmRpc(win);

    // open external links in the default browser
    win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith("file://"))
            return {action: "allow"};

        void shell.openExternal(url);
        return {action: "deny"};
    });

    if (VITE_DEV_SERVER_URL)
        void win.loadURL(VITE_DEV_SERVER_URL);
    else
        void win.loadFile(path.join(RENDERER_DIST, "index.html"));
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
        win = null;
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(async () => {
    // Packaged macOS apps use their native appearance-aware icon catalog.
    if (!app.isPackaged)
        app.dock?.setIcon(path.join(process.env.VITE_PUBLIC, "icon.png"));
    await Promise.all([discoverModels(), loadScores()]);
    createWindow();
});
