import { describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry/svelte';
import { asError, scrubBreadcrumb, scrubEvent, withoutEmails, withoutQuery } from './scrub.ts';

describe('withoutQuery', () => {
	it('drops the search and the hash that can hold what the learner typed', () => {
		expect(withoutQuery('https://abcd.supabase.co/rest/v1/artworks?title=ilike.*Mona*')).toBe(
			'https://abcd.supabase.co/rest/v1/artworks'
		);
		expect(withoutQuery('/atelier#notes')).toBe('/atelier');
		expect(withoutQuery('/atelier/12')).toBe('/atelier/12');
	});
});

describe('withoutEmails', () => {
	it('hides email addresses in a message', () => {
		expect(withoutEmails('No user learner.one@example.com found')).toBe('No user [email] found');
	});
});

describe('asError', () => {
	it('names a service error by its code and hides the quoted values of its message', () => {
		const error = asError({
			code: '22P02',
			message: 'invalid input syntax for type integer: "Mona Lisa"'
		});
		expect(error.name).toBe('22P02');
		expect(error.message).toBe('invalid input syntax for type integer: "…"');
	});

	it('keeps an error as it is', () => {
		const error = new TypeError('broken');
		expect(asError(error)).toBe(error);
	});
});

describe('scrubBreadcrumb', () => {
	it('keeps the requests and the navigation without their query', () => {
		expect(
			scrubBreadcrumb({
				category: 'fetch',
				data: { method: 'GET', status_code: 500, url: '/rest/v1/notes?body=secret', body: 'x' }
			})
		).toEqual({
			category: 'fetch',
			message: undefined,
			data: { method: 'GET', status_code: 500, url: '/rest/v1/notes' }
		});
	});

	it('drops the console and the clicks, which can quote what the learner wrote', () => {
		expect(scrubBreadcrumb({ category: 'console', message: 'Mona Lisa' })).toBeNull();
		expect(scrubBreadcrumb({ category: 'ui.click', message: 'img[alt="Mona Lisa"]' })).toBeNull();
	});
});

describe('scrubEvent', () => {
	it('keeps only the learner id, the address without its query and the error without emails', () => {
		const event = {
			type: undefined,
			user: { id: 'learner-1', email: 'learner@example.com', ip_address: '1.2.3.4' },
			request: { url: 'https://studyatelier.art/atelier?q=Vermeer', headers: { a: 'b' } },
			exception: { values: [{ type: 'Error', value: 'mail to learner@example.com failed' }] },
			extra: { note: 'private' }
		} as ErrorEvent;

		expect(scrubEvent(event)).toMatchObject({
			user: { id: 'learner-1' },
			request: { url: 'https://studyatelier.art/atelier' },
			exception: { values: [{ type: 'Error', value: 'mail to [email] failed' }] },
			extra: undefined
		});
		expect(scrubEvent(event).user).toEqual({ id: 'learner-1' });
		expect(scrubEvent(event).request).toEqual({ url: 'https://studyatelier.art/atelier' });
	});
});
