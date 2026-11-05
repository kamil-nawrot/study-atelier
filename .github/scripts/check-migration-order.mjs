import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const MIGRATIONS = 'supabase/migrations';

export function outOfOrder(added, onBase, released = []) {
	const newest = onBase.toSorted().at(-1);
	if (!newest) return [];
	return added
		.filter((file) => file <= newest && !released.includes(file))
		.map(
			(file) =>
				`Migration ${file} is not newer than ${newest}, the newest on the base branch. Rename it to a later timestamp.`
		);
}

function git(...args) {
	return execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);
}

function names(paths) {
	return paths
		.map((file) => file.slice(MIGRATIONS.length + 1))
		.filter((file) => file.endsWith('.sql'));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const base = process.env.BASE_REF || 'develop';
	execFileSync('git', ['fetch', '--quiet', 'origin', `${base}:refs/remotes/origin/${base}`]);
	execFileSync('git', ['fetch', '--quiet', 'origin', 'main:refs/remotes/origin/main']);
	const added = names(
		git('diff', '--name-only', '--diff-filter=A', `origin/${base}...HEAD`, '--', MIGRATIONS)
	);
	const onBase = names(git('ls-tree', '--name-only', `origin/${base}`, `${MIGRATIONS}/`));
	const released = names(git('ls-tree', '--name-only', 'origin/main', `${MIGRATIONS}/`));
	const problems = outOfOrder(added, onBase, released);
	if (problems.length > 0) {
		console.error(problems.join('\n'));
		console.error('\nSee docs/guidelines/git-workflow.md');
		process.exitCode = 1;
	}
}
