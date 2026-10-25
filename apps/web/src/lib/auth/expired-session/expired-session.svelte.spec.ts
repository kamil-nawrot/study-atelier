import { describe, expect, it } from 'vitest';
import { isAuthorizationError } from './expired-session.svelte.ts';

describe('isAuthorizationError', () => {
	it('recognises an invalid or expired token', () => {
		expect(isAuthorizationError({ code: 'PGRST301' })).toBe(true);
		expect(isAuthorizationError({ code: 'PGRST303' })).toBe(true);
		expect(isAuthorizationError({ status: 401 })).toBe(true);
	});

	it('leaves other errors alone', () => {
		expect(isAuthorizationError({ code: '23505' })).toBe(false);
		expect(isAuthorizationError({ code: '42501' })).toBe(false);
	});
});
