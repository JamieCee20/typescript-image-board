import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/HttpError.js";

/** Shape of every JSON error body this API returns. */
type ErrorResponse = {
    error: string;
};

/**
 * Central error-handling middleware.
 *
 * Express recognises this as an *error handler* by its four parameters
 * (err, req, res, next) — the count matters, not the types. Any error
 * thrown (or passed to next()) inside a route handler or earlier
 * middleware lands here, so controllers never format error responses
 * themselves. Thrown errors must be registered AFTER the routes it
 * should cover (see app.ts).
 */
export function errorHandler(err: unknown, req: Request, res: Response<ErrorResponse>, next: NextFunction): void {
    // If the response has already started streaming we can no longer
    // change its status/body — delegate to Express's default handling.
    if (res.headersSent) {
        next(err);
        return;
    }

    // `instanceof` narrows `err` from `unknown` to HttpError, giving
    // type-safe access to .statusCode and .message.
    if (err instanceof HttpError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    // body-parser reports malformed JSON as a plain object marked
    // "entity.parse.failed" — translate that into a friendly 400.
    if (
        typeof err === "object" &&
        err !== null &&
        "type" in err &&
        err.type === "entity.parse.failed" &&
        "status" in err &&
        err.status === 400
    ) {
        res.status(400).json({
            error: "Request body contains invalid JSON."
        });
        return;
    }

    // Anything unanticipated is logged server-side and hidden behind a
    // generic 500 — never leak internal details to the client.
    console.error(err);

    res.status(500).json({ error: "Internal Server Error" });
}
