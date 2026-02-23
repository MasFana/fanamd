<script lang="ts">
	import {
		getRootFolders,
		getFolderContents,
		getFile,
		createFolder,
		createFile,
		updateFileContent,
		renameItem,
		moveItem,
		deleteFile,
		deleteFolderAndContents
	} from './FileSystem.remote'; // Adjust path if needed
	import type { Folder, File, FolderContents } from '$lib/domain/FileSystemTypes';


	// Navigation State
	let currentFolder = $state<Folder<string> | null>(null);
	let breadcrumbs = $state<Folder<string>[]>([]);
 
	// Editor State
	let selectedFile = $state<File<string> | null>(null);
	let editorContent = $state('');
	let isSaving = $state(false);

	// Error Toast
	let errorMessage = $state<string | null>(null);

	// --- Actions using Optimistic Updates --- //

	async function handleCreateFolder() {
		const name = prompt('Enter folder name:');
		if (!name) return;

		// Temporary optimistic object
		const tempFolder: Folder<string> = {
			id: `folder:temp-${Date.now()}`,
			name,
			is_open: false,
			created_at: new Date().toISOString()
		};

		try {
			const mutation = createFolder({ name, parentId: currentFolder?.id });

			if (currentFolder) {
				await mutation.updates(
					getFolderContents(currentFolder.id).withOverride((data) => ({
						folders: [...(data?.folders || []), tempFolder],
						files: data?.files || []
					}) as FolderContents<string>)
				);
			} else {
				await mutation.updates(
					getRootFolders().withOverride((folders) => [...(folders || []), tempFolder] as Folder<string>[])
				);
			}
		} catch (error: any) {
			errorMessage = error.message;
		}
	}

	async function handleCreateFile() {
		if (!currentFolder) {
			alert('Please open a folder first to create a file.');
			return;
		}
		const title = prompt('Enter file name (e.g., test.txt):');
		if (!title) return;

		const tempFile: File<string> = {
			id: `file:temp-${Date.now()}`,
			title,
			content: '',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};

		try {
			await createFile({
				title,
				parentId: currentFolder.id,
				content: ''
			}).updates(
				getFolderContents(currentFolder.id).withOverride((data) => ({
					folders: data?.folders || [],
					files: [...(data?.files || []), tempFile]
				}) as FolderContents<string>)
			);
		} catch (error: any) {
			errorMessage = error.message;
		}
	}

	async function handleRename(id: string, currentName: string, isFolder: boolean) {
		const newName = prompt('Enter new name:', currentName);
		if (!newName || newName === currentName) return;

		try {
			const mutation = renameItem({ id, newName });

			if (currentFolder) {
				await mutation.updates(
					getFolderContents(currentFolder.id).withOverride((data) => ({
						folders: isFolder
							? (data?.folders || []).map((f) => (f.id === id ? { ...f, name: newName } : f))
							: data?.folders || [],
						files: !isFolder
							? (data?.files || []).map((f) => (f.id === id ? { ...f, title: newName } : f))
							: data?.files || []
					}) as FolderContents<string>)
				);
			} else {
				await mutation.updates(
					getRootFolders().withOverride((folders) =>
						((folders || []).map((f) => (f.id === id ? { ...f, name: newName } : f))) as Folder<string>[]
					)
				);
			}

			// Optimistically update right panel if it's the opened file
			if (selectedFile?.id === id) {
				selectedFile.title = newName;
			}
		} catch (error: any) {
			errorMessage = error.message;
		}
	}

	async function handleMove(itemId: string, isFolder: boolean) {
		const newParentId = prompt(
			'Enter the ID of the destination folder:\n(Tip: Copy it from the UI)'
		);
		if (!newParentId) return;

		try {
			// Optimistically remove the item from the current view
			const mutation = moveItem({ itemId, newParentId });

			if (currentFolder) {
				await mutation.updates(
					getFolderContents(currentFolder.id).withOverride((data) => ({
						folders: isFolder
							? (data?.folders || []).filter((f) => f.id !== itemId)
							: data?.folders || [],
						files: !isFolder
							? (data?.files || []).filter((f) => f.id !== itemId)
							: data?.files || []
					}) as FolderContents<string>)
				);
			} else {
				await mutation.updates(
					getRootFolders().withOverride((folders) =>
						((folders || []).filter((f) => f.id !== itemId)) as Folder<string>[]
					)
				);
			}
		} catch (error: any) {
			errorMessage = error.message;
		}
	}

	async function handleDeleteFolder(id: string) {
		if (!confirm('Are you sure? This will recursively delete all contents!')) return;
		try {
			const mutation = deleteFolderAndContents(id);
			if (currentFolder) {
				await mutation.updates(
					getFolderContents(currentFolder.id).withOverride((data) => ({
						folders: (data?.folders || []).filter((f) => f.id !== id),
						files: data?.files || []
					}) as FolderContents<string>)
				);
			} else {
				await mutation.updates(
					getRootFolders().withOverride((folders) =>
						((folders || []).filter((f) => f.id !== id)) as Folder<string>[]
					)
				);
			}
		} catch (error: any) {
			errorMessage = error.message;
		}
	}

	async function handleDeleteFile(id: string) {
		if (!confirm('Delete this file permanently?')) return;
		if (!currentFolder) return; // Files only exist in folders in our schema

		try {
			await deleteFile(id).updates(
				getFolderContents(currentFolder.id).withOverride((data) => ({
					folders: data?.folders || [],
					files: (data?.files || []).filter((f) => f.id !== id)
				}) as FolderContents<string>)
			);

			if (selectedFile?.id === id) {
				selectedFile = null;
				editorContent = '';
			}
		} catch (error: any) {
			errorMessage = error.message;
		}
	}

	async function saveFile() {
		if (!selectedFile) return;
		isSaving = true;
		errorMessage = null;
		try {
			await updateFileContent({
				fileId: selectedFile.id,
				content: editorContent
			}).updates(
				getFile(selectedFile.id).withOverride((fileData) => ({
					...(fileData as File<string>),
					content: editorContent
				}))
			);
			selectedFile.content = editorContent;
			// Small visual cue could be added here
		} catch (error: any) {
			errorMessage = error.message;
		} finally {
			isSaving = false;
		}
	}

	// --- Navigation Helpers --- //

	function openFolder(folder: Folder<string>) {
		if (currentFolder) {
			breadcrumbs = [...breadcrumbs, currentFolder];
		}
		currentFolder = folder;
		selectedFile = null;
	}

	function navigateToBreadcrumb(index: number) {
		currentFolder = breadcrumbs[index];
		breadcrumbs = breadcrumbs.slice(0, index);
		selectedFile = null;
	}

	function loadRoot() {
		currentFolder = null;
		breadcrumbs = [];
		selectedFile = null;
	}

	async function openFile(file: File<string>) {
		try {
			selectedFile = file;
			const data = await getFile(file.id);
			if (data) editorContent = data.content || '';
		} catch (e: any) {
			errorMessage = e.message;
		}
	}
