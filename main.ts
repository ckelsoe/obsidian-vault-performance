import { Notice, Plugin } from 'obsidian';

import { REPORT_VIEW_TYPE, ReportView } from './report-view';
import { normalizeSettings, type VaultPerformanceSettings } from './settings';
import { VaultPerformanceSettingTab } from './settings-tab';

// Wiring only. Measurement lives in its own service modules as they land; see
// the build plan for the order.
export default class VaultPerformancePlugin extends Plugin {
	settings: VaultPerformanceSettings = normalizeSettings(null);

	get pluginVersion(): string {
		return this.manifest.version;
	}

	override async onload(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
		this.registerView(
			REPORT_VIEW_TYPE,
			(leaf) => new ReportView(leaf, this),
		);
		this.addCommand({
			id: 'open-report',
			name: 'Open vault snapshot',
			callback: () => {
				this.runGuarded('Opening the vault snapshot', () =>
					this.openReport(),
				);
			},
		});
		this.addSettingTab(new VaultPerformanceSettingTab(this.app, this));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		for (const leaf of this.app.workspace.getLeavesOfType(
			REPORT_VIEW_TYPE,
		)) {
			if (leaf.view instanceof ReportView) await leaf.view.refresh();
		}
	}

	private async openReport(): Promise<void> {
		const existing =
			this.app.workspace.getLeavesOfType(REPORT_VIEW_TYPE)[0];
		const leaf = existing ?? this.app.workspace.getLeaf('tab');
		if (existing === undefined) {
			await leaf.setViewState({ type: REPORT_VIEW_TYPE, active: true });
		} else if (leaf.view instanceof ReportView) {
			await leaf.view.refresh();
		}
		await this.app.workspace.revealLeaf(leaf);
	}

	private runGuarded(what: string, run: () => Promise<void>): void {
		run().catch((err: unknown) => {
			console.error(`Vault Performance: ${what} failed`, err);
			new Notice(`${what} failed. See the developer console.`);
		});
	}
}
