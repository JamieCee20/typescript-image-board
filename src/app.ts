import express from "express";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/ErrorHandler.js";

const app = express();

// Parses JSON request bodies into req.body. Note: its type is `any`,
// which is exactly why the runtime validators in validators/ exist.
app.use(express.json());

// All resource routes live under /api via the central router.
app.use("/api", router);

// Error handler must be registered LAST — Express runs middleware in
// registration order, so it only sees errors from what's above it.
// Thrown HttpErrors bubble up from handlers to here.
app.use(errorHandler);

export default app;
