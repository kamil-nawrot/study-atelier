import { readFileSync } from 'node:fs';

const [config, file] = process.argv.slice(2);
const { total } = JSON.parse(readFileSync(file, 'utf8'));
const thresholds = readFileSync(config, 'utf8').match(/thresholds: \{([^}]*)\}/)?.[1] ?? '';
const raised = ['statements', 'branches', 'functions', 'lines'].flatMap((metric) => {
	const threshold = Number(thresholds.match(new RegExp(`${metric}: (\\d+)`))?.[1]);
	const reached = Math.floor(total[metric].pct);
	return reached > threshold ? [`${metric} ${threshold} -> ${reached}`] : [];
});

if (raised.length > 0) {
	console.error(
		`::error::Coverage rose above the thresholds in ${config}; raise them: ${raised.join(', ')}`
	);
	process.exitCode = 1;
}
