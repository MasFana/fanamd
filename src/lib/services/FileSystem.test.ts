import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, connectDB } from '../infrastructure/db';
import { FileSystemService, FileSystemError } from './FileSystemService';

// Extract the raw schema and seed data you provided
const SCHEMA = `
-- 1. FOLDERS
DEFINE TABLE folder SCHEMAFULL;
DEFINE FIELD name ON TABLE folder TYPE string ASSERT string::len($value) > 0 AND string::len($value) <= 255;
DEFINE FIELD is_open ON TABLE folder TYPE bool DEFAULT false;
DEFINE FIELD created_at ON TABLE folder TYPE datetime DEFAULT time::now() READONLY;

-- 2. FILES
DEFINE TABLE file SCHEMAFULL;
DEFINE FIELD title ON TABLE file TYPE string ASSERT string::len($value) > 0 AND string::len($value) <= 255;
DEFINE FIELD content ON TABLE file TYPE string DEFAULT "";
DEFINE FIELD created_at ON TABLE file TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON TABLE file TYPE datetime DEFAULT time::now() VALUE time::now();

-- 3. THE GRAPH EDGE (Relationship)
DEFINE TABLE contains SCHEMAFULL TYPE RELATION IN folder OUT folder | file;

-- 4 Auto Cascade Delete Function
DEFINE FUNCTION fn::recursive_delete($node: record) {
    LET $children = (SELECT VALUE out FROM contains WHERE in = $node);
    FOR $child IN $children { fn::recursive_delete($child); };
    DELETE $node;
};

DEFINE INDEX idx_contains_in ON TABLE contains COLUMNS in;
DEFINE INDEX idx_contains_out ON TABLE contains COLUMNS out;
`;

const SEED_DATA = `
BEGIN TRANSACTION;
LET $root = (CREATE folder SET name = 'Root');

LET $docs = (CREATE folder SET name = 'Documents');
LET $media = (CREATE folder SET name = 'Media');
LET $trash = (CREATE folder SET name = 'Trash');

LET $work = (CREATE folder SET name = 'Work Projects');
LET $personal = (CREATE folder SET name = 'Personal');
LET $photos = (CREATE folder SET name = 'Photos');

LET $f_readme = (CREATE file SET title = 'README.txt', content = 'Welcome to the file system.');
LET $f_budget = (CREATE file SET title = '2024_Budget.xlsx', content = 'raw_binary_content_mock');
LET $f_notes = (CREATE file SET title = 'meeting_notes.md', content = '# Monday Meeting');
LET $f_logo = (CREATE file SET title = 'logo.png', content = 'image_data');
LET $f_old = (CREATE file SET title = 'old_config.json', content = '{}');

RELATE $root->contains->$docs;
RELATE $root->contains->$media;
RELATE $root->contains->$trash;
RELATE $root->contains->$f_readme;

RELATE $docs->contains->$work;
RELATE $docs->contains->$personal;
RELATE $media->contains->$photos;

RELATE $work->contains->$f_budget;
RELATE $work->contains->$f_notes;
RELATE $photos->contains->$f_logo;
RELATE $trash->contains->$f_old;
COMMIT TRANSACTION;
`;

const cleanup = async () => {
	// 1. Tables support "IF EXISTS"
	await db.query(`
        REMOVE TABLE IF EXISTS folder;
        REMOVE TABLE IF EXISTS file;
        REMOVE TABLE IF EXISTS contains;
    `);

	// 2. Functions do NOT support "IF EXISTS".
	// We wrap it in a try/catch or use .catch() to ignore the error if the function is missing.
	try {
		await db.query(`REMOVE FUNCTION fn::recursive_delete;`);
	} catch (e) {
		// Ignore error: "The function 'fn::recursive_delete' does not exist"
	}
};

