import { Router } from "express";
import postRouter from "./PostRoutes.js";

const router = Router();

router.use("/posts", postRouter);

export default router;