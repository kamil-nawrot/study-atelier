import { SUPABASE_URL } from './fixtures.mjs';

const SHELL = new Set([
	'profiles',
	'review_counts',
	'learner_points',
	'unlock_exhibits',
	'exhibit_tiers',
	'point_events',
	'announcements'
]);

function resourceOf(url) {
	const rest = '/rest/v1/';
	return url.pathname.startsWith(rest) ? url.pathname.slice(rest.length) : url.pathname.slice(1);
}

export function logRequests(page) {
	const started = Date.now();
	const entries = [];
	const pending = [];
	let phase = 'load';
	page.on('requestfinished', (request) => {
		const url = new URL(request.url());
		if (url.origin !== SUPABASE_URL || request.method() === 'OPTIONS') return;
		const entry = {
			at: Date.now() - started,
			phase,
			part: SHELL.has(resourceOf(url).replace(/^rpc\//, '')) ? 'shell' : 'view',
			method: request.method(),
			resource: resourceOf(url),
			query: decodeURIComponent(url.search)
		};
		pending.push(
			request
				.response()
				.then((response) => response?.body())
				.catch(() => undefined)
				.then((body) => entries.push({ ...entry, bytes: body?.length ?? 0 }))
		);
	});
	return {
		setPhase(next) {
			phase = next;
		},
		async finish() {
			await Promise.all(pending);
			return entries.sort((a, b) => a.at - b.at);
		}
	};
}

function kilobytes(bytes) {
	return `${(bytes / 1024).toFixed(1)} kB`;
}

function line(label, rows) {
	const bytes = rows.reduce((sum, row) => sum + row.bytes, 0);
	return `${label}: ${rows.length} requests, ${kilobytes(bytes)}`;
}

export function summarise(viewport, entries) {
	const lines = [];
	for (const phase of ['load', 'steps']) {
		const rows = entries.filter((entry) => entry.phase === phase);
		if (rows.length === 0) continue;
		lines.push(line(`${viewport} ${phase}`, rows));
		for (const part of ['shell', 'view']) {
			const partRows = rows.filter((entry) => entry.part === part);
			if (partRows.length === 0) continue;
			lines.push(`  ${line(part, partRows)}`);
			const counts = new Map();
			for (const row of partRows) {
				const key = `${row.method} ${row.resource}`;
				const kept = counts.get(key) ?? { count: 0, bytes: 0 };
				counts.set(key, { count: kept.count + 1, bytes: kept.bytes + row.bytes });
			}
			for (const [key, { count, bytes }] of counts) {
				lines.push(`    ${String(count).padStart(2)} x ${key} (${kilobytes(bytes)})`);
			}
		}
	}
	return `${lines.join('\n')}\n`;
}
