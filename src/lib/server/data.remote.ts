import { query } from '$app/server';
import { FileSystemService } from '$lib';
import {} from 'surrealdb';
import { string } from 'valibot';

export const getRootFolders = query(async () => {
	const rootFolders = await FileSystemService.getRootFolders();
	return rootFolders;
});

export const getFolderContents = query(string(), async (folderId: string) => {
	const folderContents = await FileSystemService.getFolderContents(folderId);
	return folderContents;
});

export const getFile = query(string(), async (fileId: string) => {
	const file = await FileSystemService.getFile(fileId);
	return file;
});
