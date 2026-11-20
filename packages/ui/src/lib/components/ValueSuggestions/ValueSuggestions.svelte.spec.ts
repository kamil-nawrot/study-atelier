import type { ValueOption } from '../../types/value-option';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages } from '../../messages/messages';
import ValueSuggestions from './ValueSuggestions.svelte';

const texts = defaultUiMessages.valueField;

const options: ValueOption[] = [
	{ kind: 'found', id: 'a', name: 'The Kiss', note: 'Gustav Klimt' },
	{ kind: 'similar', name: 'Baroque' },
	{ kind: 'existing', name: 'gothic' },
	{ kind: 'starter', name: 'Prado', note: 'Spain' },
	{ kind: 'new', name: 'barock' }
];

function show(onpick: (option: ValueOption) => void = () => {}, expanded = true): void {
	render(ValueSuggestions, {
		listId: 'list',
		label: 'Style',
		options,
		activeIndex: 2,
		expanded,
		optionId: (option: ValueOption) => `option-${options.indexOf(option)}`,
		onpick
	});
}

describe('ValueSuggestions', () => {
	it('lists found options first, then the similar one, the groups and the new one', async () => {
		show();

		const list = page.getByRole('listbox', { name: 'Style' });
		await expect.element(list.getByRole('option', { name: /The Kiss/ })).toBeVisible();
		await expect
			.element(list.getByRole('option', { name: new RegExp(texts.useSimilar) }))
			.toBeVisible();
		await expect
			.element(page.getByRole('group', { name: texts.existing }).getByRole('option'))
			.toHaveTextContent('gothic');
		await expect
			.element(page.getByRole('group', { name: texts.starter }).getByRole('option'))
			.toHaveTextContent(/Prado/);
		await expect
			.element(list.getByRole('option', { name: texts.addAnyway('barock') }))
			.toBeVisible();
	});

	it('marks the active option as selected', async () => {
		show();

		await expect
			.element(page.getByRole('option', { name: 'gothic' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(page.getByRole('option', { name: /The Kiss/ }))
			.toHaveAttribute('aria-selected', 'false');
	});

	it('passes the picked option on', async () => {
		const picked: ValueOption[] = [];
		show((option) => picked.push(option));

		await userEvent.click(page.getByRole('option', { name: 'gothic' }));

		expect(picked).toEqual([{ kind: 'existing', name: 'gothic' }]);
	});

	it('is hidden while not expanded', async () => {
		show(undefined, false);

		await expect
			.element(page.getByRole('listbox', { name: 'Style', includeHidden: true }))
			.toHaveAttribute('hidden');
	});
});
