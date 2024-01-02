import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { Buffer } from "buffer";
import { Web3Provider } from "./providers/web3.tsx";
window.Buffer = Buffer; // init Buffer for bip39 package

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>
);
