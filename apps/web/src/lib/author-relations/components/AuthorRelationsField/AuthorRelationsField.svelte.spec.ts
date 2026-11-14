import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { AuthorRelationRow } from '#lib/author-relations/types/author-relation-row.ts';
import AuthorRelationsField from './AuthorRelationsField.svelte';

const verrocchio = { id: 'verrocchio', name: 'Andrea del Verrocchio' };
const raphael = { id: 'raphael', name: 'Raphael' };
const authors = [verrocchio, raphael, { id: 'leonardo', name: 'Leonardo da Vinci' }];

function field(rows: AuthorRelationRow[], error?: string): { rows: () => AuthorRelationRow[] } {
	const props = $state({ authorId: 'leonardo', authors, rows, error });
	render(AuthorRelationsField, props);
	return { rows: () => props.rows };
}

describe('AuthorRelationsField', () => {
	it('shows only a small link while the author has no relation', async () => {
		field([]);

		await expect.element(page.getByRole('button', { name: m.authorRelations.add })).toBeVisible();
		expect(page.getByRole('group', { name: m.authorRelations.title }).query()).toBeNull();
	});

	it('adds a row, finds an author without diacritics and chooses the type', async () => {
		const { rows } = field([]);

		await userEvent.click(page.getByRole('button', { name: m.authorRelations.add }));
		await expect
			.element(page.getByRole('combobox', { name: m.authorRelations.type }))
			.toHaveFocus();
		await userEvent.selectOptions(
			page.getByRole('combobox', { name: m.authorRelations.type }),
			m.authorRelations.types.pupilFrom
		);
		await userEvent.fill(page.getByRole('combobox', { name: m.authorRelations.search }), 'verr');
		await userEvent.click(page.getByRole('option', { name: verrocchio.name }));

		await expect
			.element(page.getByRole('button', { name: m.authorRelations.remove(verrocchio.name) }))
			.toBeVisible();
		expect(
			page.getByRole('option', { name: m.authorRelations.choose, includeHidden: true }).element()
		).toBeDisabled();
		expect(rows()).toEqual([{ key: expect.any(String), type: 'pupilFrom', author: verrocchio }]);
	});

	it('leaves the author itself and the related ones out of the search', async () => {
		field([{ key: 'raphael', type: 'influenceTo', author: raphael }]);

		await userEvent.click(page.getByRole('button', { name: m.authorRelations.add }));
		await userEvent.fill(page.getByRole('combobox', { name: m.authorRelations.search }), 'a');

		await expect.element(page.getByRole('option', { name: verrocchio.name })).toBeVisible();
		expect(page.getByRole('option', { name: 'Leonardo da Vinci' }).query()).toBeNull();
		expect(page.getByRole('option', { name: 'Raphael', exact: true }).query()).toBeNull();
	});

	it('says when no author matches', async () => {
		field([]);

		await userEvent.click(page.getByRole('button', { name: m.authorRelations.add }));
		await userEvent.fill(page.getByRole('combobox', { name: m.authorRelations.search }), 'zz');

		await expect.element(page.getByText(m.authorRelations.noMatch)).toBeVisible();
	});

	it('marks only the missing part of a row and removes a row', async () => {
		const { rows } = field(
			[
				{ key: 'raphael', type: '', author: raphael },
				{ key: 'new', type: 'family', author: null }
			],
			m.authorRelations.authorRequired
		);

		await expect.element(page.getByText(m.authorRelations.authorRequired)).toBeVisible();
		const [first, second] = page.getByRole('combobox', { name: m.authorRelations.type }).all();
		await expect.element(first).toHaveAttribute('aria-invalid', 'true');
		await expect.element(second).not.toHaveAttribute('aria-invalid');
		await expect
			.element(page.getByRole('combobox', { name: m.authorRelations.search }))
			.toHaveAttribute('aria-invalid', 'true');
		await userEvent.click(
			page.getByRole('button', { name: m.authorRelations.removeEmpty, exact: true })
		);

		expect(rows()).toEqual([{ key: 'raphael', type: '', author: raphael }]);
	});
});
