# Fanamd Architecture Guide

Fanamd is a proof-of-concept demonstrating how to build a virtual file system (VFS) with **SurrealDB** and **SvelteKit**. This document explains the technical foundations, data model, and core implementation details.

## 🏗️ System Overview

The application follows a clean layered architecture:

- **Frontend**: SvelteKit (Svelte 5) with Tailwind CSS.
- **RPC Layer**: `FileSystem.remote.ts` handles server-side communication.
- **Service Layer**: `FileSystemService.ts` manages business logic and database interactions.
- **Database**: SurrealDB, utilizing its document, graph, and functional capabilities.

## 📊 Data Model

Fanamd uses SurrealDB's graph capabilities to model the file system. Unlike traditional relational models that use a `parent_id` field, Fanamd uses **Edges**.

### Tables and Relationships

- `folder`: A container for other folders or files.
- `file`: Stores actual content and metadata (title, content, created_at, updated_at).
- `contains`: A graph edge defining the relationship `folder -> contains -> (folder | file)`.

### SurrealQL Schema (Summary)

```surql
-- Define tables
DEFINE TABLE folder SCHEMAFULL;
DEFINE TABLE file SCHEMAFULL;
DEFINE TABLE contains SCHEMAFULL TYPE RELATION IN folder OUT folder | file;

-- Define fields
DEFINE FIELD name ON TABLE folder TYPE string;
DEFINE FIELD title ON TABLE file TYPE string;
DEFINE FIELD content ON TABLE file TYPE string DEFAULT "";
```

### Advantages of the Graph Model

1. **Native Traversals**: Fetching nested children is a first-class operation.
2. **Recursive Logic**: Deletion and tree traversals can be handled efficiently with built-in graph traversal syntax (`->contains->`).
3. **Flexibility**: Easily extendable to support multi-parent links (symbolic links) in the future.

## 🔄 Recursive Deletion Logic

One of the highlights of this POC is the custom SurrealDB function `fn::recursive_delete`. When a folder is deleted, all its descendants (subfolders and files) must be cleaned up to prevent orphaned records.

### The `fn::recursive_delete` Function

```surql
DEFINE FUNCTION fn::recursive_delete($node: record) {
    -- 1. Find all children connected via 'contains'
    LET $children = (SELECT VALUE out FROM contains WHERE in = $node);

    -- 2. Recurse into children first (bottom-up deletion)
    FOR $child IN $children {
        fn::recursive_delete($child);
    };

    -- 3. Delete the actual record
    DELETE $node;
};
```

This function ensures that the entire sub-tree is purged in a single atomic transaction.

## ⚡ Frontend State Management

Fanamd uses **Svelte 5 Runes** for state management:

- `$state`: Manages the current folder contents and open file state.
- `$derived`: Calculates breadcrumbs and counts from the current folder state.
- `$effect`: Handles background synchronization with the backend when local changes occur.

### Optimistic UI Updates

When a user creates a new folder or file, the UI is updated immediately with a local-first approach. The background RPC call then syncs the change to SurrealDB. This provides a zero-latency experience for the user.

## 🌐 Server Communication (RPC)

Communication between the browser and the server is handled via SvelteKit server actions and a custom RPC pattern in `FileSystem.remote.ts`. This allows the frontend to call functions like `createFolder` or `renameFile` as if they were local asynchronous functions.

## 🛠️ Testing Strategy

The project uses **Vitest** for testing the `FileSystemService`. Tests are designed to be environment-independent by:

1. **Setup**: Applying the schema from `schema.surql` before tests run.
2. **Execution**: Running operations against a real (but temporary) SurrealDB instance.
3. **Teardown**: Cleaning up the database after tests complete.

Refer to `src/lib/services/FileSystem.test.ts` for implementation details.
