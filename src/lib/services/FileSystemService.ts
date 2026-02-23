import { db, connectDB } from '../infrastructure/db';
import type { Folder, File, FolderContents } from '../domain/FileSystemTypes';
import { RecordId, StringRecordId, surql } from 'surrealdb';

/**
 * Custom Error class for File System Operations
 */
export class FileSystemError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'FileSystemError';
	}
}

/**
 * Clean Architecture Service for File System Operations
 */
export class FileSystemService {
	/**
	 * Helper to safely format IDs returned by SurrealDB to string
	 */
	private static sanitizeId<T extends { id: string | RecordId }>(record: T): T & { id: string } {
		return {
			...record,
			id: record.id instanceof RecordId ? record.id.toString() : (record.id as string)
		};
	}

	/**
	 * Helper to validate if an ID has the correct table prefix
	 */
	private static validateId(id: string, expectedType: 'file' | 'folder' | 'any') {
		if (!id) {
			throw new FileSystemError('ID cannot be empty');
		}

		if (expectedType === 'any') {
			if (!id.startsWith('file:') && !id.startsWith('folder:')) {
				throw new FileSystemError(
					`Invalid ID format. Must start with 'file:' or 'folder:'. Received: ${id}`
				);
			}
			return;
		}

		const prefix = `${expectedType}:`;
		if (!id.startsWith(prefix)) {
			throw new FileSystemError(
				`Invalid ID. Expected a ${expectedType} ID starting with '${prefix}', but received: ${id}`
			);
		}
	}

	// ==========================================
	// READ OPERATIONS (VSCode Sidebar)
	// ==========================================

	static async getRootFolders(): Promise<Folder<string>[]> {
		try {
			await connectDB();
			const [result] = await db.query<[Folder[]]>(surql`
				SELECT * FROM folder WHERE count(<-contains) = 0;
			`);
			return result.map((f) => this.sanitizeId(f));
		} catch (error) {
			throw new FileSystemError('Failed to fetch root folders', error);
		}
	}

	static async getFolderContents(folderId: string): Promise<FolderContents<string>> {
		this.validateId(folderId, 'folder');

		try {
			await connectDB();
			const [result] = await db.query<[{ folders: Folder[]; files: File[] }[]]>(surql`
				SELECT
					->contains->folder.* AS folders,
					->contains->file.* AS files
				FROM type::record(${folderId})
			`);

			const data = result[0] || { folders: [], files: [] };
			return {
				folders: data.folders.map((f) => this.sanitizeId(f)),
				files: data.files.map((f) => this.sanitizeId(f))
			};
		} catch (error) {
			throw new FileSystemError(`Failed to fetch contents for folder ${folderId}`, error);
		}
	}

	static async getFile(fileId: string): Promise<File<string> | null> {
		this.validateId(fileId, 'file');

		try {
			await connectDB();
			const file = await db.select<File>(new StringRecordId(fileId));
			return file ? this.sanitizeId(file) : null;
		} catch (error) {
			throw new FileSystemError(`Failed to fetch file with ID ${fileId}`, error);
		}
	}

	// ==========================================
	// WRITE OPERATIONS (CRUD)
	// ==========================================

	static async createFolder(name: string, parentId?: string): Promise<Folder<string>> {
		if (parentId) this.validateId(parentId, 'folder');

		try {
			await connectDB();
			const [result] = await db.query<[Folder[]]>(surql`
				{
					LET $new_folder = (CREATE folder CONTENT { name: ${name}, is_open: false });
					IF ${parentId ?? 'x'} != 'x' {
						LET $parent_id = type::record(${parentId});
						RELATE $parent_id->contains->($new_folder.id);
					};
					RETURN $new_folder;
				}
			`);

			if (!result || !result[0]) {
				throw new FileSystemError('Database returned empty result after folder creation');
			}
			return this.sanitizeId(result[0]);
		} catch (error) {
			throw new FileSystemError(`Failed to create folder '${name}'`, error);
		}
	}

	static async createFile(title: string, parentId: string, content: string = ''): Promise<File<string>> {
		this.validateId(parentId, 'folder');

		try {
			await connectDB();
			const [result] = await db.query<[File[]]>(surql`
				{
					LET $parent_id = type::record(${parentId});
					LET $new_file = (CREATE file CONTENT { title: ${title}, content: ${content} });
					RELATE $parent_id->contains->($new_file.id);
					RETURN $new_file;
				}
			`);

			if (!result || !result[0]) {
				throw new FileSystemError('Database returned empty result after file creation');
			}
			return this.sanitizeId(result[0]);
		} catch (error) {
			throw new FileSystemError(`Failed to create file '${title}'`, error);
		}
	}

	// ==========================================
	// UPDATE OPERATIONS (Rename, Move, Content)
	// ==========================================

	static async updateFileContent(fileId: string, content: string): Promise<File<string>> {
		this.validateId(fileId, 'file');

		try {
			await connectDB();
			const updated = await db.merge<File>(new StringRecordId(fileId), { content });
			if (!updated) throw new FileSystemError(`File ${fileId} not found`);
			return this.sanitizeId<File>(updated);
		} catch (error) {
			throw new FileSystemError(`Failed to update content for file ${fileId}`, error);
		}
	}

	static async renameItem(id: string, newName: string): Promise<void> {
		this.validateId(id, 'any'); // Validates that it's either file: or folder:

		try {
			await connectDB();
			const field = id.startsWith('file:') ? 'title' : 'name';
			const updated = await db.merge<File | Folder>(new StringRecordId(id), { [field]: newName });
			if (!updated) throw new FileSystemError(`Item ${id} not found to rename`);
		} catch (error) {
			throw new FileSystemError(`Failed to rename item ${id}`, error);
		}
	}

	static async moveItem(itemId: string, newParentId: string): Promise<void> {
		this.validateId(itemId, 'any');
		this.validateId(newParentId, 'folder'); // Parent must be a folder

		try {
			await connectDB();
			await db.query(surql`
				{
					LET $item_id = type::record(${itemId});
					LET $new_parent = type::record(${newParentId});
					DELETE contains WHERE out = $item_id;
					RELATE $new_parent->contains->$item_id;
				}
			`);
		} catch (error) {
			throw new FileSystemError(`Failed to move item ${itemId} to ${newParentId}`, error);
		}
	}

	// ==========================================
	// DELETE OPERATIONS
	// ==========================================

	static async deleteFile(fileId: string): Promise<void> {
		// Strict validation prevents deleting a folder via the deleteFile method
		this.validateId(fileId, 'file');

		try {
			await connectDB();
			await db.query(surql`DELETE type::record(${fileId});`);
		} catch (error) {
			throw new FileSystemError(`Failed to delete file ${fileId}`, error);
		}
	}

	static async deleteFolderAndContents(folderId: string): Promise<void> {
		this.validateId(folderId, 'folder');

		try {
			await connectDB();
			await db.query(surql`
				{
					fn::recursive_delete(type::record(${folderId}));
				}
			`);
		} catch (error) {
			throw new FileSystemError(`Failed to delete folder ${folderId}`, error);
		}
	}
}
