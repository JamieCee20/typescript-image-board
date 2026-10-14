/**
 * Central router: the one place where resource routers are mounted.
 *
 * app.ts attaches this whole tree at "/api", so adding a future
 * resource (e.g. users) means creating its router and adding one
 * `router.use(...)` line here — app.ts itself never changes.
 */
import { Router } from "express";
import postRouter from "./PostRoutes.js";

const router = Router();

router.use("/posts", postRouter);

export default router;
