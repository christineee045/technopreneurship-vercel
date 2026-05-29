import React from "react";
import ReactDOM from "react-dom/client";
import App from "../app/App";

import "../styles/index.css";

const adminRoot = document.getElementById("admin-root");
if (adminRoot) {
  ReactDOM.createRoot(adminRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
