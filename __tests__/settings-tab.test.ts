import type { App, Plugin, Setting } from 'obsidian';

import { VaultPerformanceSettingTab } from '../settings-tab';

// A minimal element tree with the Obsidian DOM helpers the footer uses, so the
// rendered structure can be asserted without a browser environment.
interface ElOptions {
	cls?: string;
	text?: string;
	href?: string;
	attr?: Record<string, string>;
}

interface FakeEl {
	tag: string;
	cls: string[];
	text: string;
	attrs: Record<string, string>;
	children: FakeEl[];
	empty(): void;
	addClass(c: string): void;
	createDiv(o?: ElOptions): FakeEl;
	createSpan(o?: ElOptions): FakeEl;
	createEl(tag: string, o?: ElOptions): FakeEl;
}

function fakeEl(tag: string): FakeEl {
	const append = (childTag: string, o: ElOptions = {}): FakeEl => {
		const child = fakeEl(childTag);
		if (o.cls !== undefined) child.cls.push(o.cls);
		if (o.text !== undefined) child.text = o.text;
		if (o.href !== undefined) child.attrs.href = o.href;
		Object.assign(child.attrs, o.attr ?? {});
		el.children.push(child);
		return child;
	};
	const el: FakeEl = {
		tag,
		cls: [],
		text: '',
		attrs: {},
		children: [],
		empty() {
			el.children = [];
		},
		addClass(c) {
			el.cls.push(c);
		},
		createDiv: (o) => append('div', o),
		createSpan: (o) => append('span', o),
		createEl: (childTag, o) => append(childTag, o),
	};
	return el;
}

function renderFooter(version: string): FakeEl {
	const plugin = { manifest: { version } } as unknown as Plugin;
	const tab = new VaultPerformanceSettingTab({} as App, plugin);
	const defs = tab.getSettingDefinitions();
	const last = defs[defs.length - 1] as unknown as {
		name: string;
		render: (s: Setting) => void;
	};
	expect(last.name).toBe('About');
	const settingEl = fakeEl('div');
	settingEl.children.push(fakeEl('div')); // stale content to be cleared
	last.render({ settingEl } as unknown as Setting);
	return settingEl;
}

describe('settings footer', () => {
	it('is the last item and reads Version | GitHub | Discord | Report issues', () => {
		const el = renderFooter('0.1.0');
		expect(el.cls).toContain('vault-performance-settings-footer');
		expect(el.children).toHaveLength(1);
		const inner = el.children[0];
		if (inner === undefined) throw new Error('no inner row');
		expect(inner.cls).toEqual(['vault-performance-footer-inner']);
		const [version, ...links] = inner.children;
		expect(version?.text).toBe('Version 0.1.0');
		expect(
			links.map((item) => [
				item.children[0]?.text,
				item.children[1]?.text,
				item.children[1]?.attrs.href,
			]),
		).toEqual([
			[
				'|',
				'GitHub',
				'https://github.com/ckelsoe/obsidian-vault-performance',
			],
			['|', 'Discord', 'https://discord.gg/gd6tKJDPj4'],
			[
				'|',
				'Report issues',
				'https://github.com/ckelsoe/obsidian-vault-performance/issues',
			],
		]);
	});

	it('keeps each separator with its link and opens links in a new tab', () => {
		const inner = renderFooter('0.1.0').children[0];
		const links = inner?.children.slice(1) ?? [];
		expect(links).toHaveLength(3);
		for (const item of links) {
			expect(item.cls).toEqual(['vault-performance-footer-link']);
			expect(item.children[1]?.attrs).toMatchObject({
				target: '_blank',
				rel: 'noopener',
			});
		}
		expect(
			links.map((item) => item.children[1]?.attrs['aria-label']),
		).toEqual([
			'Open the plugin repository on GitHub',
			'Join the community on Discord',
			'Report an issue on GitHub',
		]);
	});
});
