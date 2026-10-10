import { readFile, writeFile } from 'node:fs/promises';
import { buildCss } from './tokens.ts';

const source = new URL('../../../design/tokens.json', import.meta.url);
const target = new URL('../src/lib/styles/tokens.css', import.meta.url);

const css = buildCss(JSON.parse(await readFile(source, 'utf8')));

if (process.argv.includes('--check')) {
	const current = await readFile(target, 'utf8').catch(() => '');
	if (current !== css) {
		console.error('tokens.css is out of date. Run `pnpm --filter @study-atelier/ui tokens`.');
		process.exit(1);
	}
} else {
	await writeFile(target, css);
}
