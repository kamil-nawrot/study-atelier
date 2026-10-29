import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { createValue, saveValue } from '#lib/card-index/card-index-data/card-index-data.ts';
import { saveValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import type { ValueFormFields } from '#lib/values/types/value-form-fields.ts';
import { saveValueForm } from './value-form-save.ts';

vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({
	createValue: vi.fn(),
	saveValue: vi.fn()
}));
vi.mock('#lib/values/value-details-data/value-details-data.ts', () => ({
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
});
