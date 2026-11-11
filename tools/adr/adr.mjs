import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { indexProblems, parseIndex, readAdrs, renderIndex } from './adr-index.mjs';

const USAGE = `Usage:
  pnpm adr                 list the areas with their number of ADRs
  pnpm adr <area>          list the ADRs of an area, fully superseded ones last
  pnpm adr:index           rewrite the titles and statuses of the index from the ADRs and add new ADRs`;

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const dir = path.join(root, 'docs', 'decisions');
const indexFile = path.join(dir, 'README.md');
const [command] = process.argv.slice(2);
const text = readFileSync(indexFile, 'utf8');
const adrs = readAdrs(dir);
const { areas, rows } = parseIndex(text);

function superseded(status) {
	return /^superseded/i.test(status);
}

if (command === '--index') {
	writeFileSync(indexFile, renderIndex(text, adrs));
	execFileSync('pnpm', ['exec', 'prettier', '--write', indexFile], { cwd: root, stdio: 'ignore' });
	const problems = indexProblems(readFileSync(indexFile, 'utf8'), adrs);
	console.log(problems.length === 0 ? 'The index matches the ADRs.' : problems.join('\n'));
	process.exitCode = problems.length === 0 ? 0 : 1;
} else if (!command) {
	for (const area of areas) {
		const count = [...rows.values()].filter((row) => row.area === area).length;
		console.log(`${area.padEnd(16)} ${count}`);
	}
} else if (areas.includes(command)) {
	const own = adrs.filter((adr) => rows.get(adr.number)?.area === command);
	const ordered = [
		...own.filter((adr) => !superseded(adr.status)),
		...own.filter((adr) => superseded(adr.status))
	];
	for (const adr of ordered) {
		console.log(
			`${adr.number}  ${adr.title}  [${adr.status.replace(/\[(\d{4})\]\([^)]*\)/g, '$1')}]`
		);
		console.log(`      docs/decisions/${adr.file}`);
	}
} else {
	console.error(`${command} is not an area. ${USAGE}`);
	process.exitCode = 1;
}
