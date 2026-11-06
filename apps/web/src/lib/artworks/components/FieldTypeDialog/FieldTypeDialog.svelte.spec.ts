import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { FieldTypeCheck } from '#lib/artworks/field-type-check/field-type-check.svelte.ts';
import FieldTypeDialog from './FieldTypeDialog.svelte';
import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';

const fields: OwnFieldDefinition[] = [
	{
		id: 'order',
		name: 'Order',
		description: null,
		kind: 'text',
		multiple: false,
		typeCodes: ['architecture']
	},
	{
		id: 'capital',
		name: 'Capital',
		description: null,
		kind: 'list',
		multiple: false,
		typeCodes: ['architecture']
	},
	{ id: 'source', name: 'Source', description: null, kind: 'text', multiple: false, typeCodes: [] }
];

function input(own: ArtworkInput['own'], typeCode: ArtworkInput['typeCode']): ArtworkInput {
	return { typeCode, own } as ArtworkInput;
}

describe('FieldTypeDialog', () => {
	it('does not ask when every filled field applies to the type', async () => {
		const check = new FieldTypeCheck();
		render(FieldTypeDialog, { check, typeCode: 'architecture' });

		await expect(
			check.confirm(input({ order: 'Doric', source: 'Gombrich' }, 'architecture'), fields)
		).resolves.toBe(true);
		expect(check.open).toBe(false);
	});

	it('names the fields the type drops and empties them once confirmed', async () => {
		const check = new FieldTypeCheck();
		render(FieldTypeDialog, { check, typeCode: 'painting' });
		const artwork = input({ order: 'Doric', capital: ['Ionic'], source: 'Gombrich' }, 'painting');
		const answer = check.confirm(artwork, fields);

		const dialog = page.getByRole('alertdialog', { name: m.fieldTypeDialog.title(2) });
		await expect
			.element(dialog)
			.toHaveAccessibleDescription(
				m.fieldTypeDialog.description(['Order', 'Capital'], m.artworkTypes.painting)
			);
		await page.getByRole('button', { name: m.fieldTypeDialog.confirm }).click();

		await expect(answer).resolves.toBe(true);
		expect(artwork.own).toEqual({ order: '', capital: [], source: 'Gombrich' });
		await expect.element(dialog).not.toBeInTheDocument();
	});

	it('keeps the values when the learner goes back', async () => {
		const check = new FieldTypeCheck();
		render(FieldTypeDialog, { check, typeCode: null });
		const artwork = input({ order: 'Doric' }, null);
		const answer = check.confirm(artwork, fields);

		await expect
			.element(page.getByRole('alertdialog', { name: m.fieldTypeDialog.title(1) }))
			.toHaveAccessibleDescription(m.fieldTypeDialog.description(['Order'], null));
		await page.getByRole('button', { name: m.fieldTypeDialog.back }).click();

		await expect(answer).resolves.toBe(false);
		expect(artwork.own).toEqual({ order: 'Doric' });
	});
});
