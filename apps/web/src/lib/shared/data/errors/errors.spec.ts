import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { reportError } from '#lib/shared/monitoring/monitoring.ts';
import { errorMessages, isNetworkError, rowLimitMessage } from './errors.ts';

vi.mock('#lib/shared/monitoring/monitoring.ts', () => ({ reportError: vi.fn() }));

const messageOf = errorMessages({ P0002: 'Not found.' }, 'Offline.');

beforeEach(() => {
	vi.mocked(reportError).mockClear();
});

describe('errorMessages', () => {
	it('reports only the errors it has no message for', () => {
		const unknown = { code: 'XX000', message: 'internal error' };
		expect(messageOf(unknown)).toBe(m.common.unexpectedError);
		expect(reportError).toHaveBeenCalledWith(unknown);

		vi.mocked(reportError).mockClear();
		messageOf({ code: 'P0002', message: 'no rows' });
		messageOf({ message: 'TypeError: Failed to fetch' });
		messageOf({ code: '53400', hint: 'artworks' });
		expect(reportError).not.toHaveBeenCalled();
	});

	it('picks the message of a known code', () => {
		expect(messageOf({ code: 'P0002', message: 'no rows' })).toBe('Not found.');
	});

	it('gives the network message for the offline errors of Safari and Firefox and an abort', () => {
		expect(messageOf({ message: 'TypeError: Load failed' })).toBe('Offline.');
		expect(
			messageOf({ message: 'TypeError: NetworkError when attempting to fetch resource.' })
		).toBe('Offline.');
		expect(messageOf({ message: 'AbortError: signal is aborted without reason' })).toBe('Offline.');
		expect(reportError).not.toHaveBeenCalled();
	});

	it('gives the network message for a failed fetch without a code', () => {
		expect(messageOf({ message: 'TypeError: Failed to fetch' })).toBe('Offline.');
		expect(isNetworkError({ message: 'Failed to fetch' })).toBe(true);
	});

	it('names the limit of the table the database refused a row in', () => {
		expect(messageOf({ code: '53400', hint: 'artworks' })).toBe(m.limits.artworks(5000));
		expect(messageOf({ code: '53400', hint: 'review_log' })).toBe(m.limits.reviewAnswers(1000));
	});

	it('lets a module table override the limit message', () => {
		const importMessage = errorMessages({ '53400': 'Too big.' }, 'Offline.');
		expect(importMessage({ code: '53400', hint: 'artworks' })).toBe('Too big.');
	});

	it('does not read a limit from an unknown table or another code', () => {
		expect(rowLimitMessage({ code: '53400', hint: 'constructor' })).toBeUndefined();
		expect(rowLimitMessage({ code: '53400' })).toBeUndefined();
		expect(rowLimitMessage({ code: '23514', hint: 'artworks' })).toBeUndefined();
	});

	it('falls back to the general message for anything else', () => {
		expect(messageOf({ code: '42501', message: 'permission denied' })).toBe(
			m.common.unexpectedError
		);
		expect(messageOf({ code: 'constructor' })).toBe(m.common.unexpectedError);
		expect(messageOf({})).toBe(m.common.unexpectedError);
	});
});
