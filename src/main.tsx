import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Polyfill for libraries (e.g. @react-pdf/renderer) that expect Node's Buffer in the browser.
import { Buffer } from "buffer";

if (!(globalThis as unknown as { Buffer?: typeof Buffer }).Buffer) {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
