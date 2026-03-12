import React from "react";
import ReactDOM from "react-dom/client";
import Swatchboard from "./Swatchboard";
import { SettingsProvider } from "../core/SettingsContext";
import "../core/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsProvider>
      <Swatchboard />
    </SettingsProvider>
  </React.StrictMode>,
);
