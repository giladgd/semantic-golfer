import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter/index.css";
import {App} from "./App/App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
