# Fanamd - Virtual File System Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-orange.svg)](https://svelte.dev/)
[![SurrealDB](https://img.shields.io/badge/SurrealDB-v1.3.2-blue.svg)](https://surrealdb.com/)

Fanamd is an open-source proof-of-concept for managing a virtual file system (VFS) using **SurrealDB**'s advanced graph and relationship features. Built with **Svelte 5** and **TypeScript**, it demonstrates how to implement hierarchical data structures, recursive operations, and real-time optimistic UI updates.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v20+
- **pnpm**: Recommended package manager
- **SurrealDB**: v1.3.2+ running locally or in Docker

### One-Command Setup

```bash
# Clone and install
git clone https://github.com/MasFana/fanamd.git && cd fanamd
pnpm install

# Start SurrealDB with Docker
docker run --rm -p 8000:8000 surrealdb/surrealdb:latest start --user root --pass root

# Launch dev server
pnpm dev
```

The app will be available at `http://localhost:5173`.

## 📁 Documentation

Detailed documentation is available in the `/docs` directory:

- [**Architecture Guide**](./ARCHITECTURE.md) - Deep dive into SurrealDB graph relationships and the recursive delete function.
- [**User Guide**](./USER_GUIDE.md) - How to navigate the UI, manage files, and use the built-in editor.
- [**Developer Guide**](./DEVELOPER_GUIDE.md) - Local setup, testing with Vitest, and contribution workflow.
- [**Contributing**](./CONTRIBUTING.md) - Guidelines for reporting bugs and submitting pull requests.

## ✨ Key Features

- **Graph-Based Hierarchy**: Uses SurrealDB `RELATE` and `contains` edges instead of simple parent ID fields.
- **Recursive Deletion**: Implements a custom SurrealDB function (`fn::recursive_delete`) to clean up nested structures efficiently.
- **Svelte 5 Runes**: Modern state management with `$state`, `$derived`, and `$effect`.
- **Optimistic UI**: Instant visual feedback for file system operations while syncing in the background.
- **Breadcrumb Navigation**: Intuitive path tracking through nested directories.

## 🛠️ Tech Stack

- **Framework**: SvelteKit (Svelte 5)
- **Database**: SurrealDB (Graph & Document)
- **Styling**: Tailwind CSS
- **Validation**: Valibot
- **Testing**: Vitest
- **Deployment**: Optimized for Cloudflare Workers/Pages

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
