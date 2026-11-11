// Obsidian's settings search finds a setting by its name, description and
// aliases. A section drawn by hand has none of those unless it is given them,
// so every setting except the footer must carry a name and be searchable. The
// tab is declarative today; this pins that a hand-drawn section added later
// cannot slip out of search.

import type { App } from 'obsidian';

import type VaultPerformancePlugin from '../main';
import { DEFAULT_SETTINGS } from '../settings';

import { VaultPerformanceSettingTab } from '../settings-tab';

interface Item {
	type?: string;
	name?: string;
	desc?: unknown;
	searchable?: boolean | (() => boolean);
	render?: unknown;
	items?: Item[];
}

function leaves(items: Item[]): Item[] {
	return items.flatMap((i) => (i.items ? leaves(i.items) : [i]));
}

// Obsidian treats an absent `searchable` as true and also accepts a callback.
function isSearchable(i: Item): boolean {
	return typeof i.searchable === 'function'
		? i.searchable()
		: i.searchable !== false;
}

describe('settings search', () => {
	const plugin = {
		settings: structuredClone(DEFAULT_SETTINGS),
	} as unknown as VaultPerformancePlugin;
	const tab = new VaultPerformanceSettingTab({} as App, plugin);
	const items = leaves(tab.getSettingDefinitions());

	it('keeps every setting searchable with a name and description, except the footer', () => {
		const hidden = items.filter((i) => !isSearchable(i));
		expect(hidden.map((i) => i.name)).toEqual(['About']);
		const searchable = items.filter(isSearchable);
		expect(searchable.length).toBeGreaterThan(0);
		for (const i of searchable) {
			expect(typeof i.name).toBe('string');
			expect(i.name).not.toBe('');
			expect(typeof i.desc).toBe('string');
		}
	});

	it('finds the settings people look for by name', () => {
		const names = items.map((i) => i.name);
		for (const n of [
			'Include note paths in reports',
			'Large note size in MB',
		])
			expect(names).toContain(n);
	});
});
