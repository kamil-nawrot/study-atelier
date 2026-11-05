import { describe, expect, it } from 'vitest';
import { LiveErrors } from './live-errors.svelte.ts';

type SpanErrors = { yearFrom?: string; yearTo?: string };

function spanForm(): { form: { from: number; to: number }; errors: LiveErrors<SpanErrors> } {
	const form = $state({ from: 1503, to: 1490 });
	const errors = new LiveErrors<SpanErrors>(() =>
		form.to < form.from ? { yearTo: 'Rok końcowy nie może być wcześniejszy niż początkowy.' } : {}
	);
	return { form, errors };
}

describe('LiveErrors', () => {
	it('shows nothing before the first save', () => {
		const { errors } = spanForm();

		expect(errors.current).toEqual({});
	});

	it('shows the errors of a failed save and drops one as soon as its field is right', () => {
		const { form, errors } = spanForm();

		expect(errors.check()).toBe(false);
		expect(errors.current.yearTo).toBeDefined();

		form.to = 1519;
		expect(errors.current).toEqual({});

		form.to = 1400;
		expect(errors.current.yearTo).toBeDefined();
	});

	it('passes a valid form', () => {
		const { form, errors } = spanForm();
		form.to = 1519;

		expect(errors.check()).toBe(true);
		expect(errors.current).toEqual({});
	});

	it('keeps an error from the database until its field changes', () => {
		const form = $state({ name: 'Apsyda' });
		const errors = new LiveErrors<{ name?: string }>(() => ({}));

		errors.add({ name: 'Hasło „Apsyda” już istnieje.' }, () => form.name);
		expect(errors.current.name).toBe('Hasło „Apsyda” już istnieje.');

		form.name = 'Apsyda boczna';
		expect(errors.current).toEqual({});
	});

	it('counts the errors of a nested group', () => {
		const errors = new LiveErrors<{ author: { born?: string } }>(() => ({
			author: { born: 'Zły rok.' }
		}));

		expect(errors.check()).toBe(false);
	});
});
