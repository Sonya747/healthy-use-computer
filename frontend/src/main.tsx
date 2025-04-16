import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HashRouter } from "react-router";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <HashRouter>
    <App/></HashRouter>
);
