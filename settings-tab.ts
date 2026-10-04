import {
	type App,
	PluginSettingTab,
	type Setting,
	type SettingDefinitionItem,
} from 'obsidian';

import type VaultPerformancePlugin from './main';
import { isValidThreshold } from './settings';

// Community discussion for this plugin. This must stay a never-expiring
// discord.gg invite: a discord.com/channels/... deep link only resolves for
// accounts already in the server, so it cannot get anyone in, and a default
// invite expires after 7 days and would rot in a shipped release.
const DISCORD_URL = 'https://discord.gg/gd6tKJDPj4';

const REPO_URL = 'https://github.com/ckelsoe/obsidian-vault-performance';

export class VaultPerformanceSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: VaultPerformancePlugin,
	) {
		super(app, plugin);
	}

	override getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: 'group',
				heading: 'Reports',
				items: [
					{
						name: 'Include note paths in reports',
						desc: 'Off: copied and saved reports call notes "Note 1", "Note 2" and so on. Paths can be personal, so they stay out unless you turn this on. The report tab always shows real paths.',
						control: { type: 'toggle', key: 'includePaths' },
					},
					{
						name: 'Large note size in MB',
						desc: 'Notes this size or larger are listed as large.',
						control: {
							type: 'number',
							key: 'largeNoteMb',
							validate: (value: number) =>
								isValidThreshold(value)
									? undefined
									: 'Enter a size above 0.',
						},
					},
				],
			},
			{
				name: 'About',
				searchable: false,
				render: (setting: Setting) => {
					this.renderFooter(setting);
				},
			},
		];
	}

	override getControlValue(key: string): unknown {
		const settings = this.plugin.settings as unknown as Record<
			string,
			unknown
		>;
		return Object.prototype.hasOwnProperty.call(settings, key)
			? settings[key]
			: undefined;
	}

	override async setControlValue(key: string, value: unknown): Promise<void> {
		const { settings } = this.plugin;
		if (key === 'includePaths' && typeof value === 'boolean') {
			settings.includePaths = value;
		} else if (key === 'largeNoteMb' && isValidThreshold(value)) {
			settings.largeNoteMb = value;
		} else {
			return;
		}
		await this.plugin.saveSettings();
	}

	private renderFooter(setting: Setting): void {
		const el = setting.settingEl;
		el.empty();
		el.addClass('vault-performance-settings-footer');
		// One inner flex container; separators are the gap, not text whitespace.
		const inner = el.createDiv({ cls: 'vault-performance-footer-inner' });
		const manifestVersion = this.plugin.manifest.version || '0.0.0';
		inner.createSpan({ text: `Version ${manifestVersion}` });
		// Each separator and its link are one nowrap item, so a narrow pane wraps
		// between whole "| Link" units and never leaves a stray "|".
		const link = (text: string, url: string, label: string): void => {
			const item = inner.createSpan({
				cls: 'vault-performance-footer-link',
			});
			item.createSpan({
				cls: 'vault-performance-footer-separator',
				text: '|',
			});
			item.createEl('a', {
				text,
				href: url,
				attr: {
					target: '_blank',
					rel: 'noopener',
					'aria-label': label,
				},
			});
		};
		link('GitHub', REPO_URL, 'Open the plugin repository on GitHub');
		link('Discord', DISCORD_URL, 'Join the community on Discord');
		link(
			'Report issues',
			`${REPO_URL}/issues`,
			'Report an issue on GitHub',
		);
	}
}
