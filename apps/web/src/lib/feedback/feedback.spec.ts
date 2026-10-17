import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { emptyFeedback, hasFeedbackErrors, validateFeedback } from './feedback.ts';

describe('validateFeedback', () => {
	it('asks for the kind and the title of an empty draft', () => {
		const errors = validateFeedback(emptyFeedback);

		expect(errors).toEqual({
			kind: m.feedback.errors.kindRequired,
			title: m.feedback.errors.titleRequired
		});
		expect(hasFeedbackErrors(errors)).toBe(true);
	});

	it('treats a title of spaces as missing', () => {
		expect(validateFeedback({ kind: 'bug', title: '   ', description: '' }).title).toBe(
			m.feedback.errors.titleRequired
		);
	});

	it('accepts a draft without a description', () => {
		const errors = validateFeedback({ kind: 'idea', title: 'Dark mode', description: '' });

		expect(errors).toEqual({});
		expect(hasFeedbackErrors(errors)).toBe(false);
	});
});
