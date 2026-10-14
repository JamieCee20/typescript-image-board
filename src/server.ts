import app from "./app.js";
import { PostService } from "./services/PostService.js";

// Entry point. Deliberately minimal — all wiring lives in app.ts, so
// the app can be imported (and tested) without opening a port.
const PORT = 3000;

/**
 * Startup sequence: load the data FIRST, then open the port.
 *
 * Awaiting PostService.initialize() before app.listen guarantees the
 * API never serves requests from an empty or unvalidated store. If
 * loading fails, listen is never reached — failing fast on startup
 * beats silently serving an empty API.
 */
async function startServer(): Promise<void> {
    await PostService.initialize();

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Top-level .catch: without it, a rejected startServer() would be an
// unhandled promise rejection. Setting exitCode (rather than calling
// process.exit) lets pending output flush before the process ends.
startServer().catch((err: unknown) => {
    console.error("Failed to start server:", err);
    process.exitCode = 1;
});
