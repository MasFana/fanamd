# Contributing to Fanamd

Thank you for your interest in contributing to **Fanamd**! As an open-source proof-of-concept for SurrealDB features, we welcome contributions from developers of all skill levels.

This document provides guidelines for contributing to Fanamd and ensures a smooth and productive experience for everyone involved.

## 🤝 How to Contribute

There are several ways to contribute to Fanamd:

1. **Reporting Bugs**: If you find a bug or issue, please search existing issues before reporting it. If it's a new bug, please provide detailed steps to reproduce it.
2. **Suggesting Features**: We welcome feature suggestions! Please open an issue to discuss your ideas before starting work.
3. **Submitting Pull Requests**: If you've fixed a bug or implemented a new feature, please submit a pull request against the main branch.
4. **Improving Documentation**: If you find any errors or areas for improvement in the documentation, please submit a pull request with your changes.

## 🚀 Code Standards

To maintain code quality and consistency, please follow these standards:

- **Svelte 5 Runes**: Use `$state`, `$derived`, and `$effect` for reactive state management.
- **TypeScript**: Use TypeScript for all new code and ensure proper type safety.
- **Tailwind CSS**: Use Tailwind utility classes for styling.
- **SurrealDB Graph**: Use graph relationships (`RELATE`) and custom functions (`fn::recursive_delete`) for complex data operations.
- **Valibot**: Use Valibot for runtime data validation.
- **Vitest**: Use Vitest for all tests and ensure they pass before submitting a pull request.

### Coding Style

- Use **2 spaces** for indentation.
- Use **single quotes** for strings.
- Use **camelCase** for variables and function names.
- Use **PascalCase** for component names.
- Use **kebab-case** for file and directory names.
- Ensure your code is well-commented and self-documenting.

## 🐞 Reporting Bugs

When reporting a bug, please include:

- **A clear, descriptive title.**
- **Detailed steps to reproduce the bug.**
- **Expected behavior.**
- **Actual behavior.**
- **Environment information** (e.g., browser, OS, node version, SurrealDB version).
- **Screenshots or error logs** (if applicable).

## 📥 Submitting Pull Requests

Before submitting a pull request, please:

1. **Ensure your code follows the code standards.**
2. **Run all tests** and ensure they pass:
   ```bash
   pnpm vitest
   ```
3. **Commit your changes** with descriptive commit messages:
   ```bash
   git commit -m "feat: Add support for file icons"
   ```
4. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a pull request** against the main branch of the Fanamd repository.

Your pull request will be reviewed by the project maintainers, and we may ask for changes or improvements before it's merged.

## 📜 Code of Conduct

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) when contributing to Fanamd. We expect all contributors to be respectful, professional, and inclusive.

## ⚖️ License

By contributing to Fanamd, you agree that your contributions will be licensed under the MIT License.
