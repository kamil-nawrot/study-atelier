import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { createValue, saveValue } from '#lib/card-index/card-index-data/card-index-data.ts';
import { setPlacePoint } from '#lib/map/places-data/places-data.ts';
import {
	ensureCityPlace,
	saveValueDetails
} from '#lib/values/value-details-data/value-details-data.ts';
import type { ValueFormFields } from '#lib/values/types/value-form-fields.ts';
import { saveValueForm } from './value-form-save.ts';

vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({
	createValue: vi.fn(),
	saveValue: vi.fn()
}));
vi.mock('#lib/map/places-data/places-data.ts', () => ({ setPlacePoint: vi.fn() }));
vi.mock('#lib/values/value-details-data/value-details-data.ts', () => ({
	ensureCityPlace: vi.fn(),
	saveValueDetails: vi.fn()
}));

function fields(overrides: Partial<ValueFormFields> = {}): ValueFormFields {
	return {
		name: '',
		eraCodes: [],
		periodIds: [],
		details: { summary: '', notes: '' },
		author: null,
		location: null,
		eraBounds: null,
		...overrides
	};
}

const newPeriod = {
	kind: 'period' as const,
	record: { id: '', category: 'period' as const, name: '', count: 0 }
};

describe('saveValueForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(createValue).mockResolvedValue({ id: 'period-new' });
		vi.mocked(saveValue).mockResolvedValue({});
		vi.mocked(saveValueDetails).mockResolvedValue({});
		vi.mocked(setPlacePoint).mockResolvedValue({});
	});

	it('creates a new value, saves its eras and details and leads to its page', async () => {
		const result = await saveValueForm({
			subject: newPeriod,
			form: fields({
				name: 'Manieryzm',
				eraCodes: ['early_modern'],
				details: { summary: 'Po renesansie.', notes: '' }
			}),
			saved: fields(),
			details: { summary: '', notes: '' },
			name: 'Manieryzm',
			linksChanged: true
		});

		expect(createValue).toHaveBeenCalledWith('period', 'Manieryzm');
		expect(saveValueDetails).toHaveBeenCalledWith(
			{ kind: 'period', record: expect.objectContaining({ id: 'period-new', name: 'Manieryzm' }) },
			expect.objectContaining({ summary: 'Po renesansie.' }),
			{ summary: '', notes: '' }
		);
		expect(saveValue).toHaveBeenCalledWith(
			expect.objectContaining({ eraCodes: ['early_modern'], name: 'Manieryzm' })
		);
		expect(result).toEqual({
			path: '/atelier/values/period/period-new',
			message: m.valueForm.created(m.cardIndex.kinds.period.accusative, 'Manieryzm')
		});
	});

	it('gives back the created value when its details then fail, so it is not created again', async () => {
		vi.mocked(saveValueDetails).mockResolvedValue({ error: 'Brak sieci.' });

		const result = await saveValueForm({
			subject: newPeriod,
			form: fields({ name: 'Manieryzm', details: { summary: 'Po renesansie.', notes: '' } }),
			saved: fields(),
			details: { summary: '', notes: '' },
			name: 'Manieryzm',
			linksChanged: false
		});

		expect(result).toEqual({
			error: 'Brak sieci.',
			created: { kind: 'period', record: expect.objectContaining({ id: 'period-new' }) }
		});
		const again = await saveValueForm({
			subject: result.error !== undefined && result.created ? result.created : newPeriod,
			form: fields({ name: 'Manieryzm', details: { summary: 'Po renesansie.', notes: '' } }),
			saved: fields(),
			details: { summary: '', notes: '' },
			name: 'Manieryzm',
			linksChanged: false
		});
		expect(createValue).toHaveBeenCalledTimes(1);
		expect(again.error).toBe('Brak sieci.');
	});

	it('stops with the error when the value cannot be created', async () => {
		vi.mocked(createValue).mockResolvedValue({ error: 'Brak sieci.' });

		const result = await saveValueForm({
			subject: newPeriod,
			form: fields({ name: 'Manieryzm' }),
			saved: fields(),
			details: { summary: '', notes: '' },
			name: 'Manieryzm',
			linksChanged: false
		});

		expect(result).toEqual({ error: 'Brak sieci.' });
		expect(saveValue).not.toHaveBeenCalled();
	});

	it('saves an existing value without creating one', async () => {
		const result = await saveValueForm({
			subject: {
				kind: 'material',
				record: { id: 'material-1', category: 'material', name: 'Brąz', count: 1 }
			},
			form: fields({ name: 'Brąz' }),
			saved: fields({ name: 'Brąz' }),
			details: { summary: '', notes: '' },
			name: 'Brąz',
			linksChanged: false
		});

		expect(createValue).not.toHaveBeenCalled();
		expect(saveValueDetails).not.toHaveBeenCalled();
		expect(result).toEqual({
			path: '/atelier/values/material/material-1',
			message: m.valuePage.saved
		});
	});

	it('saves a changed position of a place with its Wikidata item', async () => {
		const point = { latitude: 48.86111, longitude: 2.33583 };
		const subject = {
			kind: 'location' as const,
			record: { id: 'place-1', category: 'location' as const, name: 'Luwr', count: 1 }
		};
		const location = { countryCode: 'FR', placeType: null, point: null };

		await saveValueForm({
			subject,
			form: fields({ name: 'Luwr', location: { ...location, point, wikidataId: 'Q19675' } }),
			saved: fields({ name: 'Luwr', location }),
			details: { summary: '', notes: '' },
			name: 'Luwr',
			linksChanged: false
		});

		expect(setPlacePoint).toHaveBeenCalledWith('place-1', point, 'Q19675');
	});

	it('leaves the position alone when it did not change', async () => {
		const subject = {
			kind: 'location' as const,
			record: { id: 'place-1', category: 'location' as const, name: 'Luwr', count: 1 }
		};
		const location = { countryCode: 'FR', placeType: null, point: null };

		await saveValueForm({
			subject,
			form: fields({ name: 'Luwr', location }),
			saved: fields({ name: 'Luwr', location }),
			details: { summary: '', notes: '' },
			name: 'Luwr',
			linksChanged: false
		});

		expect(setPlacePoint).not.toHaveBeenCalled();
	});

	it('creates the chosen city first, saves it with the place and sets no point', async () => {
		vi.mocked(ensureCityPlace).mockResolvedValue({ id: 'city-paris' });
		const subject = {
			kind: 'location' as const,
			record: { id: 'place-1', category: 'location' as const, name: 'Luwr', count: 1 }
		};
		const saved = { countryCode: null, placeType: null, point: { latitude: 1, longitude: 1 } };
		const city = { name: 'Paryż', countryCode: 'FR', wikidataId: 'Q90' };

		await saveValueForm({
			subject,
			form: fields({
				name: 'Luwr',
				location: { countryCode: 'FR', placeType: 'museum', point: null, city }
			}),
			saved: fields({ name: 'Luwr', location: saved }),
			details: { summary: '', notes: '' },
			name: 'Luwr',
			linksChanged: false
		});

		expect(ensureCityPlace).toHaveBeenCalledWith(city, 'place-1');
		expect(vi.mocked(saveValueDetails).mock.calls[0][1].location?.city).toEqual({
			...city,
			id: 'city-paris'
		});
		expect(setPlacePoint).not.toHaveBeenCalled();
	});

	it('stops with the error when the city cannot be created', async () => {
		vi.mocked(ensureCityPlace).mockResolvedValue({ error: 'Brak sieci.' });
		const subject = {
			kind: 'location' as const,
			record: { id: 'place-1', category: 'location' as const, name: 'Luwr', count: 1 }
		};

		const result = await saveValueForm({
			subject,
			form: fields({
				name: 'Luwr',
				location: { countryCode: null, placeType: 'museum', city: { name: 'Tum' } }
			}),
			saved: fields({ name: 'Luwr', location: { countryCode: null, placeType: 'museum' } }),
			details: { summary: '', notes: '' },
			name: 'Luwr',
			linksChanged: false
		});

		expect(result).toEqual({ error: 'Brak sieci.' });
		expect(saveValueDetails).not.toHaveBeenCalled();
	});
});
