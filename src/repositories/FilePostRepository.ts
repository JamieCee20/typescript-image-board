import { readFile, writeFile, rename } from "node:fs/promises";
import type { Post } from "../types/Post.js";
import type { PostRepository } from "./PostRepository.js";
import { isPost } from "../validators/PostValidator.js";

/**
 * PostRepository implementation backed by a single JSON file.
 *
 * - load(): treats file content as untrusted input — validated with
 *   the isPost type guard and checked for duplicate IDs before it is
 *   ever returned.
 * - save(): atomic write (temporary file + rename) serialized through
 *   an internal write queue, so concurrent requests can never
 *   interleave half-written files and a failed save never poisons the
 *   queue for later ones.
 */
export class FilePostRepository implements PostRepository {
    /** All pending/in-flight saves chain onto this — one write at a time. */
    private writeQueue: Promise<void> = Promise.resolve();

    /**
     * @param filePath location of the JSON file, relative to the
     *   process's working directory (run npm commands from the project
     *   root; a production version would resolve it from import.meta.url).
     *
     * `private readonly filePath` is a *parameter property*: TypeScript
     * declares the field AND assigns it from this argument in one step.
     */
    constructor(private readonly filePath: string) { }

    /**
     * Reads and validates the data file.
     * @throws when the file is missing, is not an array of valid
     *   posts, or contains duplicate IDs.
     */
    async load(): Promise<Post[]> {
        // File content is untrusted: JSON.parse's result is kept as
        // `unknown` until it passes the type guard below.
        const contents = await readFile(this.filePath, "utf8");
        const data: unknown = JSON.parse(contents);

        // data.every(isPost): narrows every entry to Post.
        if (!Array.isArray(data) || !data.every(isPost)) {
            throw new Error("Post data must be an array of valid posts.");
        }

        // A Set drops duplicates — if it's smaller than the array,
        // some IDs were reused.
        const ids = new Set(data.map(post => post.id));

        if (ids.size !== data.length) {
            throw new Error("Post data contains duplicate IDs.");
        }

        return data;
    }

    /**
     * Persists the given posts atomically.
     * @throws when the file cannot be written; the caller decides how
     *   to surface the failure (PostService lets it become a 500).
     */
    save(posts: readonly Post[]): Promise<void> {
        const contents = JSON.stringify(posts, null, 2);
        const temporaryPath = `${this.filePath}.tmp`;

        // Chain this save after all previous ones. `.catch(() => {})`
        // keeps the QUEUE healthy if this save fails — the error still
        // reaches this save's own caller through `save`.
        const save = this.writeQueue.then(async () => {
            // Write-then-rename: readers only ever see the old or the
            // new file, never a partial one.
            await writeFile(temporaryPath, contents, "utf8");
            await rename(temporaryPath, this.filePath);
        });

        this.writeQueue = save.catch(() => { });

        return save;
    }
}
