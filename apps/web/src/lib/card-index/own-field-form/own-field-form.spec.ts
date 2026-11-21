import { describe, expect, it } from 'vitest';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import { ownFieldDraft, ownFieldDraftChanged } from './own-field-form.ts';

describe('ownFieldDraft', () => {
	it('starts a new field as an open text for all types', () => {
		expect(ownFieldDraft()).toEqual({
			name: '',
			description: '',
			kind: 'text',
			multiple: false,
			closed: false,
			limited: false,
			typeCodes: []
		});
	});

	it('copies an edited field and limits it when it has types', () => {
		const [, motifs] = testOwnFields();
		const draft = ownFieldDraft({ ...motifs, closed: true, typeCodes: ['painting'] });

		expect(draft).toMatchObject({ name: motifs.name, closed: true, limited: true });
		expect(draft.typeCodes).toEqual(['painting']);
	});
});

describe('ownFieldDraftChanged', () => {
	it('ignores spaces around the texts', () => {
		const draft = ownFieldDraft();

		expect(ownFieldDraftChanged({ ...draft, name: '  ' }, draft)).toBe(false);
	});

	it('sees a closed list and other types', () => {
		const draft = ownFieldDraft();

		expect(ownFieldDraftChanged({ ...draft, closed: true }, draft)).toBe(true);
		expect(ownFieldDraftChanged({ ...draft, typeCodes: ['painting'] }, draft)).toBe(true);
	});
});
