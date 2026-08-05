import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { applyTheme } from "./theme/applyTheme";
applyTheme();

import "./theme/theme.css"; // замість "./style.css", якщо переносите reset туди
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";
import { BrowserRouter } from "react-router-dom";
import { injectStore } from "./services/api";

injectStore(store);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
