# Fanamd User Guide

Welcome to **Fanamd**, a web-based virtual file system manager! This guide will help you understand how to navigate, manage, and edit your virtual folders and files.

## 🚀 Getting Started

Once you have Fanamd running (see the [Quick Start in README.md](../README.md)), open your browser to `http://localhost:5173`.

### The Interface

The main interface is divided into two primary sections:

1. **Breadcrumb Navigation**: Shows your current location in the folder hierarchy.
2. **File Explorer**: Lists all subfolders and files in the current folder.
3. **Action Bar**: Buttons to create new folders, files, or navigate back.
4. **File Editor**: Appears when you open a file for editing.

## 📁 Managing Folders

Folders are the building blocks of your virtual file system.

- **Create a Folder**: Click the "New Folder" button at the top of the explorer. Enter a name (e.g., `Documents`).
- **Open a Folder**: Click on any folder's name or icon to navigate into it. The breadcrumb will update accordingly.
- **Rename a Folder**: Hover over a folder and click the edit icon (if available) or right-click to choose rename.
- **Delete a Folder**: Deleting a folder will also **recursively delete** everything inside it (subfolders and files). **This action cannot be undone!**

## 📄 Managing Files

Files store text-based content within your folders.

- **Create a File**: Click the "New File" button. Enter a filename with an extension (e.g., `notes.md`).
- **Edit a File**: Click on a file to open it in the built-in editor.
- **Save Changes**: Changes are typically saved automatically or via a "Save" button in the editor.
- **Rename/Delete Files**: Similar to folders, files can be renamed or removed using the icons or context menu.

## 🧩 Breadcrumb Navigation

The breadcrumb bar at the top allows you to quickly jump back to parent folders.

- **Root**: Click "Root" to return to the very top of your file system.
- **Parent Folders**: Click any folder name in the breadcrumb to jump directly to that level.

## 🛠️ Configuration & Customization

Fanamd is a proof-of-concept, so most configuration is handled via environment variables in your `.env` file:

- `SURREAL_URL`: The WebSocket URL for your SurrealDB instance.
- `SURREAL_NS`: The Namespace to use (defaults to `test`).
- `SURREAL_DB`: The Database to use (defaults to `test`).

## ❓ Troubleshooting

### "Cannot connect to Database"

If you see a connection error:

1. Ensure SurrealDB is running (`docker ps` if using Docker).
2. Check your `.env` file for correct URL and credentials.
3. Verify that the SurrealDB port (default `8000`) is not blocked by a firewall.

### "Changes are not saving"

- Fanamd uses optimistic UI. If a change is reverted after a few seconds, it means the server-side sync failed.
- Check the browser's console (F12) and the server logs for specific error messages.

### "How do I reset the data?"

To reset your file system to its initial state:

1. Stop the application and SurrealDB.
2. Clear the SurrealDB data or start a fresh instance.
3. Re-run the schema and seed script from `src/lib/domain/schema.surql`.
