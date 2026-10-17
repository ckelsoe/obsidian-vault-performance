import {
	DEFAULT_SETTINGS,
	isValidThreshold,
	normalizeSettings,
} from '../settings';

describe('normalizeSettings', () => {
	it('returns the defaults for a first run', () => {
		expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings('junk')).toEqual(DEFAULT_SETTINGS);
	});

	it('keeps well-formed stored values', () => {
		expect(
			normalizeSettings({ includePaths: true, largeNoteMb: 2.5 }),
		).toEqual({ includePaths: true, largeNoteMb: 2.5 });
	});

	it('replaces malformed values with defaults and drops unknown keys', () => {
		expect(
			normalizeSettings({
				includePaths: 'yes',
				largeNoteMb: -1,
				stale: 1,
			}),
		).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings({ largeNoteMb: Number.NaN })).toEqual(
			DEFAULT_SETTINGS,
		);
		expect(normalizeSettings({ largeNoteMb: '3' })).toEqual(
			DEFAULT_SETTINGS,
		);
	});

	it('does not share the defaults object', () => {
		const settings = normalizeSettings(null);
		settings.includePaths = true;
		expect(DEFAULT_SETTINGS.includePaths).toBe(false);
	});
});

describe('isValidThreshold', () => {
	it.each([
		[1, true],
		[0.01, true],
		[0, false],
		[-2, false],
		[Number.POSITIVE_INFINITY, false],
		[Number.NaN, false],
		['1', false],
	])('%p -> %p', (value, expected) => {
		expect(isValidThreshold(value)).toBe(expected);
	});
});
