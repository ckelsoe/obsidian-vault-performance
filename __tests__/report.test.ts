import { type FileEntry, summarizeInventory } from '../inventory';
import {
	buildReport,
	escapeCell,
	formatBytes,
	formatTimestamp,
	type ReportMeta,
} from '../report';

const MB = 1024 * 1024;
const file = (path: string, extension: string, size: number): FileEntry => ({
	path,
	extension,
	size,
});

const meta: ReportMeta = {
	generatedAt: new Date(2026, 9, 4, 9, 5),
	obsidianVersion: '1.14.3',
	pluginVersion: '0.1.0',
	platform: 'macOS',
};

const inventory = summarizeInventory(
	[
		file('Health/Diagnosis.md', 'md', 7 * MB),
		file('daily.md', 'md', 2048),
		file('a|b.md', 'md', 1.5 * MB),
		file('audio.ogg', 'ogg', 60 * MB),
		file('LICENSE', '', 100),
	],
	[{ id: 'annoteca', name: 'Annoteca', version: '1.20.0' }],
	3,
	{ largeNoteBytes: MB, topCount: 10 },
);

describe('buildReport with paths hidden', () => {
	const text = buildReport(inventory, meta, { includePaths: false });

	it('produces the exact report', () => {
		expect(text).toBe(
			[
				'# Vault performance report',
				'',
				'- Generated: 2026-10-04 09:05',
				'- Obsidian 1.14.3 on macOS, Vault Performance 0.1.0',
				'- Note paths: hidden',
				'',
				'## Vault',
				'',
				'| | Files | Size |',
				'|---|---:|---:|',
				'| Notes | 3 | 8.5 MB |',
				'| Attachments | 2 | 60.0 MB |',
				'| Total | 5 | 68.5 MB |',
				'',
				'Notes are Markdown files. Attachments are every other file in the vault.',
				'',
				'## Large notes',
				'',
				"2 notes are 1.0 MB or larger. Obsidian's metadata cache parses a note again each time it changes, so a large note that changes often slows the vault.",
				'',
				'| Note | Size |',
				'|---|---:|',
				'| Note 1 | 7.0 MB |',
				'| Note 2 | 1.5 MB |',
				'',
				'## Largest notes',
				'',
				'| Note | Size |',
				'|---|---:|',
				'| Note 1 | 7.0 MB |',
				'| Note 2 | 1.5 MB |',
				'| Note 3 | 2.0 KB |',
				'',
				'## Largest attachments',
				'',
				'| Attachment | Size |',
				'|---|---:|',
				'| Attachment 1 (.ogg) | 60.0 MB |',
				'| Attachment 2 | 100 B |',
				'',
				'## Community plugins',
				'',
				'1 of 3 installed plugins are enabled.',
				'',
				'| Plugin | ID | Version |',
				'|---|---|---|',
				'| Annoteca | annoteca | 1.20.0 |',
				'',
			].join('\n'),
		);
	});

	it('never contains a path', () => {
		expect(text).not.toContain('Diagnosis');
		expect(text).not.toContain('daily');
		expect(text).not.toContain('audio');
		expect(text).not.toContain('LICENSE');
	});
});

describe('buildReport with paths shown', () => {
	const text = buildReport(inventory, meta, { includePaths: true });

	it('names files by path, escaping table pipes', () => {
		expect(text).toContain('- Note paths: shown');
		expect(text).toContain('| Health/Diagnosis.md | 7.0 MB |');
		expect(text).toContain('| a\\|b.md | 1.5 MB |');
		expect(text).not.toContain('| a|b.md');
		expect(text).toContain('| audio.ogg | 60.0 MB |');
		expect(text).not.toContain('Note 1');
	});
});

describe('buildReport edge cases', () => {
	it('says so when no note is large, and handles one large note', () => {
		const none = summarizeInventory([file('a.md', 'md', 10)], [], 0, {
			largeNoteBytes: MB,
			topCount: 10,
		});
		const noneText = buildReport(none, meta, { includePaths: false });
		expect(noneText).toContain('No note is 1.0 MB or larger.');
		expect(noneText).not.toContain('## Largest attachments');
		expect(noneText).toContain('0 of 0 installed plugins are enabled.');
		expect(noneText).not.toContain('| Plugin |');

		const one = summarizeInventory([file('a.md', 'md', 2 * MB)], [], 0, {
			largeNoteBytes: MB,
			topCount: 10,
		});
		expect(buildReport(one, meta, { includePaths: false })).toContain(
			'1 note is 1.0 MB or larger.',
		);
	});

	it('omits note tables for an empty vault', () => {
		const empty = summarizeInventory([], [], 0, {
			largeNoteBytes: MB,
			topCount: 10,
		});
		const text = buildReport(empty, meta, { includePaths: false });
		expect(text).not.toContain('## Largest notes');
		expect(text).toContain('| Total | 0 | 0 B |');
	});
});

describe('formatting helpers', () => {
	it.each([
		[0, '0 B'],
		[1023, '1023 B'],
		[1024, '1.0 KB'],
		[MB - 1, '1.0 MB'],
		[1.25 * MB, '1.3 MB'],
		[1024 * 1024 * MB, '1.00 TB'],
		[MB, '1.0 MB'],
		[1024 * MB, '1.00 GB'],
	])('formatBytes(%p) = %p', (bytes, expected) => {
		expect(formatBytes(bytes)).toBe(expected);
	});

	it('pads the timestamp', () => {
		expect(formatTimestamp(new Date(2026, 0, 2, 3, 4))).toBe(
			'2026-01-02 03:04',
		);
	});

	it('escapes cell breakers', () => {
		expect(escapeCell('a|b\\c\nd')).toBe('a\\|b\\\\c d');
	});

	it.each([
		['![x](photo.png).md', '\\!\\[x\\](photo.png).md'],
		['[[Secret]].md', '\\[\\[Secret\\]\\].md'],
		['#tag note.md', '\\#tag note.md'],
		['<img src=x>.md', '\\<img src\\=x\\>.md'],
		[
			'*b* _i_ ~~s~~ ==h== `c` $m$ %%c%% ^id &amp;',
			'\\*b\\* \\_i\\_ \\~\\~s\\~\\~ \\=\\=h\\=\\= \\`c\\` \\$m\\$ \\%\\%c\\%\\% \\^id \\&amp;',
		],
		[
			'Health/Diagnosis 2026-10-04 (draft).md',
			'Health/Diagnosis 2026-10-04 (draft).md',
		],
	])('escapes inline Markdown in %p', (input, expected) => {
		expect(escapeCell(input)).toBe(expected);
	});
});
