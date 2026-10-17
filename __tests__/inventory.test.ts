import { type FileEntry, isNote, summarizeInventory } from '../inventory';

const file = (path: string, size: number): FileEntry => ({
	path,
	extension: path.includes('.') ? (path.split('.').pop() ?? '') : '',
	size,
});

const MB = 1024 * 1024;

const files = [
	file('a.md', 10),
	file('log/diagnostics-log.md', 7 * MB),
	file('big.MD', 2 * MB),
	file('tie-b.md', 3 * MB),
	file('tie-a.md', 3 * MB),
	file('audio.ogg', 60 * MB),
	file('pic.png', 500),
	file('Makefile', 20),
];

describe('isNote', () => {
	it('treats only Markdown as notes, any case', () => {
		expect(isNote(file('x.md', 1))).toBe(true);
		expect(isNote(file('x.MD', 1))).toBe(true);
		expect(isNote(file('x.canvas', 1))).toBe(false);
		expect(isNote(file('Makefile', 1))).toBe(false);
	});
});

describe('summarizeInventory', () => {
	const inv = summarizeInventory(
		files,
		[
			{ id: 'zeta', name: 'Zeta', version: '1.0.0' },
			{ id: 'alpha', name: 'Alpha', version: '2.1.0' },
		],
		5,
		{ largeNoteBytes: 2 * MB, topCount: 3 },
	);

	it('counts and sizes notes and attachments separately', () => {
		expect(inv.notes.count).toBe(5);
		expect(inv.notes.bytes).toBe(10 + 15 * MB);
		expect(inv.attachments.count).toBe(3);
		expect(inv.attachments.bytes).toBe(60 * MB + 520);
	});

	it('lists the largest first, ties by path, capped at topCount', () => {
		expect(inv.notes.largest.map((f) => f.path)).toEqual([
			'log/diagnostics-log.md',
			'tie-a.md',
			'tie-b.md',
		]);
		expect(inv.attachments.largest.map((f) => f.path)).toEqual([
			'audio.ogg',
			'pic.png',
			'Makefile',
		]);
	});

	it('lists every note at or above the threshold, uncapped', () => {
		expect(inv.largeNotes.map((f) => f.path)).toEqual([
			'log/diagnostics-log.md',
			'tie-a.md',
			'tie-b.md',
			'big.MD',
		]);
		expect(inv.largeNoteBytes).toBe(2 * MB);
	});

	it('sorts enabled plugins by name and keeps the installed count', () => {
		expect(inv.enabledPlugins.map((p) => p.id)).toEqual(['alpha', 'zeta']);
		expect(inv.installedPluginCount).toBe(5);
	});

	it('does not reorder the caller arrays', () => {
		expect(files.map((f) => f.path)[0]).toBe('a.md');
	});

	it('handles an empty vault', () => {
		const empty = summarizeInventory([], [], 0, {
			largeNoteBytes: MB,
			topCount: 10,
		});
		expect(empty.notes).toEqual({ count: 0, bytes: 0, largest: [] });
		expect(empty.largeNotes).toEqual([]);
	});
});
