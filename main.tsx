import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PortfolioConsole from "./app/portfolio-console";
import "./app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("COOL:TRACE could not find its application root.");
}

createRoot(root).render(
  <StrictMode>
    <PortfolioConsole />
  </StrictMode>,
);
