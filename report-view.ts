import {
	Component,
	ItemView,
	MarkdownRenderer,
	Notice,
	normalizePath,
	type WorkspaceLeaf,
} from 'obsidian';

import { buildReport, formatTimestamp } from './report';
import type { VaultPerformanceSettings } from './settings';
import { type Snapshot, takeSnapshot } from './snapshot';

export const REPORT_VIEW_TYPE = 'vault-performance-report';

export interface ReportHost {
	readonly settings: VaultPerformanceSettings;
	readonly pluginVersion: string;
}

// The report in a tab. The tab shows real note paths, since it never leaves
// the device; copied and saved reports follow the include-paths setting.
export class ReportView extends ItemView {
	private snapshot: Snapshot | null = null;
	// Owns the rendered Markdown's children, replaced on every render so old
	// renders are unloaded rather than piling up on the view.
	private rendered: Component | null = null;
	private bodyEl: HTMLElement | null = null;
	private privacyEl: HTMLElement | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly host: ReportHost,
	) {
		super(leaf);
	}

	override getViewType(): string {
		return REPORT_VIEW_TYPE;
	}

	override getDisplayText(): string {
		return 'Vault performance';
	}

	override getIcon(): string {
		return 'gauge';
	}

	override async onOpen(): Promise<void> {
		const root = this.contentEl;
		root.empty();
		root.addClass('vault-performance-report');
		const toolbar = root.createDiv({ cls: 'vault-performance-toolbar' });
		this.addButton(toolbar, 'Refresh', 'Take a new snapshot', () =>
			this.refresh(),
		);
		this.addButton(
			toolbar,
			'Copy report',
			'Copy the report to the clipboard as Markdown',
			() => this.copyReport(),
		);
		this.addButton(
			toolbar,
			'Save report as note',
			'Save the report as a new note in the vault root',
			() => this.saveReport(),
		);
		this.privacyEl = root.createDiv({ cls: 'vault-performance-privacy' });
		this.bodyEl = root.createDiv({ cls: 'vault-performance-body' });
		await this.refresh();
	}

	override async onClose(): Promise<void> {
		this.clearRendered();
		this.bodyEl = null;
		this.privacyEl = null;
		this.snapshot = null;
		return Promise.resolve();
	}

	// Takes a new snapshot and renders it. Also called when settings change,
	// so the threshold and privacy line never show stale values.
	async refresh(): Promise<void> {
		const body = this.bodyEl;
		if (body === null) return;
		this.snapshot = takeSnapshot(
			this.app,
			this.host.settings,
			this.host.pluginVersion,
		);
		this.privacyEl?.setText(
			this.host.settings.includePaths
				? 'Copied and saved reports include note paths. You can turn this off in the plugin settings.'
				: 'Copied and saved reports hide note paths. You can turn this on in the plugin settings.',
		);
		this.clearRendered();
		body.empty();
		const component = new Component();
		this.rendered = component;
		this.addChild(component);
		const markdown = buildReport(
			this.snapshot.inventory,
			this.snapshot.meta,
			{ includePaths: true },
		);
		// A fresh target per render: if a newer refresh empties the body while
		// this render is still in flight, it finishes into a detached element
		// instead of appending a second copy of the report.
		const target = body.createDiv();
		await MarkdownRenderer.render(
			this.app,
			markdown,
			target,
			'',
			component,
		);
	}

	private clearRendered(): void {
		if (this.rendered !== null) {
			this.removeChild(this.rendered);
			this.rendered = null;
		}
	}

	private shareableReport(): string | null {
		if (this.snapshot === null) return null;
		return buildReport(this.snapshot.inventory, this.snapshot.meta, {
			includePaths: this.host.settings.includePaths,
		});
	}

	private async copyReport(): Promise<void> {
		const text = this.shareableReport();
		if (text === null) return;
		await navigator.clipboard.writeText(text);
		new Notice('Report copied.');
	}

	private async saveReport(): Promise<void> {
		const text = this.shareableReport();
		if (text === null || this.snapshot === null) return;
		const stamp = formatTimestamp(this.snapshot.meta.generatedAt).replace(
			':',
			'',
		);
		const base = `Vault performance report ${stamp}`;
		let path = normalizePath(`${base}.md`);
		for (let i = 2; this.app.vault.getAbstractFileByPath(path); i++) {
			path = normalizePath(`${base} ${i}.md`);
		}
		const file = await this.app.vault.create(path, text);
		await this.app.workspace.getLeaf('tab').openFile(file);
		new Notice(`Report saved to ${file.path}.`);
	}

	private addButton(
		parent: HTMLElement,
		text: string,
		label: string,
		run: () => Promise<void>,
	): void {
		const button = parent.createEl('button', {
			text,
			attr: { 'aria-label': label },
		});
		// Single flight: the button is disabled until its run settles, so a
		// double click cannot, for example, race two saves to the same name.
		this.registerDomEvent(button, 'click', () => {
			if (button.disabled) return;
			button.disabled = true;
			run()
				.catch((err: unknown) => {
					console.error(`Vault Performance: ${text} failed`, err);
					new Notice(`${text} failed. See the developer console.`);
				})
				.finally(() => {
					button.disabled = false;
				});
		});
	}
}
