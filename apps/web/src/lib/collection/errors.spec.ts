import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { collectionErrorMessage } from './errors.ts';

describe('collectionErrorMessage', () => {
	it('explains a failed connection', () => {
		expect(collectionErrorMessage({ code: '', message: 'TypeError: Failed to fetch' })).toBe(
			m.collectionErrors.network
		);
	});

	it('falls back to the general message', () => {
		expect(collectionErrorMessage({ code: '42501', message: 'permission denied' })).toBe(
			m.common.unexpectedError
		);
	});
});
