import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SearchSelect, { searchKey } from './SearchSelect.svelte';

const options = [
	{ value: 'FR', label: 'Francja' },
	{ value: 'DE', label: 'Niemcy' },
	{ value: 'PL', label: 'Polska' },
	{ value: 'GB', label: 'Wielka Brytania' },
	{ value: 'IT', label: 'Włochy' }
];

function field(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: 'Kraj' });
}

describe('SearchSelect', () => {
	it('shows the label of the chosen value', async () => {
		render(SearchSelect, { label: 'Kraj', options, value: 'DE' });

		await expect.element(field()).toHaveValue('Niemcy');
	});

	it('lists every option on focus and filters them while typing, ignoring diacritics', async () => {
		render(SearchSelect, { label: 'Kraj', options });

		await field().click();
		await expect.element(page.getByRole('option')).toHaveLength(5);
		await userEvent.type(field(), 'wlo');

		await expect.element(page.getByRole('option')).toHaveLength(1);
		await expect.element(page.getByRole('option', { name: 'Włochy' })).toBeVisible();
	});

	it('picks an option with the keyboard and shows its label', async () => {
		render(SearchSelect, { label: 'Kraj', options });

		await field().click();
		await userEvent.type(field(), 'pol');
		await userEvent.keyboard('{Enter}');

		await expect.element(field()).toHaveValue('Polska');
		expect(page.getByRole('listbox').elements()).toHaveLength(0);
	});

	it('picks an option with the pointer', async () => {
		render(SearchSelect, { label: 'Kraj', options });

		await field().click();
		await page.getByRole('option', { name: 'Wielka Brytania' }).click();

		await expect.element(field()).toHaveValue('Wielka Brytania');
	});

	it('says when nothing matches and keeps the chosen value after Escape', async () => {
		render(SearchSelect, { label: 'Kraj', options, value: 'FR' });

		await field().click();
		await userEvent.type(field(), 'xyz');
		await expect.element(page.getByText('Nothing matches')).toBeVisible();
		await userEvent.keyboard('{Escape}');

		await expect.element(field()).toHaveValue('Francja');
	});

	it('clears the chosen value', async () => {
		render(SearchSelect, { label: 'Kraj', options, value: 'FR' });

		await page.getByRole('button', { name: 'Clear Francja' }).click();

		await expect.element(field()).toHaveValue('');
		expect(page.getByRole('button', { name: 'Clear Francja' }).elements()).toHaveLength(0);
	});

	it('describes the field with its hint', async () => {
		render(SearchSelect, { label: 'Kraj', options, hint: 'Wybierz kraj z listy.' });

		await expect.element(field()).toHaveAccessibleDescription('Wybierz kraj z listy.');
	});
});

describe('searchKey', () => {
	it('ignores case and Polish diacritics', () => {
		expect(searchKey(' Łódź ')).toBe('lodz');
		expect(searchKey('Włochy')).toBe(searchKey('wlochy'));
	});
});
