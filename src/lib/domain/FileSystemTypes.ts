import { RecordId } from 'surrealdb';

/**
 * Base interface for SurrealDB records
 */
export interface SurrealRecord {
	[key: string]: unknown;
}

/**
 * Represents a Folder in the virtual file system
 */
export interface Folder<ID = string | RecordId> extends SurrealRecord {
	id: ID;
	name: string;
	is_open: boolean;
	created_at: Date | string;
}

/**
 * Represents a File in the virtual file system
 */
export interface File<ID = string | RecordId> extends SurrealRecord {
	id: ID;
	title: string;
	content: string;
	created_at: Date | string;
	updated_at: Date | string;
}

/**
 * Represents the nested contents of a folder
 */
export interface FolderContents<ID = string | RecordId> {
	folders: Folder<ID>[];
	files: File<ID>[];
}
