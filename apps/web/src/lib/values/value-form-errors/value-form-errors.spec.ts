import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { initialValueForm } from '#lib/values/value-form/value-form.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import type { ValueFormFields } from '#lib/values/types/value-form-fields.ts';
import { valueFormErrors } from './value-form-errors.ts';

function formOf(category: 'material' | 'location' = 'material'): ValueFormFields {
	return initialValueForm(
		{ id: 'x', category, name: 'X', count: 0 },
		testCardIndex(),
		emptyValueDetails(),
		undefined
	);
}

describe('valueFormErrors', () => {
	it('has no errors for a plain valid form', () => {
		expect(valueFormErrors({ form: formOf(), hasPlaces: false, creating: false })).toEqual({
			placeType: undefined,
			name: undefined,
			author: undefined,
			eraBounds: undefined
		});
	});

	it('asks for a name and names the value that already exists', () => {
		const exists = { id: 'y', category: 'material' as const, name: 'Marble', count: 1 };
		const check = { form: formOf(), hasPlaces: false, creating: true };

		expect(valueFormErrors({ ...check, change: { kind: 'empty' } }).name).toBe(
			m.valueForm.nameRequired
		);
		expect(valueFormErrors({ ...check, existing: exists, kind: 'materiał' }).name).toBe(
			m.valueForm.exists('materiał', 'Marble')
		);
		expect(valueFormErrors({ ...check, existing: exists }).name).toBeUndefined();
	});

	it('wants the city type for a location that has places', () => {
		const form = formOf('location');

		expect(valueFormErrors({ form, hasPlaces: true, creating: false }).placeType).toBe(
			m.cardIndex.errors.cityType
		);
		expect(valueFormErrors({ form, hasPlaces: false, creating: false }).placeType).toBeUndefined();
	});
});
