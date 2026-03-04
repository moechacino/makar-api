import { Hono } from "hono";
import { reportController } from "../controllers/report.controller";

const reportRoutes = new Hono();

reportRoutes.get("/kitchen-recap", reportController.kitchenRecap);

export default reportRoutes;
