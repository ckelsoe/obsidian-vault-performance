import { Plugin } from 'obsidian';

import { VaultPerformanceSettingTab } from './settings-tab';

// Wiring only. Measurement lives in its own service modules as they land; see
// the build plan for the order.
export default class VaultPerformancePlugin extends Plugin {
	override onload(): void {
		this.addSettingTab(new VaultPerformanceSettingTab(this.app, this));
	}
}
