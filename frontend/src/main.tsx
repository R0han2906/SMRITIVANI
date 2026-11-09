import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <DeviceProvider><App /></DeviceProvider>
    </AuthProvider>
  </React.StrictMode>,
);
