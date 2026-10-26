import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	SUPABASE_URL: {
		public: true,
		static: true,
		description: 'URL of the Supabase project, for example https://abcd.supabase.co'
	},
	SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		static: true,
		description: 'Publishable (client) API key of the Supabase project'
	},
	LEGAL_COMPANY: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description: 'Business name of the service provider, shown in the terms and the privacy policy'
	},
	LEGAL_ADDRESS: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description:
			'Business address of the service provider, shown in the terms and the privacy policy'
	},
	LEGAL_NIP: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description:
			'Tax number (NIP) of the service provider, shown in the terms and the privacy policy'
	},
	TURNSTILE_SITE_KEY: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description: 'Cloudflare Turnstile site key; without it the auth forms show no captcha'
	}
});
