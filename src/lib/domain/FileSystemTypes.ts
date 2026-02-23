import { RecordId } from 'surrealdb';

// The base constraint required by surrealdb
export interface SurrealRecord {
	[key: string]: unknown;
}

export interface Folder extends SurrealRecord {
	id: string | RecordId;
	name: string;
	is_open: boolean;
	created_at: Date | string;
}

export interface File extends SurrealRecord {
	id: string | RecordId;
	title: string;
	content: string;
	created_at: Date | string;
	updated_at: Date | string;
}

export interface FolderContents {
	folders: Folder[];
	files: File[];
}
