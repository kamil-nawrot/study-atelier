import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { imageSearchErrorMessage } from './errors.ts';
import { WikimediaError } from './wikimedia.ts';

describe('imageSearchErrorMessage', () => {
	it('asks the learner to wait after a rate limit', () => {
		expect(imageSearchErrorMessage(new WikimediaError(429))).toBe(m.imageSearchErrors.rateLimited);
	});

	it('points at the connection when the service did not answer', () => {
		expect(imageSearchErrorMessage(new WikimediaError(null))).toBe(m.imageSearchErrors.network);
	});

	it('falls back to a general message', () => {
		expect(imageSearchErrorMessage(new WikimediaError(503))).toBe(m.imageSearchErrors.failed);
		expect(imageSearchErrorMessage(new SyntaxError('Unexpected token'))).toBe(
			m.imageSearchErrors.failed
		);
	});
});
