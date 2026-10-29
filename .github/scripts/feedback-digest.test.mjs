import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { digestBody, digestMessage, feedbackApi, sendDigest } from './feedback-digest.mjs';

const report = {
	id: 'report-1',
	kind: 'bug',
	title: 'Nie zapisuje się dzieło',
	description: 'Po kliknięciu „Zapisz” nic się nie dzieje.',
	browser: 'Mozilla/5.0 Firefox/140.0',
	owner_id: 'learner-1',
	created_at: '2026-10-27T08:00:00+00:00'
};

function fakeApi(reports) {
	const marked = [];
	return {
		marked,
		unnotified: async () => reports,
		markNotified: async (ids, notifiedAt) => marked.push({ ids, notifiedAt })
	};
}

function decodedBody(message) {
	const [, body] = message.split('\r\n\r\n');
	return Buffer.from(body.replaceAll('\r\n', ''), 'base64').toString();
}

describe('sendDigest', () => {
	it('sends one mail for the new reports and marks them as sent', async () => {
		const api = fakeApi([report, { ...report, id: 'report-2', kind: 'idea' }]);
		const sent = [];
		const now = () => new Date('2026-10-27T09:17:00Z');

		const result = await sendDigest(api, async (message) => sent.push(message), {
			log: () => {},
			now
		});

		assert.deepEqual(result, { sent: 2 });
		assert.equal(sent.length, 1);
		assert.deepEqual(api.marked, [
			{ ids: ['report-1', 'report-2'], notifiedAt: '2026-10-27T09:17:00.000Z' }
		]);
	});

	it('sends nothing when there is no new report', async () => {
		const api = fakeApi([]);

		const result = await sendDigest(api, async () => assert.fail('no mail'), { log: () => {} });

		assert.deepEqual(result, { sent: 0 });
		assert.deepEqual(api.marked, []);
	});

	it('keeps the reports unsent when the mail fails', async () => {
		const api = fakeApi([report]);

		await assert.rejects(
			sendDigest(
				api,
				async () => {
					throw new Error('smtp down');
				},
				{ log: () => {} }
			),
			/smtp down/
		);
		assert.deepEqual(api.marked, []);
	});

	it('logs only the counts, never what the learner wrote', async () => {
		const lines = [];

		await sendDigest(fakeApi([report]), async () => {}, { log: (line) => lines.push(line) });

		assert.deepEqual(lines, ['New reports: 1', 'Sent: 1']);
	});
});

describe('digestMessage', () => {
	it('carries every report with its kind, time, account and browser in UTF-8', () => {
		const message = digestMessage([report], { date: new Date('2026-10-27T09:17:00Z') });

		assert.match(message, /^From: Study Atelier <kontakt@studyatelier\.art>\r\n/);
		assert.match(message, /\r\nTo: kontakt@studyatelier\.art\r\n/);
		assert.match(message, /\r\nContent-Type: text\/plain; charset=UTF-8\r\n/);
		assert.equal(decodedBody(message), digestBody([report]));
		assert.match(
			decodedBody(message),
			/^Błąd: Nie zapisuje się dzieło\nWysłano: 27 października 2026 09:00\n/
		);
		assert.match(decodedBody(message), /Konto: learner-1\nPrzeglądarka: Mozilla/);
	});

	it('names the number of reports in Polish in the subject', () => {
		const subject = (count) => {
			const message = digestMessage(Array.from({ length: count }, () => report));
			const encoded = message.match(/Subject: =\?UTF-8\?B\?(.+)\?=/)[1];
			return Buffer.from(encoded, 'base64').toString();
		};

		assert.equal(subject(1), 'Study Atelier: 1 nowe zgłoszenie');
		assert.equal(subject(3), 'Study Atelier: 3 nowe zgłoszenia');
		assert.equal(subject(5), 'Study Atelier: 5 nowych zgłoszeń');
		assert.equal(subject(12), 'Study Atelier: 12 nowych zgłoszeń');
		assert.equal(subject(22), 'Study Atelier: 22 nowe zgłoszenia');
	});
});

describe('feedbackApi', () => {
	it('reads the unsent reports and marks them with the secret key', async () => {
		const calls = [];
		const fetch = async (url, init = {}) => {
			calls.push({ url, method: init.method ?? 'GET', headers: init.headers, body: init.body });
			return { ok: true, json: async () => [report] };
		};
		const api = feedbackApi({ url: 'https://project.supabase.co', key: 'secret', fetch });

		assert.deepEqual(await api.unnotified(), [report]);
		await api.markNotified(['report-1', 'report-2'], '2026-10-27T09:17:00.000Z');

		assert.match(
			calls[0].url,
			/\/rest\/v1\/feedback\?select=.*&notified_at=is\.null&order=created_at/
		);
		assert.equal(calls[0].headers.apikey, 'secret');
		assert.equal(
			calls[1].url,
			'https://project.supabase.co/rest/v1/feedback?id=in.(report-1,report-2)'
		);
		assert.equal(calls[1].method, 'PATCH');
		assert.equal(calls[1].body, JSON.stringify({ notified_at: '2026-10-27T09:17:00.000Z' }));
	});
});
