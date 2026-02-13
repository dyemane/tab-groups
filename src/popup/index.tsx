import { render } from "preact";
import { App } from "./App.js";
import "./styles/theme.css";
import "./styles/popup.css";

const root = document.getElementById("app");
if (root) render(<App />, root);
