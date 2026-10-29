import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DIGEST_ADDRESS = 'kontakt@studyatelier.art';
export const SMTP_URL = 'smtp://smtp.tem.scaleway.com:587';
export const MAX_REPORTS = 50;

const KINDS = { bug: 'Błąd', idea: 'Pomysł' };
const SENT_AT = new Intl.DateTimeFormat('pl-PL', {
	dateStyle: 'long',
	timeStyle: 'short',
	timeZone: 'Europe/Warsaw'
});

export function feedbackApi({ url, key, fetch = globalThis.fetch }) {
	async function call(path, init = {}) {
		const response = await fetch(`${url}/rest/v1${path}`, {
			...init,
			headers: { apikey: key, 'Content-Type': 'application/json', ...init.headers }
		});
		if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${response.status}`);
		return response;
	}

	return {
		async unnotified() {
			const response = await call(
				'/feedback?select=id,kind,title,description,browser,owner_id,created_at' +
					`&notified_at=is.null&order=created_at&limit=${MAX_REPORTS}`
			);
			return response.json();
		},
		async markNotified(ids, notifiedAt) {
			await call(`/feedback?id=in.(${ids.join(',')})`, {
				method: 'PATCH',
				headers: { Prefer: 'return=minimal' },
				body: JSON.stringify({ notified_at: notifiedAt })
			});
		}
	};
}

function encodedHeader(text) {
	return `=?UTF-8?B?${Buffer.from(text).toString('base64')}?=`;
}

function reportCount(count) {
	if (count === 1) return '1 nowe zgłoszenie';
	const lastDigit = count % 10;
	const lastTwo = count % 100;
	const few = lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14);
	return `${count} ${few ? 'nowe zgłoszenia' : 'nowych zgłoszeń'}`;
}

export function digestBody(reports) {
	return reports
		.map((report) =>
			[
				`${KINDS[report.kind] ?? report.kind}: ${report.title}`,
				`Wysłano: ${SENT_AT.format(new Date(report.created_at))}`,
				`Konto: ${report.owner_id}`,
				`Przeglądarka: ${report.browser ?? 'nieznana'}`,
				'',
				report.description ?? '(bez opisu)'
			].join('\n')
		)
		.join('\n\n---\n\n');
}

export function digestMessage(reports, { date = new Date() } = {}) {
	const body = Buffer.from(digestBody(reports)).toString('base64');
	return [
		`From: Study Atelier <${DIGEST_ADDRESS}>`,
		`To: ${DIGEST_ADDRESS}`,
		`Subject: ${encodedHeader(`Study Atelier: ${reportCount(reports.length)}`)}`,
		`Date: ${date.toUTCString()}`,
		'MIME-Version: 1.0',
		'Content-Type: text/plain; charset=UTF-8',
		'Content-Transfer-Encoding: base64',
		'',
		...(body.match(/.{1,76}/g) ?? []),
		''
	].join('\r\n');
}

export async function sendDigest(api, send, { log = console.log, now = () => new Date() } = {}) {
	const reports = await api.unnotified();
	log(`New reports: ${reports.length}`);
	if (reports.length === 0) return { sent: 0 };
	await send(digestMessage(reports, { date: now() }));
	await api.markNotified(
		reports.map((report) => report.id),
		now().toISOString()
	);
	log(`Sent: ${reports.length}`);
	return { sent: reports.length };
}

export function smtpSender({ username, password }) {
	return async (message) => {
		const folder = await mkdtemp(join(tmpdir(), 'feedback-digest-'));
		const config = join(folder, 'curl.conf');
		try {
			await writeFile(config, `user = "${username}:${password}"\n`, { mode: 0o600 });
			await new Promise((resolve, reject) => {
				const curl = spawn(
					'curl',
					[
						'--silent',
						'--show-error',
						'--ssl-reqd',
						'--config',
						config,
						'--url',
						SMTP_URL,
						'--mail-from',
						DIGEST_ADDRESS,
						'--mail-rcpt',
						DIGEST_ADDRESS,
						'--upload-file',
						'-'
					],
					{ stdio: ['pipe', 'ignore', 'inherit'] }
				);
				curl.on('error', reject);
				curl.on('close', (code) =>
					code === 0 ? resolve() : reject(new Error(`curl exited with ${code}`))
				);
				curl.stdin.end(message);
			});
		} finally {
			await rm(folder, { recursive: true, force: true });
		}
	};
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const api = feedbackApi({
		url: process.env.SUPABASE_URL,
		key: process.env.SUPABASE_SECRET_KEY
	});
	const send = smtpSender({
		username: process.env.SMTP_USERNAME,
		password: process.env.SMTP_PASSWORD
	});
	await sendDigest(api, send);
}
