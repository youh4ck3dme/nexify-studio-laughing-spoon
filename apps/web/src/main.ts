import "./style.css";
import { mountApp } from "./app/mountApp";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

mountApp({ root: app });
