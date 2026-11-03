import { describe, expect, it } from 'vitest';
import { noteLinkArgs, valueLinkTarget } from './note-link-target.ts';

describe('noteLinkArgs', () => {
	it('names the one subject a note link read asks for', () => {
		expect(noteLinkArgs({ artworkNumber: 12 })).toEqual({ artwork_number: 12 });
		expect(noteLinkArgs({ valueId: 'style-doric' })).toEqual({ value_id: 'style-doric' });
		expect(noteLinkArgs({ eraCode: 'antiquity' })).toEqual({ era_code: 'antiquity' });
		expect(noteLinkArgs({ visitId: 'visit-1' })).toEqual({ visit_id: 'visit-1' });
	});
});

describe('valueLinkTarget', () => {
	it('targets an era by its code and any other value by its id', () => {
		expect(valueLinkTarget({ kind: 'era', code: 'modern' })).toEqual({ eraCode: 'modern' });
		expect(
			valueLinkTarget({
				kind: 'style',
				record: { id: 'style-doric', category: 'style', name: 'Doric', count: 1 }
			})
		).toEqual({ valueId: 'style-doric' });
	});
});
