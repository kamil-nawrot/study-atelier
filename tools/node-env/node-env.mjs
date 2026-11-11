import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export function nodeEnv(root) {
	const wanted = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim().split('.')[0];
	const current = process.versions.node.split('.')[0];
	if (wanted === current) return { env: process.env, note: `Node ${process.versions.node}` };
	const versions = path.join(homedir(), '.nvm', 'versions', 'node');
	const match = existsSync(versions)
		? readdirSync(versions)
				.filter((name) => name.startsWith(`v${wanted}.`))
				.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
				.at(-1)
		: undefined;
	if (!match) {
		return {
			env: process.env,
			note: `Node ${process.versions.node}; no Node ${wanted} in ~/.nvm, so some steps may fail`
		};
	}
	const bin = path.join(versions, match, 'bin');
	return {
		env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
		note: `Node ${match.slice(1)} from ~/.nvm`
	};
}
