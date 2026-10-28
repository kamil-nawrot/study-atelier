import { describe, expect, it } from 'vitest';
import { defaultPreferences, preferencesChanged, QUIZ_KINDS, toggledKind } from './preferences.ts';

describe('preferences', () => {
	it('defaults to the numbers the reviews used before', () => {
		expect(defaultPreferences).toMatchObject({
			reviewSessionSize: 20,
			reviewNewPerDay: 10,
			reviewForm: 'mixed',
			reviewFree: true,
			viewShowPins: false,
			viewLoupeOn: false
		});
		expect(defaultPreferences.reviewQuizKinds).toEqual(QUIZ_KINDS);
	});

	it('compares only the fields of the tab that is open', () => {
		const changed = { ...defaultPreferences, viewLoupeOn: true };
		expect(preferencesChanged('view', changed, defaultPreferences)).toBe(true);
		expect(preferencesChanged('review', changed, defaultPreferences)).toBe(false);
	});

	it('compares the quiz kinds whatever their order', () => {
		const reordered = { ...defaultPreferences, reviewQuizKinds: [...QUIZ_KINDS].reverse() };
		expect(preferencesChanged('review', reordered, defaultPreferences)).toBe(false);
		const fewer = { ...defaultPreferences, reviewQuizKinds: ['quiz_style' as const] };
		expect(preferencesChanged('review', fewer, defaultPreferences)).toBe(true);
	});

	it('switches a quiz kind on and off in the order of the form', () => {
		expect(toggledKind(['quiz_pin', 'quiz_image'], 'quiz_title', true)).toEqual([
			'quiz_image',
			'quiz_title',
			'quiz_pin'
		]);
		expect(toggledKind([...QUIZ_KINDS], 'quiz_style', false)).toEqual([
			'quiz_image',
			'quiz_title',
			'quiz_author',
			'quiz_pin'
		]);
	});
});
