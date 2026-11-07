import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { ROW_LIMIT_CODE } from '#lib/shared/data/limits/limits.ts';
import { exhibitionErrorMessage, isRevisionConflict } from './errors.ts';

describe('exhibitionErrorMessage', () => {
	it('names the limit that was reached', () => {
		expect(
			exhibitionErrorMessage({ code: ROW_LIMIT_CODE, message: '', hint: 'exhibition_artworks' })
		).toBe(m.exhibitions.limits.artworks);
		expect(
			exhibitionErrorMessage({ code: ROW_LIMIT_CODE, message: '', hint: 'exhibition_blocks' })
		).toBe(m.exhibitions.limits.blocks);
	});

	it('tells that an exhibition is missing', () => {
		expect(exhibitionErrorMessage({ code: 'P0002', message: '' })).toBe(
			m.exhibitions.errors.notFound
		);
	});

	it('tells that a document cannot be saved', () => {
		expect(exhibitionErrorMessage({ code: '23514', message: '' })).toBe(
			m.exhibitions.errors.invalid
		);
	});
});

describe('isRevisionConflict', () => {
	it('recognises a save over a newer revision', () => {
		expect(isRevisionConflict({ code: '40001', message: '', hint: 'exhibition_revision' })).toBe(
			true
		);
	});

	it('ignores other serialization failures', () => {
		expect(isRevisionConflict({ code: '40001', message: '' })).toBe(false);
		expect(isRevisionConflict({ code: '23505', message: '', hint: 'exhibition_revision' })).toBe(
			false
		);
	});
});
