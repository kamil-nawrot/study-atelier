import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import RelationsField from './RelationsField.svelte';

type Row = { key: string; type: string; target: string | null };

const search = createRawSnippet((row: () => Row, invalid: () => boolean) => ({
	render: () =>
		`<input aria-label="Target" aria-invalid="${invalid()}" value="${row().target ?? ''}" />`
}));

function field(rows: Row[], error?: string): { rows: () => Row[] } {
	const props = $state({
		rows,
		error,
		emptyRow: (): Row => ({ key: `row-${rows.length}`, type: '', target: null }),
		hasTarget: (row: Row): boolean => !!row.target,
		onchoose: (row: Row, value: string): void => {
			row.type = value;
		},
		options: [{ value: 'copy', label: 'Copy' }],
		removeLabel: (row: Row): string => `Remove ${row.target}`,
		search,
		texts: {
			add: 'Add relation',
			title: 'Relations',
			type: 'Kind',
			choose: 'Choose',
			removeEmpty: 'Remove empty'
		}
	});
	render(RelationsField<Row>, props);
	return { rows: () => props.rows };
}

describe('RelationsField', () => {
	it('shows only an add link while there are no rows', async () => {
		field([]);

		await expect.element(page.getByRole('button', { name: 'Add relation' })).toBeVisible();
		expect(page.getByRole('group', { name: 'Relations' }).query()).toBeNull();
	});

	it('adds a row, focuses its type and records the chosen type', async () => {
		const { rows } = field([]);

		await userEvent.click(page.getByRole('button', { name: 'Add relation' }));
		await expect.element(page.getByRole('combobox', { name: 'Kind' })).toHaveFocus();
		await userEvent.selectOptions(page.getByRole('combobox', { name: 'Kind' }), 'Copy');

		expect(rows()).toHaveLength(1);
		expect(rows()[0]?.type).toBe('copy');
	});

	it('removes a row by its label and names an empty row differently', async () => {
		const { rows } = field([
			{ key: 'a', type: 'copy', target: 'Mona Lisa' },
			{ key: 'b', type: '', target: null }
		]);

		await userEvent.click(page.getByRole('button', { name: 'Remove empty' }));
		await userEvent.click(page.getByRole('button', { name: 'Remove Mona Lisa' }));

		expect(rows()).toEqual([]);
	});

	it('marks a target without a match invalid and shows the error', async () => {
		field([{ key: 'a', type: 'copy', target: null }], 'Fix the relation.');

		await expect.element(page.getByText('Fix the relation.')).toBeVisible();
		await expect.element(page.getByLabelText('Target')).toBeInvalid();
	});
});
