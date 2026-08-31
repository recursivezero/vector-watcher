import React from "react";
import ReactDOM from "react-dom/client";

import "@/assets/styles/index.css";

import { NavigationProvider } from "@/contexts/NavigationContext";

import { Root } from "./Root";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NavigationProvider>
      <Root />
    </NavigationProvider>
  </React.StrictMode>
);
