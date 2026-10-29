import { describe, expect, it } from 'vitest';
import { LEGAL_VERSION, isCurrentLegalVersion, legalVersionDate } from './version.ts';

describe('legal version', () => {
	it('writes a version as a Polish date', () => {
		expect(legalVersionDate('2026-10-26')).toBe('26.10.2026');
	});

	it('treats only the current version as accepted', () => {
		expect(isCurrentLegalVersion(LEGAL_VERSION)).toBe(true);
		expect(isCurrentLegalVersion('2020-01-01')).toBe(false);
		expect(isCurrentLegalVersion(null)).toBe(false);
		expect(isCurrentLegalVersion(undefined)).toBe(false);
	});
});