</script>

<div class="flex h-screen bg-gray-50 font-sans text-gray-900">
	<!-- LEFT PANEL: FILE SYSTEM -->
	<div class="flex w-1/2 flex-col border-r bg-white shadow-sm md:w-1/3">
		<!-- Header & Breadcrumbs -->
		<div class="flex flex-col gap-2 border-b bg-gray-100 p-4">
			<h1 class="text-lg font-bold">File Explorer</h1>

			<div class="flex flex-wrap items-center gap-1 text-sm font-medium text-gray-600">
				<button class="hover:text-blue-600 hover:underline" onclick={loadRoot}>Root</button>
				{#each breadcrumbs as crumb, i}
					<span>/</span>
					<button
						class="hover:text-blue-600 hover:underline"
						onclick={() => navigateToBreadcrumb(i)}
					>
						{crumb.name}
					</button>
				{/each}
				{#if currentFolder}
					<span>/</span>
					<span class="text-gray-900">{currentFolder.name}</span>
				{/if}
			</div>

			{#if currentFolder}
				<div class="mt-1 text-xs text-gray-400 select-all" title="Copy ID">
					ID: {currentFolder.id}
				</div>
			{/if}
		</div>

		<!-- Toolbar -->
		<div class="flex gap-2 border-b p-3">
			<button
				class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700"
				onclick={handleCreateFolder}
			>
				+ Folder
			</button>
			<button
				class="rounded bg-green-600 px-3 py-1.5 text-sm text-white transition hover:bg-green-700"
				disabled={!currentFolder}
				class:opacity-50={!currentFolder}
				onclick={handleCreateFile}
			>
				+ File
			</button>
		</div>

		<!-- List Container (Reactive {#await} queries) -->
		<div class="flex-1 overflow-y-auto p-2">
			{#if currentFolder}
				<!-- FOLDER CONTENTS VIEW -->
				{#await getFolderContents(currentFolder.id)}
					<div class="animate-pulse p-4 text-center text-gray-500">Loading contents...</div>
				{:then data}
					{#each data.folders as folder (folder.id)}
						<div class="group mb-1 flex items-center justify-between rounded p-2 hover:bg-blue-50">
							<button
								class="flex flex-1 items-center gap-2 text-left"
								onclick={() => openFolder(folder)}
							>
								<span class="text-xl text-yellow-500">📁</span>
								<span class="font-medium">{folder.name}</span>
							</button>
							<div class="hidden gap-1 text-xs group-hover:flex">
								<button
									class="rounded p-1 hover:bg-gray-200"
									onclick={() => handleRename(folder.id.toString(), folder.name, true)}
									>Rename</button
								>
								<button
									class="rounded p-1 hover:bg-gray-200"
									onclick={() => handleMove(folder.id.toString(), true)}>Move</button
								>
								<button
									class="rounded p-1 text-red-600 hover:bg-red-100"
									onclick={() => handleDeleteFolder(folder.id.toString())}>Del</button
								>
							</div>
						</div>
					{/each}
					{#each data.files as file (file.id)}
						<div
							class="group mb-1 flex cursor-pointer items-center justify-between rounded p-2 hover:bg-green-50 {selectedFile?.id ===
							file.id
								? 'bg-green-100'
								: ''}"
						>
							<button
								class="flex flex-1 items-center gap-2 text-left"
								onclick={() => openFile(file)}
							>
								<span class="text-xl text-gray-500">📄</span>
								<span>{file.title}</span>
							</button>
							<div class="hidden gap-1 text-xs group-hover:flex">
								<button
									class="rounded p-1 hover:bg-gray-200"
									onclick={() => handleRename(file.id, file.title, false)}>Rename</button
								>
								<button
									class="rounded p-1 hover:bg-gray-200"
									onclick={() => handleMove(file.id, false)}>Move</button
								>
								<button
									class="rounded p-1 text-red-600 hover:bg-red-100"
									onclick={() => handleDeleteFile(file.id)}>Del</button
								>
							</div>
						</div>
					{/each}
					{#if data.folders.length === 0 && data.files.length === 0}
						<div class="p-8 text-center text-sm text-gray-400">Folder is empty</div>
					{/if}
				{/await}
			{:else}
				<!-- ROOT VIEW -->
				{#await getRootFolders()}
					<div class="animate-pulse p-4 text-center text-gray-500">Loading roots...</div>
				{:then folders}
					{#each folders as folder (folder.id)}
						<div class="group mb-1 flex items-center justify-between rounded p-2 hover:bg-blue-50">
							<button
								class="flex flex-1 items-center gap-2 text-left"
								onclick={() => openFolder(folder)}
							>
								<span class="text-xl text-yellow-500">📁</span>
								<span class="font-medium">{folder.name}</span>
							</button>
							<div class="hidden gap-1 text-xs group-hover:flex">
								<button
									class="rounded p-1 hover:bg-gray-200"
									onclick={() => handleRename(folder.id.toString(), folder.name, true)}
									>Rename</button
								>
								<button
									class="rounded p-1 hover:bg-gray-200"
									onclick={() => handleMove(folder.id.toString(), true)}>Move</button
								>
								<button
									class="rounded p-1 text-red-600 hover:bg-red-100"
									onclick={() => handleDeleteFolder(folder.id.toString())}>Del</button
								>
							</div>
						</div>
					{/each}
					{#if folders.length === 0}
						<div class="p-8 text-center text-sm text-gray-400">No root folders found</div>
					{/if}
				{/await}
			{/if}
		</div>
	</div>

	<!-- RIGHT PANEL: EDITOR -->
	<div class="relative flex flex-1 flex-col">
		<!-- Error Toasts -->
		{#if errorMessage}
			<div
				class="absolute top-4 right-4 left-4 z-50 flex items-start justify-between rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 shadow-md"
			>
				<p class="font-medium">{errorMessage}</p>
				<button
					class="rounded px-2 font-bold hover:bg-red-200"
					onclick={() => (errorMessage = null)}>&times;</button
				>
			</div>
		{/if}

		{#if selectedFile}
			<div class="flex items-center justify-between border-b bg-white p-4">
				<div>
					<h2 class="text-xl font-bold">{selectedFile.title}</h2>
					<p class="text-xs text-gray-400 select-all" title="Copy ID">ID: {selectedFile.id}</p>
				</div>
				<button
					class="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
					onclick={saveFile}
					disabled={isSaving}
				>
					{#if isSaving}
						<span
							class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></span>
						Saving...
					{:else}
						Save Changes
					{/if}
				</button>
			</div>
			<div class="flex-1 bg-gray-50 p-4">
				<textarea
					class="h-full w-full resize-none rounded border bg-white p-4 font-mono text-sm shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none"
					bind:value={editorContent}
					placeholder="Type file content here..."
				></textarea>
			</div>
		{:else}
			<div class="flex flex-1 items-center justify-center text-gray-400">
				<div class="text-center">
					<p class="mb-4 text-6xl">🖥️</p>
					<p>Select a file to view and edit its contents</p>
				</div>
			</div>
		{/if}
	</div>
</div>
