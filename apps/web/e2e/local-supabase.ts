import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

type LocalSupabase = {
	url: string;
	publishableKey: string;
	serviceRoleKey: string;
};

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

export function localSupabase(): LocalSupabase {
	const output = execFileSync('pnpm', ['exec', 'supabase', 'status', '--output', 'json'], {
		cwd: ROOT,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore']
	});
	const status = JSON.parse(output) as Record<string, string>;
	return {
		url: status.API_URL,
		publishableKey: status.PUBLISHABLE_KEY,
		serviceRoleKey: status.SERVICE_ROLE_KEY
	};
}
