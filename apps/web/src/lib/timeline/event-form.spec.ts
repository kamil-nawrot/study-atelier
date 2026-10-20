import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { draftOfEventForm, emptyEventForm, eventFormOf, validateEventForm } from './event-form.ts';

describe('validateEventForm', () => {
	it('asks for a name and a year', () => {
		expect(validateEventForm(emptyEventForm())).toEqual({
			name: m.timeline.form.nameRequired,
			yearTo: m.timeline.form.yearRequired
		});
	});

	it('checks the years like the date of an artwork', () => {
		const form = {
			...emptyEventForm(),
			name: 'Wojny napoleońskie',
			spanMode: true,
			yearFrom: '1815',
			yearTo: '1803'
		};
		expect(validateEventForm(form)).toEqual({ yearTo: m.artworkErrors.spanOrder });
		expect(validateEventForm({ ...form, yearFrom: 'x', yearTo: '1815' })).toEqual({
			yearFrom: m.artworkErrors.yearInvalid
		});
	});
});

describe('draftOfEventForm and eventFormOf', () => {
	it('turns the form into signed years and back', () => {
		const form = {
			...emptyEventForm(),
			name: ' Pax Romana ',
			spanMode: true,
			yearFrom: '27',
			fromBeforeCommonEra: true,
			yearTo: '180',
			description: ' Pokój w cesarstwie. '
		};
		const draft = draftOfEventForm(form);
		expect(draft).toEqual({
			name: 'Pax Romana',
			yearFrom: -27,
			yearTo: 180,
			yearApproximate: false,
			description: 'Pokój w cesarstwie.'
		});
		expect(
			eventFormOf({ id: 'e', ...draft, yearTo: 180, description: 'Pokój w cesarstwie.' })
		).toEqual({ ...form, name: 'Pax Romana', description: 'Pokój w cesarstwie.' });
	});

	it('ignores the start year when the span is switched off', () => {
		const form = { ...emptyEventForm(), name: 'Chrzest Polski', yearFrom: '900', yearTo: '966' };
		expect(draftOfEventForm(form).yearFrom).toBeNull();
	});
});