describe('FileSystemService End-to-End Tests', () => {
	// Store IDs globally for use across tests
	let rootFolderId: string;
	let documentsFolderId: string;
	let readmeFileId: string;

	beforeAll(async () => {
		await connectDB();
		// Clear db for clean slate
		await cleanup();
		// Apply Schema and Seed Data
		await db.query(SCHEMA);
		await db.query(SEED_DATA);
	});

	afterAll(async () => {
		// Clean up database after tests
		await cleanup();
	});

	describe('1. Read Operations', () => {
		it('should fetch the root folder', async () => {
			const roots = await FileSystemService.getRootFolders();

			expect(roots.length).toBe(1);
			expect(roots[0].name).toBe('Root');
			expect(roots[0].id).toMatch(/^folder:/);

			rootFolderId = roots[0].id as string; // Save for later tests
		});

		it('should lazy load folder contents (Root -> Documents/Media/Trash/README)', async () => {
			const contents = await FileSystemService.getFolderContents(rootFolderId);

			// Root has 3 folders and 1 file
			expect(contents.folders.length).toBe(3);
			expect(contents.files.length).toBe(1);

			const docs = contents.folders.find((f) => f.name === 'Documents');
			expect(docs).toBeDefined();
			documentsFolderId = docs!.id as string; // Save for later

			const readme = contents.files.find((f) => f.title === 'README.txt');
			expect(readme).toBeDefined();
			readmeFileId = readme!.id as string; // Save for later
		});

		it('should fetch specific file content', async () => {
			const file = await FileSystemService.getFile(readmeFileId);
			expect(file).not.toBeNull();
			expect(file?.title).toBe('README.txt');
			expect(file?.content).toBe('Welcome to the file system.');
		});
	});

	describe('2. Write Operations (CRUD)', () => {
		let newlyCreatedFolderId: string;

		it('should create a new folder inside Documents', async () => {
			const newFolder = await FileSystemService.createFolder('Invoices', documentsFolderId);
			expect(newFolder.name).toBe('Invoices');
			expect(newFolder.id).toMatch(/^folder:/);
			newlyCreatedFolderId = newFolder.id as string;

			// Verify it appears in parent contents
			const docsContents = await FileSystemService.getFolderContents(documentsFolderId);
			const found = docsContents.folders.find((f) => f.id === newlyCreatedFolderId);
			expect(found).toBeDefined();
		});

		it('should create a new file inside the newly created folder', async () => {
			const newFile = await FileSystemService.createFile(
				'Jan2025.pdf',
				newlyCreatedFolderId,
				'pdf_mock_data'
			);
			expect(newFile.title).toBe('Jan2025.pdf');
			expect(newFile.content).toBe('pdf_mock_data');
			expect(newFile.id).toMatch(/^file:/);

			// Verify it appears in parent contents
			const folderContents = await FileSystemService.getFolderContents(newlyCreatedFolderId);
			const found = folderContents.files.find((f) => f.id === newFile.id);
			expect(found).toBeDefined();
		});

		it('should create a new root folder if parentId is omitted', async () => {
			const anotherRoot = await FileSystemService.createFolder('Backup_Drive');

			// Now there should be 2 root folders: "Root" and "Backup_Drive"
			const roots = await FileSystemService.getRootFolders();
			expect(roots.length).toBe(2);
			expect(roots.some((r) => r.name === 'Backup_Drive')).toBe(true);
		});
	});

	describe('3. Update Operations', () => {
		it('should update file content', async () => {
			const updatedFile = await FileSystemService.updateFileContent(
				readmeFileId,
				'Updated README content!'
			);
			expect(updatedFile.content).toBe('Updated README content!');

			// Verify by fetching again
			const fetchedFile = await FileSystemService.getFile(readmeFileId);
			expect(fetchedFile?.content).toBe('Updated README content!');
		});

		it('should rename a file correctly', async () => {
			await FileSystemService.renameItem(readmeFileId, 'README_v2.txt');
			const fetchedFile = await FileSystemService.getFile(readmeFileId);
			expect(fetchedFile?.title).toBe('README_v2.txt');
		});

		it('should rename a folder correctly', async () => {
			await FileSystemService.renameItem(documentsFolderId, 'Docs');
			// Re-fetch root contents to verify rename
			const contents = await FileSystemService.getFolderContents(rootFolderId);
			const renamedDocs = contents.folders.find((f) => f.id === documentsFolderId);
			expect(renamedDocs?.name).toBe('Docs');
		});

		it('should move a file from Root to Documents', async () => {
			// Move README from Root to Docs
			await FileSystemService.moveItem(readmeFileId, documentsFolderId);

			// Verify it's no longer in Root
			const rootContents = await FileSystemService.getFolderContents(rootFolderId);
			expect(rootContents.files.some((f) => f.id === readmeFileId)).toBe(false);

			// Verify it IS in Documents
			const docsContents = await FileSystemService.getFolderContents(documentsFolderId);
			expect(docsContents.files.some((f) => f.id === readmeFileId)).toBe(true);
		});
	});

	describe('4. Strict Error Handling & Validation', () => {
		it('should throw an error if trying to fetch a folder using getFile', async () => {
			await expect(FileSystemService.getFile(documentsFolderId)).rejects.toThrow(FileSystemError);
			await expect(FileSystemService.getFile(documentsFolderId)).rejects.toThrow(
				/Expected a file ID/
			);
		});

		it('should throw an error if passing empty ID', async () => {
			await expect(FileSystemService.getFolderContents('')).rejects.toThrow(/ID cannot be empty/);
		});

		it('should throw an error if trying to move item to a file (parent must be folder)', async () => {
			// Attempt to move Documents folder INTO the README file (should fail)
			await expect(FileSystemService.moveItem(documentsFolderId, readmeFileId)).rejects.toThrow(
				FileSystemError
			);
		});
	});

	describe('5. Delete Operations & Cascading', () => {
		it('should delete a file correctly', async () => {
			await FileSystemService.deleteFile(readmeFileId);

			// Verify it is gone
			const file = await FileSystemService.getFile(readmeFileId);
			expect(file).toBeNull();
		});

		it('should throw an error when trying to delete a folder using deleteFile()', async () => {
			await expect(FileSystemService.deleteFile(documentsFolderId)).rejects.toThrow(
				FileSystemError
			);
		});

		it('should successfully execute fn::recursive_delete and cascade down', async () => {
			// Root contains Docs (which contains work), Media, Trash.
			// We will delete the "Docs" folder.
			await FileSystemService.deleteFolderAndContents(documentsFolderId);

			// 1. Verify Docs is gone from Root
			const rootContents = await FileSystemService.getFolderContents(rootFolderId);
			expect(rootContents.folders.some((f) => f.id === documentsFolderId)).toBe(false);

			// 2. Verify Database is actually empty of the children records
			// "Work Projects" was inside Docs. Let's see if we can query it directly using surql.
			const [result] = await db.query(`SELECT * FROM folder WHERE name = 'Work Projects'`);
			expect((result as any[]).length).toBe(0); // Cascade deletion successful!
		});
	});
});
