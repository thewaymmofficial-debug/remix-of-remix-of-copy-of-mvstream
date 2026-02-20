import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
const loader = rootEl.querySelector(".il-wrap") as HTMLElement | null;
const root = createRoot(rootEl);

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (loader) {
  loader.classList.add("il-fade-out");
  setTimeout(() => {
    loader.remove();
    renderApp();
  }, 700);
} else {
  renderApp();
}
