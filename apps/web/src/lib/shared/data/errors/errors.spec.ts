import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { errorMessages, isNetworkError } from './errors.ts';

const messageOf = errorMessages({ P0002: 'Not found.' }, 'Offline.');

describe('errorMessages', () => {
	it('picks the message of a known code', () => {
		expect(messageOf({ code: 'P0002', message: 'no rows' })).toBe('Not found.');
	});

	it('gives the network message for a failed fetch without a code', () => {
		expect(messageOf({ message: 'TypeError: Failed to fetch' })).toBe('Offline.');
		expect(isNetworkError({ message: 'Failed to fetch' })).toBe(true);
	});

	it('falls back to the general message for anything else', () => {
		expect(messageOf({ code: '42501', message: 'permission denied' })).toBe(
			m.common.unexpectedError
		);
		expect(messageOf({ code: 'constructor' })).toBe(m.common.unexpectedError);
		expect(messageOf({})).toBe(m.common.unexpectedError);
	});
});
