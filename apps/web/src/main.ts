import "./style.css";
import { mountDashboardApp } from "./dashboardApp";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

mountDashboardApp({ root: app });
