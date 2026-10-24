import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { authErrorMessage } from './errors.ts';

describe('authErrorMessage', () => {
	it('maps known Supabase error codes', () => {
		expect(authErrorMessage({ code: 'invalid_credentials', status: 400 })).toBe(
			m.authErrors.invalidCredentials
		);
		expect(authErrorMessage({ code: 'over_email_send_rate_limit', status: 429 })).toBe(
			m.authErrors.emailRateLimited
		);
	});

	it('reports network failures', () => {
		expect(authErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(
			m.authErrors.network
		);
	});

	it('treats an unknown 429 as rate limiting', () => {
		expect(authErrorMessage({ code: 'something_new', status: 429 })).toBe(m.authErrors.rateLimited);
	});

	it('falls back to a generic message', () => {
		expect(authErrorMessage({ code: 'unexpected_failure', status: 500 })).toBe(
			m.common.unexpectedError
		);
	});
});
