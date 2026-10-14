import { HttpError } from "../errors/HttpError.js";

/**
 * Parses a route parameter into a positive integer, throwing an
 * HttpError (400) if it isn't one.
 *
 * Route params are always *strings* ("/posts/3" yields "3"), and this
 * check used to be duplicated in every controller that takes an :id —
 * now it lives here once. The thrown error is caught by the central
 * error handler and becomes a 400 response.
 */
export function parsePositiveId(id: string): number {
    const parsedId = Number(id);
    // isSafeInteger rejects NaN, floats, and values beyond 2^53 - 1.
    if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
        throw new HttpError(400, "Invalid positive ID");
    }
    return parsedId;
}
