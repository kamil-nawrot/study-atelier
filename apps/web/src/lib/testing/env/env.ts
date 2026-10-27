import { vi } from 'vitest';

vi.mock('$app/env/public', () => ({
	SUPABASE_URL: 'https://abcd.supabase.co',
	SUPABASE_PUBLISHABLE_KEY: 'test-key',
	TURNSTILE_SITE_KEY: undefined,
	SENTRY_DSN: undefined,
	SENTRY_ENVIRONMENT: undefined,
	LEGAL_COMPANY: undefined,
	LEGAL_ADDRESS: undefined,
	LEGAL_NIP: undefined
}));
