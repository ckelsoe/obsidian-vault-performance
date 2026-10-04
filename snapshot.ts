import { type App, apiVersion, Platform } from 'obsidian';

import {
	type FileEntry,
	type PluginEntry,
	summarizeInventory,
	type VaultInventory,
} from './inventory';
import type { ReportMeta } from './report';
import type { VaultPerformanceSettings } from './settings';

const TOP_COUNT = 10;

export interface Snapshot {
	inventory: VaultInventory;
	meta: ReportMeta;
}

function platformName(): string {
	if (Platform.isMacOS) return 'macOS';
	if (Platform.isWin) return 'Windows';
	if (Platform.isLinux) return 'Linux';
	return 'an unknown platform';
}

function enabledPlugins(app: App): {
	enabled: PluginEntry[];
	installed: number;
} {
	const manifests = app.plugins?.manifests ?? {};
	const ids = app.plugins?.enabledPlugins ?? new Set<string>();
	const enabled: PluginEntry[] = [];
	for (const id of ids) {
		const m = Object.prototype.hasOwnProperty.call(manifests, id)
			? manifests[id]
			: undefined;
		if (m === undefined) continue;
		// Manifests come from each plugin's own manifest.json, so a broken one
		// can carry a non-string name or version.
		enabled.push({
			id,
			name: typeof m.name === 'string' ? m.name : id,
			version: typeof m.version === 'string' ? m.version : 'unknown',
		});
	}
	return { enabled, installed: Object.keys(manifests).length };
}

// Reads file sizes from the vault index Obsidian already holds. No file is
// opened, so a snapshot is cheap even on a large vault.
export function takeSnapshot(
	app: App,
	settings: VaultPerformanceSettings,
	pluginVersion: string,
): Snapshot {
	const files: FileEntry[] = app.vault.getFiles().map((f) => ({
		path: f.path,
		extension: f.extension,
		size: f.stat.size,
	}));
	const { enabled, installed } = enabledPlugins(app);
	return {
		inventory: summarizeInventory(files, enabled, installed, {
			largeNoteBytes: settings.largeNoteMb * 1024 * 1024,
			topCount: TOP_COUNT,
		}),
		meta: {
			generatedAt: new Date(),
			obsidianVersion: apiVersion,
			pluginVersion,
			platform: platformName(),
		},
	};
}
