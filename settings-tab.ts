import {
	type App,
	type Plugin,
	PluginSettingTab,
	type Setting,
	type SettingDefinition,
} from 'obsidian';

// Community discussion for this plugin. This must stay a never-expiring
// discord.gg invite: a discord.com/channels/... deep link only resolves for
// accounts already in the server, so it cannot get anyone in, and a default
// invite expires after 7 days and would rot in a shipped release.
const DISCORD_URL = 'https://discord.gg/gd6tKJDPj4';

const REPO_URL = 'https://github.com/ckelsoe/obsidian-vault-performance';

export class VaultPerformanceSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: Plugin,
	) {
		super(app, plugin);
	}

	override getSettingDefinitions(): SettingDefinition[] {
		return [
			{
				name: 'About',
				searchable: false,
				render: (setting: Setting) => {
					this.renderFooter(setting);
				},
			},
		];
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
