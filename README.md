# TypeScript Image Board

A small REST API for an image board — posts with a title, image URL, and content — built with **Express** and **TypeScript**.

> ⚠️ **This project is purely educational.** It exists as a playground while I learn TypeScript, so expect simplified patterns, evolving code, and the occasional bad decision on purpose. It is not intended for production use.

## Endpoints

| Method | Route               | Description                        |
| ------ | ------------------- | ---------------------------------- |
| GET    | `/health`           | Health check (uptime, timestamp)   |
| GET    | `/api/posts`        | List all posts                     |
| GET    | `/api/posts/:id`    | Get a single post by ID            |
| POST   | `/api/posts`        | Create a new post                  |
| PATCH  | `/api/posts/:id`    | Partially update a post            |
| DELETE | `/api/posts/:id`    | Delete a post (204, no body)       |

## Tech stack

- [TypeScript](https://www.typescriptlang.org/) (strict mode, NodeNext modules)
- [Express](https://expressjs.com/) v5
- [tsx](https://tsx.is/) for the dev server (`tsx watch`)

## Getting started

```bash
npm install
npm run dev
```

The server starts at `http://localhost:3000`.

## Project structure

```
data/
└── posts.json                     # Post data — loaded at startup, written back on changes

src/
├── server.ts                      # Entry point — initialises the store, then starts the server
├── app.ts                         # Express app — mounts middleware & the central router
├── routes/index.ts                # Central router — aggregates resource routers under /api
├── routes/PostRoutes.ts           # Post router — maps routes to the controller
├── types/Post.ts                  # Post interface & input types
├── controllers/PostController.ts  # Request handling & validation responses
├── validators/PostValidator.ts    # Runtime type guards for request bodies & stored data
├── repositories/                  # Storage layer (Repository pattern)
│   ├── PostRepository.ts          #   interface — the storage contract
│   └── FilePostRepository.ts      #   JSON-file implementation (atomic writes, write queue)
└── services/PostService.ts        # Business logic — storage delegated to PostRepository
```

## Notes

- All resource routes are grouped under **`/api`** by a central router (`src/routes/index.ts`), keeping `app.ts` minimal and leaving room for future API versioning (e.g. `/api/v1`).
- **Data** lives in `data/posts.json`: loaded once at startup (validated — shape via a type guard, plus a duplicate-ID check; a bad file aborts startup) and **written back after every change**. Writes are atomic (`.tmp` file + rename) and serialized through a write queue, so changes survive restarts and concurrent requests can't corrupt the file. Reads are served from memory.
- **Storage sits behind the `PostRepository` interface** (Repository pattern): `PostService` depends only on the contract, and `FilePostRepository` is currently its one implementation. Adding a database means writing a new implementation and changing one construction line — no service, controller, or route changes.
- Request bodies are validated at runtime with a hand-written type guard, since Express can't know the shape of `req.body` on its own.
- `PATCH /api/posts/:id` accepts a **partial** body (`Partial<CreatePostInput>`) — only the fields you supply are updated; supplying none or empty values is rejected with `400`.
- **Async handlers:** `PostService.getAllPosts()` returns `Promise<Post[]>` and its controller `await`s it. The in-memory store is synchronous today, but this is exactly the signature a database call will need — so no caller changes when real I/O arrives. Express 5 also forwards rejected promises from async handlers straight to the error middleware, so `throw`/`reject` needs no `try/catch` (unlike Express 4).
