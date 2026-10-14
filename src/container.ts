import { FilePostRepository } from "./repositories/FilePostRepository.js";
import { PostService } from "./services/PostService.js";

/**
 * The composition root: the ONE place where concrete classes are
 * constructed and wired together.
 *
 * Everything downstream depends on abstractions — the controller
 * imports this service, the service depends on the PostRepository
 * interface — so only this file knows that a FilePostRepository on
 * data/posts.json backs the API today. Swapping storage backends (or
 * injecting an in-memory fake in tests) is a change here and nowhere
 * else.
 *
 * `postService` is a module singleton: every importer shares this one
 * instance (the controller calls its methods, the server initialises
 * it before listening).
 */
const postRepository = new FilePostRepository("data/posts.json");

export const postService = new PostService(postRepository);
