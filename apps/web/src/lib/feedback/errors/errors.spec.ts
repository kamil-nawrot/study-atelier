import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { feedbackErrorMessage } from './errors.ts';

describe('feedbackErrorMessage', () => {
	it('maps constraint violations to the invalid message', () => {
		expect(feedbackErrorMessage({ code: '23514' })).toBe(m.feedback.errors.invalid);
		expect(feedbackErrorMessage({ code: '23502' })).toBe(m.feedback.errors.invalid);
	});

	it('maps a failed fetch to the network message', () => {
		expect(feedbackErrorMessage({ message: 'Failed to fetch' })).toBe(m.feedback.errors.network);
	});

	it('falls back to the unexpected error', () => {
		expect(feedbackErrorMessage({ code: 'XX000', message: 'boom' })).toBe(m.common.unexpectedError);
	});
});
