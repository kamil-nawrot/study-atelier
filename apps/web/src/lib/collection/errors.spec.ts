import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { artworkErrorMessage, collectionErrorMessage } from './errors.ts';

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

describe('artworkErrorMessage', () => {
	it('says the artwork is missing when the database finds nothing to update', () => {
		expect(artworkErrorMessage({ code: 'P0002', message: 'artwork not found' })).toBe(
			m.artworkErrors.notFound
		);
	});

	it('asks to check the fields when a database rule rejects them', () => {
		expect(artworkErrorMessage({ code: '23514', message: 'check violation' })).toBe(
			m.artworkErrors.invalid
		);
		expect(artworkErrorMessage({ code: '23502', message: 'not null violation' })).toBe(
			m.artworkErrors.invalid
		);
	});

	it('explains a failed connection', () => {
		expect(artworkErrorMessage({ code: '', message: 'TypeError: Failed to fetch' })).toBe(
			m.artworkErrors.network
		);
	});

	it('falls back to the general message', () => {
		expect(artworkErrorMessage({ code: '42501', message: 'permission denied' })).toBe(
			m.common.unexpectedError
		);
	});
});
