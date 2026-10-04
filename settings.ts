export interface VaultPerformanceSettings {
	// Paths can be personal (a note named after a diagnosis, a client, a
	// person), so copied and saved reports label notes "Note 1", "Note 2"
	// unless the user turns this on.
	includePaths: boolean;
	// A note at or above this size is listed as large.
	largeNoteMb: number;
}

export const DEFAULT_SETTINGS: VaultPerformanceSettings = {
	includePaths: false,
	largeNoteMb: 1,
};

// Accepts whatever loadData() returned (null on first run, or data from an
// older or hand-edited data.json) and keeps only well-formed values.
export function normalizeSettings(raw: unknown): VaultPerformanceSettings {
	const settings = { ...DEFAULT_SETTINGS };
	if (typeof raw !== 'object' || raw === null) return settings;
	const record = raw as Record<string, unknown>;
	if (typeof record.includePaths === 'boolean') {
		settings.includePaths = record.includePaths;
	}
	if (isValidThreshold(record.largeNoteMb)) {
		settings.largeNoteMb = record.largeNoteMb;
	}
	return settings;
}

export function isValidThreshold(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
