import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const allowedMail = /@(example\.(com|org|test)|przyklad\.pl)$|^noreply@/i;
const mail = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const link = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const problems = [];

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
	.split('\0')
	.filter((file) => file && existsSync(file));

function read(file) {
	return readFileSync(file, 'utf8');
}

function checkLinks(file) {
	const text = read(file).replace(/```[\s\S]*?```/g, '');
	for (const [, target] of text.matchAll(link)) {
		if (/^([a-z]+:|#|\/)/i.test(target)) continue;
		const resolved = path.join(path.dirname(file), decodeURIComponent(target.split('#')[0]));
		if (!existsSync(resolved)) problems.push(`${file}: the link ${target} leads nowhere`);
	}
}

function checkDecisions() {
	const decisions = tracked.filter((file) => /^docs\/decisions\/\d{4}-.+\.md$/.test(file));
	const index = read('docs/decisions/README.md');
	const seen = new Map();
	for (const file of decisions) {
		const name = path.basename(file);
		const number = name.slice(0, 4);
		if (seen.has(number))
			problems.push(`${file}: ADR number ${number} is also used by ${seen.get(number)}`);
		seen.set(number, file);
		if (!index.includes(`(${name})`))
			problems.push(`${file}: missing from docs/decisions/README.md`);
	}
}

function checkMail(file) {
	if (/(^|\/)pnpm-lock\.yaml$|\.(png|jpe?g|gif|webp|svg|ico|woff2?|zip|pdf)$/i.test(file)) return;
	for (const address of read(file).match(mail) ?? []) {
		if (!allowedMail.test(address)) problems.push(`${file}: e-mail address ${address}`);
	}
}

for (const file of tracked.filter(
	(candidate) => candidate.endsWith('.md') && !candidate.endsWith('/template.md')
)) {
	checkLinks(file);
}
checkDecisions();
for (const file of tracked) checkMail(file);

if (problems.length > 0) {
	console.error(problems.join('\n'));
	console.error(`\n${problems.length} documentation problems`);
	process.exitCode = 1;
}
