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
	}
});
