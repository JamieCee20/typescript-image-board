/**
 * Custom error class that carries an HTTP status code alongside the
 * usual Error message.
 *
 * Why it exists: controllers can now signal failure by *throwing*,
 * e.g. `throw new HttpError(404, "Post not found.")`, instead of
 * hand-writing res.status(...).json(...) in every branch. The central
 * error handler (src/middleware/ErrorHandler.ts) recognises this
 * class via `instanceof` and turns it into the response.
 */
export class HttpError extends Error {
    /** HTTP status code to send to the client (e.g. 400, 404). */
    public readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        // Calls Error's constructor so `message` and stack traces behave normally.
        super(message);

        // Overrides the default "Error" name in logs and stack traces.
        this.name = "HttpError";
        this.statusCode = statusCode;
    }
}
