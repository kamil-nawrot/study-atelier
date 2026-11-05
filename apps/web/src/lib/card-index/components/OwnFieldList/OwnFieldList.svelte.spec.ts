import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import OwnFieldList from './OwnFieldList.svelte';

function fields(): ReturnType<typeof testOwnFields> {
	const list = testOwnFields();
	list[1].typeCodes = ['painting'];
	return list;
}

describe('OwnFieldList', () => {
	it('links every field to its page with its kind, types and count', async () => {
		render(OwnFieldList, { fields: fields() });

		const link = page.getByRole('link', { name: m.cardIndex.openValue('Motifs', '3 dzieła') });
		await expect.element(link).toHaveAttribute('href', '/atelier/fields/motifs');
		await expect.element(page.getByRole('img', { name: m.artworkTypes.painting })).toBeVisible();
		await expect.element(page.getByText(m.ownFields.kinds.flag)).toBeVisible();
	});

	it('moves fields with arrows in the reorder mode, never past either end', async () => {
		const onmove = vi.fn();
		render(OwnFieldList, { fields: fields(), reordering: true, onmove });

		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.ownFields.moveFieldUp('Lecture') }))
			.toBeDisabled();
		await expect
			.element(page.getByRole('button', { name: m.ownFields.moveFieldDown('Seen in person') }))
			.toBeDisabled();
		await page.getByRole('button', { name: m.ownFields.moveFieldDown('Lecture') }).click();

		expect(onmove).toHaveBeenCalledWith(expect.objectContaining({ id: 'lecture' }), 1);
	});

	it('disables the arrows while a move is saved', async () => {
		render(OwnFieldList, { fields: fields(), reordering: true, moving: true });

		await expect
			.element(page.getByRole('button', { name: m.ownFields.moveFieldUp('Motifs') }))
			.toBeDisabled();
	});
});
