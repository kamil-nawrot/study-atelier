import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { searchRelatedArtworks } from '#lib/artwork-relations/artwork-relations-data/artwork-relations-data.ts';
import type { ArtworkRelationRow } from '#lib/artwork-relations/types/artwork-relation-row.ts';
import ArtworkRelationsField from './ArtworkRelationsField.svelte';

vi.mock('#lib/artwork-relations/artwork-relations-data/artwork-relations-data.ts', () => ({
	searchRelatedArtworks: vi.fn()
}));

const kiss = { id: 'kiss', number: 7, title: 'The Kiss' };
const venus = { id: 'venus', number: 9, title: 'The Birth of Venus' };

function field(rows: ArtworkRelationRow[], error?: string): { rows: () => ArtworkRelationRow[] } {
	const props = $state({ artworkId: 'mona', rows, error });
	render(ArtworkRelationsField, props);
	return { rows: () => props.rows };
}

describe('ArtworkRelationsField', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(searchRelatedArtworks).mockResolvedValue({
			artworks: [
				{ ...kiss, authors: [] },
				{ ...venus, authors: [] },
				{ id: 'mona', number: 1, title: 'Mona Lisa', authors: [] }
			]
		});
	});

	it('shows only a small link while the artwork has no relation', async () => {
		field([]);

		await expect.element(page.getByRole('button', { name: m.artworkRelations.add })).toBeVisible();
		expect(page.getByRole('group', { name: m.artworkRelations.title }).query()).toBeNull();
	});

	it('adds a row with an empty type, finds an artwork and chooses the type', async () => {
		const { rows } = field([]);

		await userEvent.click(page.getByRole('button', { name: m.artworkRelations.add }));
		await expect
			.element(page.getByRole('combobox', { name: m.artworkRelations.type }))
			.toHaveFocus();
		await userEvent.selectOptions(
			page.getByRole('combobox', { name: m.artworkRelations.type }),
			m.artworkRelations.types.copyFrom
		);
		await userEvent.fill(page.getByRole('combobox', { name: m.artworkRelations.search }), 'the');
		await userEvent.click(page.getByRole('option', { name: /The Kiss/ }));

		await expect
			.element(page.getByRole('button', { name: m.artworkRelations.remove('The Kiss') }))
			.toBeVisible();
		expect(
			page.getByRole('option', { name: m.artworkRelations.choose, includeHidden: true }).element()
		).toBeDisabled();
		expect(rows()).toEqual([{ key: expect.any(String), type: 'copyFrom', artwork: kiss }]);
	});

	it('leaves the artwork itself and the related ones out of the search', async () => {
		field([{ key: 'venus', type: 'related', artwork: venus }]);

		await userEvent.click(page.getByRole('button', { name: m.artworkRelations.add }));
		await userEvent.fill(page.getByRole('combobox', { name: m.artworkRelations.search }), 'the');

		await expect.element(page.getByRole('option', { name: /The Kiss/ })).toBeVisible();
		expect(page.getByRole('option', { name: /^Mona Lisa/ }).query()).toBeNull();
		expect(page.getByRole('option', { name: /^The Birth of Venus/ }).query()).toBeNull();
	});

	it('marks only the missing part of a row and removes a row', async () => {
		const { rows } = field(
			[
				{ key: 'kiss', type: '', artwork: kiss },
				{ key: 'new', type: 'related', artwork: null }
			],
			m.artworkRelations.artworkRequired
		);

		await expect.element(page.getByText(m.artworkRelations.artworkRequired)).toBeVisible();
		const [first, second] = page.getByRole('combobox', { name: m.artworkRelations.type }).all();
		await expect.element(first).toHaveAttribute('aria-invalid', 'true');
		await expect.element(second).not.toHaveAttribute('aria-invalid');
		await expect
			.element(page.getByRole('combobox', { name: m.artworkRelations.search }))
			.toHaveAttribute('aria-invalid', 'true');
		await userEvent.click(
			page.getByRole('button', { name: m.artworkRelations.removeEmpty, exact: true })
		);

		expect(rows()).toEqual([{ key: 'kiss', type: '', artwork: kiss }]);
	});
});
