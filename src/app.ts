import express from "express";
import type { Request, Response } from "express";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/ErrorHandler.js";

/**
 * Shape of the /health response.
 * `status` is typed as the literal "ok" rather than `string` — it can
 * only ever be that one exact value, and TypeScript now enforces it.
 */
type HealthResponse = {
    status: "ok";
    uptimeSeconds: number;
    timestamp: string;
};

const app = express();

// Parses JSON request bodies into req.body. Note: its type is `any`,
// which is exactly why the runtime validators in validators/ exist.
app.use(express.json());

/**
 * Health check for uptime monitors / load balancers.
 *
 * Deliberately registered on the app itself, NOT inside /api: it's an
 * infrastructure endpoint, not an API resource, and should respond
 * even when every /api route is broken.
 */
app.get("/health", (req: Request, res: Response<HealthResponse>) => {
    res.json({
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// All resource routes live under /api via the central router.
app.use("/api", router);

// Error handler must be registered LAST — Express runs middleware in
// registration order, so it only sees errors from what's above it.
// Thrown HttpErrors bubble up from handlers to here.
app.use(errorHandler);

export default app;
