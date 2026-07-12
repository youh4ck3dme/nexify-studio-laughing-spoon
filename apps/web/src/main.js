import "./style.css";
import { mountDashboardApp } from "./dashboardApp";
const app = document.querySelector("#app");
if (!app) {
    throw new Error("App root not found");
}
mountDashboardApp({ root: app });
