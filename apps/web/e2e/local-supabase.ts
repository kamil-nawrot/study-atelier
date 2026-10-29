import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

type LocalSupabase = {
	url: string;
	publishableKey: string;
	serviceRoleKey: string;
};

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

const NOT_RUNNING =
	'The end-to-end tests need a local Supabase. Start it with `pnpm exec supabase start` from the repository root.';

function readStatus(): Record<string, string> {
	try {
		const output = execFileSync('pnpm', ['exec', 'supabase', 'status', '--output', 'json'], {
			cwd: ROOT,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		});
		return JSON.parse(output) as Record<string, string>;
	} catch {
		throw new Error(NOT_RUNNING);
	}
}

export function localSupabase(): LocalSupabase {
	const status = readStatus();
	if (!status.API_URL || !status.PUBLISHABLE_KEY || !status.SERVICE_ROLE_KEY) {
		throw new Error(NOT_RUNNING);
	}
	return {
		url: status.API_URL,
		publishableKey: status.PUBLISHABLE_KEY,
		serviceRoleKey: status.SERVICE_ROLE_KEY
	};
}
