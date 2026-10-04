// Vault snapshot: what is in the vault and which plugins are on. Built from
// file metadata Obsidian already holds, so taking one reads no file contents.

export interface FileEntry {
	path: string;
	extension: string;
	size: number;
}

export interface PluginEntry {
	id: string;
	name: string;
	version: string;
}

interface FileGroup {
	count: number;
	bytes: number;
	// Largest first, at most `topCount` entries.
	largest: FileEntry[];
}

export interface VaultInventory {
	notes: FileGroup;
	attachments: FileGroup;
	// Every note at or above the threshold, largest first.
	largeNotes: FileEntry[];
	largeNoteBytes: number;
	enabledPlugins: PluginEntry[];
	installedPluginCount: number;
}

export interface InventoryOptions {
	largeNoteBytes: number;
	topCount: number;
}

const bySizeThenPath = (a: FileEntry, b: FileEntry): number =>
	b.size - a.size || a.path.localeCompare(b.path);

// Notes are Markdown files: the ones Obsidian's metadata cache parses. Every
// other file counts as an attachment.
export function isNote(file: FileEntry): boolean {
	return file.extension.toLowerCase() === 'md';
}

function group(files: FileEntry[], topCount: number): FileGroup {
	return {
		count: files.length,
		bytes: files.reduce((sum, f) => sum + f.size, 0),
		largest: [...files].sort(bySizeThenPath).slice(0, topCount),
	};
}

export function summarizeInventory(
	files: FileEntry[],
	enabledPlugins: PluginEntry[],
	installedPluginCount: number,
	options: InventoryOptions,
): VaultInventory {
	const notes = files.filter(isNote);
	const attachments = files.filter((f) => !isNote(f));
	return {
		notes: group(notes, options.topCount),
		attachments: group(attachments, options.topCount),
		largeNotes: notes
			.filter((f) => f.size >= options.largeNoteBytes)
			.sort(bySizeThenPath),
		largeNoteBytes: options.largeNoteBytes,
		enabledPlugins: [...enabledPlugins].sort(
			(a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
		),
		installedPluginCount,
	};
}
