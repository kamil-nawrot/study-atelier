import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROW = /^\| \[(\d{4})\]\(([^)]+)\)\s*\|(.*)\|(.*)\|(.*)\|\s*$/;
const AREA = /^- `([a-z-]+)`: /;
const HEADER = ['| # | Decision | Area | Status |', '| --- | --- | --- | --- |'];

export function readAdrs(dir) {
	return readdirSync(dir)
		.filter((file) => /^\d{4}-.+\.md$/.test(file))
		.sort()
		.map((file) => {
			const text = readFileSync(path.join(dir, file), 'utf8');
			return {
				number: file.slice(0, 4),
				file,
				title: /^# \d{4}\. (.+)$/m.exec(text)?.[1].trim() ?? '',
				status: /^- Status: (.+)$/m.exec(text)?.[1].trim() ?? ''
			};
		});
}

export function parseIndex(text) {
	const lines = text.split('\n');
	const areas = lines.flatMap((line) => AREA.exec(line)?.[1] ?? []);
	const rows = new Map();
	for (const line of lines) {
		const row = ROW.exec(line);
		if (row) {
			rows.set(row[1], {
				file: row[2],
				title: row[3].trim(),
				area: row[4].trim(),
				status: row[5].trim()
			});
		}
	}
	return { areas, rows };
}

export function indexProblems(text, adrs) {
	const { areas, rows } = parseIndex(text);
	const problems = [];
	for (const adr of adrs) {
		const row = rows.get(adr.number);
		const where = `docs/decisions/README.md, ADR ${adr.number}`;
		if (!row) {
			problems.push(`docs/decisions/${adr.file}: missing from docs/decisions/README.md`);
			continue;
		}
		if (row.file !== adr.file) problems.push(`${where}: links ${row.file}, not ${adr.file}`);
		if (row.title !== adr.title)
			problems.push(`${where}: the title differs from the ADR's heading`);
		if (row.status !== adr.status)
			problems.push(`${where}: the status differs from the ADR's Status line`);
		if (!areas.includes(row.area))
			problems.push(`${where}: "${row.area}" is not one of the areas listed above the table`);
	}
	for (const number of rows.keys()) {
		if (!adrs.some((adr) => adr.number === number))
			problems.push(`docs/decisions/README.md: ADR ${number} has no file`);
	}
	return problems;
}

export function renderIndex(text, adrs) {
	const { rows } = parseIndex(text);
	const lines = text.split('\n');
	const start = lines.findIndex((line) => line.startsWith('| #'));
	let end = start;
	while (end < lines.length && lines[end].startsWith('|')) end += 1;
	const table = adrs.map(
		(adr) =>
			`| [${adr.number}](${adr.file}) | ${adr.title} | ${rows.get(adr.number)?.area || '?'} | ${adr.status} |`
	);
	return [...lines.slice(0, start), ...HEADER, ...table, ...lines.slice(end)].join('\n');
}
