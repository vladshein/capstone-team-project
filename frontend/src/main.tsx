import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { applyTheme } from "./theme/applyTheme";
applyTheme();

import "./theme/theme.css"; // замість "./style.css", якщо переносите reset туди
import { createRoot } from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
