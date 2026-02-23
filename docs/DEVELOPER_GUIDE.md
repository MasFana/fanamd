# Fanamd Developer Guide

This guide will walk you through setting up Fanamd for development, understanding the project structure, and following our contribution workflow.

## 🛠️ Environment Setup

To get started with development, you'll need to set up your environment:

### Prerequisites

- **Node.js**: v20 or later.
- **pnpm**: Fast, disk space-efficient package manager.
- **SurrealDB**: Running locally or via Docker.
- **Git**: For version control.

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/fanamd.git
   cd fanamd
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start SurrealDB**:

   ```bash
   docker run --rm -p 8000:8000 surrealdb/surrealdb:latest start --user root --pass root
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory:

   ```env
   SURREAL_URL=ws://127.0.0.1:8000/rpc
   SURREAL_USER=root
   SURREAL_PASS=root
   SURREAL_NS=test
   SURREAL_DB=test
   ```

5. **Apply the schema**:
   You can apply the schema from `src/lib/domain/schema.surql` using the SurrealDB CLI or dashboard. Alternatively, running the tests will also apply the schema.

6. **Start the development server**:
   ```bash
   pnpm dev
   ```

## 📂 Project Structure

- `src/lib/domain/`: Domain-specific logic, including types and SurrealQL schemas.
- `src/lib/infrastructure/`: Database connection handling and other infrastructure services.
- `src/lib/services/`: Business logic for file system operations.
- `src/routes/`: SvelteKit routes and frontend components.
- `src/routes/FileSystem.remote.ts`: RPC layer connecting frontend to backend services.
- `docs/`: Project documentation.

## ⚡ Development Workflow

### Frontend Development

- **Svelte 5 Runes**: Use `$state`, `$derived`, and `$effect` for reactive state management.
- **Tailwind CSS**: Use utility classes for styling.
- **Optimistic UI**: Implement UI updates locally first, then sync with the backend.

### Backend Development

- **SurrealDB**: Use graph relationships (`RELATE`) and custom functions (`fn::recursive_delete`) for complex data operations.
- **Valibot**: Use Valibot for runtime data validation.

### Testing

The project uses **Vitest** for testing the `FileSystemService`.

- **Run tests**:

  ```bash
  pnpm vitest
  ```

- **Run tests with coverage**:
  ```bash
  pnpm vitest --coverage
  ```

Tests are located in `src/lib/services/FileSystem.test.ts`.

## 🛠️ Contribution Workflow

1. **Fork the repository** on GitHub.
2. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and ensure they follow the project's coding standards.
4. **Write tests** for any new features or bug fixes.
5. **Run tests** to ensure everything is working as expected:
   ```bash
   pnpm vitest
   ```
6. **Commit your changes** with descriptive commit messages:
   ```bash
   git commit -m "feat: Add support for file icons"
   ```
7. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request** against the main branch of the Fanamd repository.

## ❓ Troubleshooting

- **Database Connection Issues**: Ensure SurrealDB is running and the `.env` file is correctly configured.
- **Type Errors**: Run `pnpm check` to verify TypeScript types and Svelte components.
- **Linting Issues**: Run `pnpm lint` and `pnpm format` to ensure your code follows the project's style guidelines.
