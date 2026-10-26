// Builds the Markdown report. Pure: everything it shows comes in as
// arguments, so the exact text a user would paste into an issue is unit
// tested.

import { type FileEntry, isNote, type VaultInventory } from './inventory';

export interface ReportMeta {
	generatedAt: Date;
	obsidianVersion: string;
	pluginVersion: string;
	platform: string;
}

export interface ReportOptions {
	includePaths: boolean;
}

const UNITS = ['KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	let value = bytes / 1024;
	let unit = 0;
	// Pick the unit after rounding, so 1,048,575 bytes reads 1.0 MB rather
	// than 1024.0 KB.
	while (unit < UNITS.length - 1 && Number(value.toFixed(1)) >= 1024) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(unit >= 2 ? 2 : 1)} ${UNITS[unit] ?? 'TB'}`;
}

function formatCount(n: number): string {
	return n.toLocaleString('en-US');
}

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

// Local time, minute precision: what a user reads off their own clock.
export function formatTimestamp(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// A table cell holding literal text such as a file name. The report is
// rendered as Markdown and may be saved as a note, so every character that can
// start inline syntax is escaped: a name like `![x](photo.png).md` must not
// embed an image, `[[a]]` must not become a link, `#tag` must not tag the
// saved note. Pipes would end the cell, and a line break would end the row.
export function escapeCell(text: string): string {
	return text
		.replace(/[\\`*_[\]<>!|~=^#$%&]/g, '\\$&')
		.replace(/[\r\n]+/g, ' ');
}

// Names files in the report. With paths hidden, each file gets a stable label
// for the whole report ("Note 1" means the same note in every table) and keeps
// only its extension, which says what kind of file it is without saying what
// it is about.
class FileLabeler {
	private readonly labels = new Map<string, string>();
	private notes = 0;
	private attachments = 0;

	constructor(private readonly includePaths: boolean) {}

	label(file: FileEntry): string {
		if (this.includePaths) return escapeCell(file.path);
		const existing = this.labels.get(file.path);
		if (existing !== undefined) return existing;
		const label = isNote(file)
			? `Note ${++this.notes}`
			: `Attachment ${++this.attachments}${file.extension === '' ? '' : ` (.${escapeCell(file.extension)})`}`;
		this.labels.set(file.path, label);
		return label;
	}
}

function fileTable(
	heading: string,
	files: FileEntry[],
	labeler: FileLabeler,
): string[] {
	const lines = [`| ${heading} | Size |`, '|---|---:|'];
	for (const f of files) {
		lines.push(`| ${labeler.label(f)} | ${formatBytes(f.size)} |`);
	}
	return lines;
}

export function buildReport(
	inventory: VaultInventory,
	meta: ReportMeta,
	options: ReportOptions,
): string {
	const labeler = new FileLabeler(options.includePaths);
	const { notes, attachments } = inventory;
	const out: string[] = [
		'# Vault performance report',
		'',
		`- Generated: ${formatTimestamp(meta.generatedAt)}`,
		`- Obsidian ${meta.obsidianVersion} on ${meta.platform}, Vault Performance ${meta.pluginVersion}`,
		`- Note paths: ${options.includePaths ? 'shown' : 'hidden'}`,
		'',
		'## Vault',
		'',
		'| | Files | Size |',
		'|---|---:|---:|',
		`| Notes | ${formatCount(notes.count)} | ${formatBytes(notes.bytes)} |`,
		`| Attachments | ${formatCount(attachments.count)} | ${formatBytes(attachments.bytes)} |`,
		`| Total | ${formatCount(notes.count + attachments.count)} | ${formatBytes(notes.bytes + attachments.bytes)} |`,
		'',
		'Notes are Markdown files. Attachments are every other file in the vault.',
		'',
		'## Large notes',
		'',
	];

	const threshold = formatBytes(inventory.largeNoteBytes);
	if (inventory.largeNotes.length === 0) {
		out.push(`No note is ${threshold} or larger.`);
	} else {
		const n = inventory.largeNotes.length;
		out.push(
			`${formatCount(n)} ${n === 1 ? 'note is' : 'notes are'} ${threshold} or larger. Obsidian's metadata cache parses a note again each time it changes, so a large note that changes often slows the vault.`,
			'',
			...fileTable('Note', inventory.largeNotes, labeler),
		);
	}

	if (notes.largest.length > 0) {
		out.push(
			'',
			'## Largest notes',
			'',
			...fileTable('Note', notes.largest, labeler),
		);
	}
	if (attachments.largest.length > 0) {
		out.push(
			'',
			'## Largest attachments',
			'',
			...fileTable('Attachment', attachments.largest, labeler),
		);
	}

	const plugins = inventory.enabledPlugins;
	out.push(
		'',
		'## Community plugins',
		'',
		`${formatCount(plugins.length)} of ${formatCount(inventory.installedPluginCount)} installed plugins are enabled.`,
	);
	if (plugins.length > 0) {
		out.push('', '| Plugin | ID | Version |', '|---|---|---|');
		for (const p of plugins) {
			out.push(
				`| ${escapeCell(p.name)} | ${escapeCell(p.id)} | ${escapeCell(p.version)} |`,
			);
		}
	}

	out.push('');
	return out.join('\n');
}
