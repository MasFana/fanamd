/**
 * RPC layer for the File Explorer and Editor UI.
 * Connects the frontend to the backend FileSystemService.
 */
import { query, command } from '$app/server';
import { FileSystemService } from '$lib';
import { string, object, optional } from 'valibot';

// ==========================================
// READ OPERATIONS (query)
// ==========================================

/**
 * Fetches all root folders in the virtual file system.
 */
export const getRootFolders = query(async () => {
	try {
		return await FileSystemService.getRootFolders();
	} catch (error) {
		throw new Error('Error fetching root folders', { cause: error });
	}
});

/**
 * Fetches the contents (subfolders and files) of a specific folder.
 */
export const getFolderContents = query(string(), async (folderId: string) => {
	try {
		return await FileSystemService.getFolderContents(folderId);
	} catch (error) {
		throw new Error(`Error fetching folder contents for ${folderId}`, { cause: error });
	}
});

/**
 * Fetches a single file by its ID.
 */
export const getFile = query(string(), async (fileId: string) => {
	try {
		return await FileSystemService.getFile(fileId);
	} catch (error) {
		throw new Error(`Error fetching file ${fileId}`, { cause: error });
	}
});

// ==========================================
// WRITE OPERATIONS (command)
// ==========================================

/**
 * Creates a new folder.
 */
export const createFolder = command(
	object({
		name: string(),
		parentId: optional(string())
	}),
	async ({ name, parentId }) => {
		try {
			return await FileSystemService.createFolder(name, parentId);
		} catch (error) {
			throw new Error(`Error creating folder '${name}'`, { cause: error });
		}
	}
);

/**
 * Creates a new file within a parent folder.
 */
export const createFile = command(
	object({
		title: string(),
		parentId: string(),
		content: optional(string())
	}),
	async ({ title, parentId, content }) => {
		try {
			return await FileSystemService.createFile(title, parentId, content);
		} catch (error) {
			throw new Error(`Error creating file '${title}'`, { cause: error });
		}
	}
);

// ==========================================
// UPDATE OPERATIONS (command)
// ==========================================

/**
 * Updates the content of a file.
 */
export const updateFileContent = command(
	object({
		fileId: string(),
		content: string()
	}),
	async ({ fileId, content }) => {
		try {
			return await FileSystemService.updateFileContent(fileId, content);
		} catch (error) {
			throw new Error(`Error updating content for file ${fileId}`, { cause: error });
		}
	}
);

/**
 * Renames an item (file or folder).
 */
export const renameItem = command(
	object({
		id: string(),
		newName: string()
	}),
	async ({ id, newName }) => {
		try {
			await FileSystemService.renameItem(id, newName);
			return { success: true };
		} catch (error) {
			throw new Error(`Error renaming item ${id}`, { cause: error });
		}
	}
);

/**
 * Moves an item to a new parent folder.
 */
export const moveItem = command(
	object({
		itemId: string(),
		newParentId: string()
	}),
	async ({ itemId, newParentId }) => {
		try {
			await FileSystemService.moveItem(itemId, newParentId);
			return { success: true };
		} catch (error) {
			throw new Error(`Error moving item ${itemId} to ${newParentId}`, { cause: error });
		}
	}
);

// ==========================================
// DELETE OPERATIONS (command)
// ==========================================

/**
 * Deletes a single file.
 */
export const deleteFile = command(string(), async (fileId: string) => {
	try {
		await FileSystemService.deleteFile(fileId);
		return { success: true };
	} catch (error) {
		throw new Error(`Error deleting file ${fileId}`, { cause: error });
	}
});

/**
 * Deletes a folder and all its recursive contents.
 */
export const deleteFolderAndContents = command(string(), async (folderId: string) => {
	try {
		await FileSystemService.deleteFolderAndContents(folderId);
		return { success: true };
	} catch (error) {
		throw new Error(`Error deleting folder ${folderId} and its contents`, { cause: error });
	}
});
