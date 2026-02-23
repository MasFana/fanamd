import { RecordId } from 'surrealdb';

// The base constraint required by surrealdb
export interface SurrealRecord {
	[key: string]: unknown;
}

export interface Folder<ID = string | RecordId> extends SurrealRecord {
	id: ID;
	name: string;
	is_open: boolean;
	created_at: Date | string;
}

export interface File<ID = string | RecordId> extends SurrealRecord {
	id: ID;
	title: string;
	content: string;
	created_at: Date | string;
	updated_at: Date | string;
}

export interface FolderContents<ID = string | RecordId> {
	folders: Folder<ID>[];
	files: File<ID>[];
}
