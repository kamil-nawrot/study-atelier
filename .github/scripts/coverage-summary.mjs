import { readFileSync } from 'node:fs';

const [title, file] = process.argv.slice(2);
const { total } = JSON.parse(readFileSync(file, 'utf8'));
const rows = ['lines', 'statements', 'branches', 'functions'].map(
	(metric) =>
		`| ${metric[0].toUpperCase()}${metric.slice(1)} | ${total[metric].pct}% | ${total[metric].covered} / ${total[metric].total} |`
);

console.log(
	[
		`### Test coverage: ${title}`,
		'',
		'| Metric | Covered | Count |',
		'| --- | --- | --- |',
		...rows,
		''
	].join('\n')
);
