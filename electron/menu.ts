import {app, Menu} from "electron";
import {checkForUpdates} from "./updates/updates.ts";

export function configureMenu(showWindow: () => void) {
    if (process.platform !== "darwin") {
        Menu.setApplicationMenu(null);
        return;
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {label: app.name, submenu: [
            {role: "about"},
            {label: "Check for Updates…", click: () => {
                showWindow();
                void checkForUpdates(true);
            }},
            {type: "separator"}, {role: "services"}, {type: "separator"},
            {role: "hide"}, {role: "hideOthers"}, {role: "unhide"}, {type: "separator"}, {role: "quit"}
        ]},
        {role: "editMenu"}, {role: "viewMenu"}, {role: "windowMenu"}
    ]));
}
