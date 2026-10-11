import { AuthApiError, AuthRetryableFetchError, type Session } from '@supabase/supabase-js';

export const TEST_EMAIL = 'learner@example.com';

export function testSession(accessToken = 'access-token'): Session {
	return {
		access_token: accessToken,
		refresh_token: 'refresh-token',
		expires_in: 3600,
		token_type: 'bearer',
		user: {
			id: 'user-id',
			email: TEST_EMAIL,
			aud: 'authenticated',
			app_metadata: {},
			user_metadata: {},
			created_at: '2026-01-01T00:00:00Z'
		}
	};
}

export function apiError(code: string, status = 400): AuthApiError {
	return new AuthApiError(code, status, code);
}

export function networkError(): AuthRetryableFetchError {
	return new AuthRetryableFetchError('Failed to fetch', 0);
}

export function pending<T>(): Promise<T> {
	return new Promise<T>(() => {});
}
