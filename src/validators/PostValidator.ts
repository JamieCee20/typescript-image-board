import type { CreatePostInput, UpdatePostInput } from '../types/Post.js'

/**
 * Type guard for POST /api/posts bodies.
 *
 * The `value is CreatePostInput` return type is a *type predicate*:
 * when this function returns true, TypeScript narrows `value` (typed
 * `unknown`) to CreatePostInput at the call site. One function does
 * the runtime check AND the compile-time narrowing.
 */
export function isCreatePostInput(
    value: unknown
): value is CreatePostInput {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        "title" in value &&
        typeof value.title === "string" &&
        "image" in value &&
        typeof value.image === "string" &&
        "content" in value &&
        typeof value.content === "string"
    );
}

/**
 * Type guard for PATCH /api/posts bodies.
 *
 * Like isCreatePostInput, but every field is optional: each check
 * only applies *if* the field is present (`"title" in value ? ... : true`).
 */
export function isUpdatePostInput(
    value: unknown
): value is UpdatePostInput {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        ("title" in value ? typeof value.title === "string" : true) &&
        ("image" in value ? typeof value.image === "string" : true) &&
        ("content" in value ? typeof value.content === "string" : true)
    );
}