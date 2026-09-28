/* eslint-disable @typescript-eslint/consistent-type-definitions -- These interfaces augment existing global declarations. */
/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
    interface ProcessEnv {
        /**
         * The built directory structure
         *
         * ```tree
         * ├─┬─┬ dist
         * │ │ └── index.html
         * │ │
         * │ ├─┬ dist-electron
         * │ │ ├── index.js
         * │ │ └── preload.mjs
         * │
         * ```
         */
        APP_ROOT: string
    }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
    platform: NodeJS.Platform,
    ipcRenderer: import("electron").IpcRenderer
}
