import { query, command } from '$app/server'; // <-- ADD action
import { FileSystemService } from '$lib';
import { string, object, optional } from 'valibot';

// ==========================================
// READ OPERATIONS (query)
// ==========================================

export const getRootFolders = query(async () => {
	try {
		return await FileSystemService.getRootFolders();
	} catch (error) {
		throw new Error('Error fetching root folders', { cause: error });
	}
});

export const getFolderContents = query(string(), async (folderId: string) => {
	try {
		return await FileSystemService.getFolderContents(folderId);
	} catch (error) {
		throw new Error(`Error fetching folder contents for ${folderId}`, { cause: error });
	}
});

export const getFile = query(string(), async (fileId: string) => {
	try {
		return await FileSystemService.getFile(fileId);
	} catch (error) {
		throw new Error(`Error fetching file ${fileId}`, { cause: error });
	}
});

// ==========================================
// WRITE OPERATIONS (action) <-- Changed to action()
// ==========================================

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
// UPDATE OPERATIONS (action) <-- Changed to action()
// ==========================================

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
// DELETE OPERATIONS (action) <-- Changed to action()
// ==========================================

export const deleteFile = command(string(), async (fileId: string) => {
	try {
		await FileSystemService.deleteFile(fileId);
		return { success: true };
	} catch (error) {
		throw new Error(`Error deleting file ${fileId}`, { cause: error });
	}
});

export const deleteFolderAndContents = command(string(), async (folderId: string) => {
	try {
		await FileSystemService.deleteFolderAndContents(folderId);
		return { success: true };
	} catch (error) {
		throw new Error(`Error deleting folder ${folderId} and its contents`, { cause: error });
	}
});
