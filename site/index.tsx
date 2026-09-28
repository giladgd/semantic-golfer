import React from "react";
import {createRoot, hydrateRoot} from "react-dom/client";
import "@fontsource-variable/inter/index.css";
import "../src/index.css";
import {LandingPage} from "./LandingPage.tsx";
import "./LandingPage.css";

// Match the app's macOS chrome without depending on Electron's preload script.
Object.defineProperty(window, "platform", {value: "darwin"});

const root = document.getElementById("root")!;
const page = <React.StrictMode><LandingPage /></React.StrictMode>;
if (root.hasChildNodes())
    hydrateRoot(root, page);
else
    createRoot(root).render(page);
