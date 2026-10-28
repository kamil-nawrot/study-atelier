import type { ValueOption } from '../../types/value-option';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages } from '../../messages/messages';
import { controlHeight, outlinedHeight } from '../../testing/control-height';
import ValueField from './ValueField.svelte';

const texts = defaultUiMessages.valueField;

const options: ValueOption[] = [
	{ kind: 'existing', name: 'baroque' },
	{ kind: 'existing', name: 'rococo' },
	{ kind: 'existing', name: 'gothic' }
];

describe('ValueField', () => {
	it('opens grouped suggestions when the learner focuses the field', async () => {
		render(ValueField, { label: 'Style', options });

		const field = page.getByRole('combobox', { name: 'Style' });
		await expect.element(field).toHaveAttribute('aria-expanded', 'false');
		await userEvent.click(field);

		await expect.element(field).toHaveAttribute('aria-expanded', 'true');
		const used = page.getByRole('group', { name: texts.existing });
		await expect.element(used.getByRole('option', { name: 'baroque' })).toBeVisible();
		await expect.element(used.getByRole('option', { name: 'rococo' })).toBeVisible();
		await expect.element(used.getByRole('option', { name: 'gothic' })).toBeVisible();
	});

	it('lists starter entries in their own group, with a note, after the values in use', async () => {
		render(ValueField, {
			label: 'Location',
			options: [
				{ kind: 'existing', name: 'Louvre', note: 'France' },
				{ kind: 'starter', name: 'Prado', note: 'Spain' }
			]
		});

		await userEvent.click(page.getByRole('combobox', { name: 'Location' }));

		const used = page.getByRole('group', { name: texts.existing });
		await expect.element(used.getByRole('option', { name: /Louvre/ })).toBeVisible();
		await expect.element(used.getByText('France')).toBeVisible();
		const starter = page.getByRole('group', { name: texts.starter });
		await expect.element(starter.getByRole('option', { name: /Prado/ })).toBeVisible();
		await expect.element(starter.getByText('Spain')).toBeVisible();
	});

	it('picks a starter entry with the keyboard', async () => {
		render(ValueField, {
			label: 'Location',
			single: true,
			options: [
				{ kind: 'existing', name: 'Louvre' },
				{ kind: 'starter', name: 'Prado', note: 'Spain' }
			]
		});

		await userEvent.click(page.getByRole('combobox', { name: 'Location' }));
		await userEvent.keyboard('{ArrowDown}{Enter}');

		await expect.element(page.getByRole('button', { name: texts.remove('Prado') })).toBeVisible();
	});

	it('moves through the options with the arrow keys and picks one with Enter', async () => {
		render(ValueField, { label: 'Style', options });

		const field = page.getByRole('combobox', { name: 'Style' });
		await userEvent.click(field);
		await expect
			.element(page.getByRole('option', { name: 'baroque' }))
			.toHaveAttribute('aria-selected', 'true');
		await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
		const gothic = page.getByRole('option', { name: 'gothic' });
		await expect.element(gothic).toHaveAttribute('aria-selected', 'true');
		await expect.element(field).toHaveAttribute('aria-activedescendant', gothic.element().id);
		await userEvent.keyboard('{ArrowUp}{Enter}');

		await expect.element(page.getByRole('button', { name: texts.remove('rococo') })).toBeVisible();
		await expect.element(field).toHaveFocus();
	});

	it('keeps the suggestions open after a pick so the learner can add the next value', async () => {
		render(ValueField, { label: 'Style', options });

		const field = page.getByRole('combobox', { name: 'Style' });
		await userEvent.click(field);
		await userEvent.click(page.getByRole('option', { name: 'gothic' }));

		await expect.element(field).toHaveFocus();
		await expect.element(field).toHaveAttribute('aria-expanded', 'true');
		await expect
			.element(page.getByRole('option', { name: 'baroque' }))
			.toHaveAttribute('aria-selected', 'true');
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('button', { name: texts.remove('baroque') })).toBeVisible();
		await expect.element(field).toHaveAttribute('aria-expanded', 'true');
	});

	it('picks an option on click and clears the typed text', async () => {
		render(ValueField, { label: 'Style', options, query: 'ba' });

		await userEvent.click(page.getByRole('combobox', { name: 'Style' }));
		await userEvent.click(page.getByRole('option', { name: 'baroque' }));

		await expect.element(page.getByRole('button', { name: texts.remove('baroque') })).toBeVisible();
		await expect.element(page.getByRole('combobox', { name: 'Style' })).toHaveValue('');
	});

	it('does not pick an option when a touch only starts scrolling the list', async () => {
		render(ValueField, { label: 'Style', options });

		await userEvent.click(page.getByRole('combobox', { name: 'Style' }));
		const option = page.getByRole('option', { name: 'baroque' }).element();
		option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
		option.dispatchEvent(
			new PointerEvent('pointercancel', { bubbles: true, pointerType: 'touch' })
		);

		await expect
			.element(page.getByRole('button', { name: texts.remove('baroque') }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('combobox', { name: 'Style' }))
			.toHaveAttribute('aria-expanded', 'true');
	});

	it('closes the suggestions with Escape', async () => {
		render(ValueField, { label: 'Style', options });

		const field = page.getByRole('combobox', { name: 'Style' });
		await userEvent.click(field);
		await userEvent.keyboard('{Escape}');

		await expect.element(field).toHaveAttribute('aria-expanded', 'false');
		await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
	});

	it('removes the last value with Backspace in an empty field', async () => {
		render(ValueField, { label: 'Authors', values: ['Rembrandt', 'Vermeer'] });

		await userEvent.click(page.getByRole('combobox', { name: 'Authors' }));
		await userEvent.keyboard('{Backspace}');

		await expect.element(page.getByText('Rembrandt')).toBeVisible();
		await expect.element(page.getByText('Vermeer')).not.toBeInTheDocument();
	});

	it('removes a value on click without focusing the field or opening the suggestions', async () => {
		render(ValueField, { label: 'Authors', values: ['Rembrandt', 'Vermeer'], options });

		await userEvent.click(page.getByRole('button', { name: texts.remove('Rembrandt') }));

		const field = page.getByRole('combobox', { name: 'Authors' });
		await expect.element(page.getByText('Rembrandt')).not.toBeInTheDocument();
		await expect.element(page.getByText('Vermeer')).toBeVisible();
		await expect.element(field).not.toHaveFocus();
		await expect.element(field).toHaveAttribute('aria-expanded', 'false');
	});

	it('moves keyboard focus to the next remove button, then to the closed field', async () => {
		render(ValueField, { label: 'Authors', values: ['Rembrandt', 'Vermeer'], options });

		page
			.getByRole('button', { name: texts.remove('Rembrandt') })
			.element()
			.focus();
		await userEvent.keyboard('{Enter}');
		const vermeer = page.getByRole('button', { name: texts.remove('Vermeer') });
		await expect.element(vermeer).toHaveFocus();
		await userEvent.keyboard('{Enter}');

		const field = page.getByRole('combobox', { name: 'Authors' });
		await expect.element(field).toHaveFocus();
		await expect.element(field).toHaveAttribute('aria-expanded', 'false');
	});

	it('offers a new value to add', async () => {
		render(ValueField, {
			label: 'Style',
			options: [{ kind: 'new', name: 'tenebrism' }],
			query: 'tenebrism'
		});

		await userEvent.click(page.getByRole('combobox', { name: 'Style' }));
		await userEvent.click(page.getByRole('option', { name: texts.add('tenebrism') }));

		await expect
			.element(page.getByRole('button', { name: texts.remove('tenebrism') }))
			.toBeVisible();
	});

	it('puts a similar existing value first and still lets the learner add the new one', async () => {
		render(ValueField, {
			label: 'Style',
			options: [
				{ kind: 'new', name: 'barock' },
				{ kind: 'existing', name: 'rococo' },
				{ kind: 'similar', name: 'baroque' }
			],
			query: 'barock'
		});

		await userEvent.click(page.getByRole('combobox', { name: 'Style' }));

		const items = page.getByRole('option').elements();
		expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			`${texts.similar('baroque')} ${texts.useSimilar}`,
			'rococo',
			texts.addAnyway('barock')
		]);
		await expect.element(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('button', { name: texts.remove('baroque') })).toBeVisible();
	});

	it('hides the text input once it holds the most values allowed', async () => {
		render(ValueField, { label: 'Synonyms', values: ['one', 'two'], max: 2 });

		await expect.element(page.getByRole('combobox', { name: 'Synonyms' })).not.toBeInTheDocument();

		await page.getByRole('button', { name: texts.remove('two') }).click();

		await expect.element(page.getByRole('combobox', { name: 'Synonyms' })).toBeVisible();
	});

	it('takes one value in single mode and hides the text input until it is removed', async () => {
		render(ValueField, {
			label: 'Location',
			options: [{ kind: 'existing', name: 'Louvre' }],
			single: true
		});

		await userEvent.click(page.getByRole('combobox', { name: 'Location' }));
		await userEvent.click(page.getByRole('option', { name: 'Louvre' }));

		await expect.element(page.getByRole('combobox')).not.toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: texts.remove('Louvre') }));
		await expect.element(page.getByRole('combobox', { name: 'Location' })).toBeVisible();
	});

	it('leaves the remove button unfocused after a pointer pick in single mode', async () => {
		render(ValueField, {
			label: 'Location',
			options: [{ kind: 'existing', name: 'Louvre' }],
			single: true
		});

		await userEvent.click(page.getByRole('combobox', { name: 'Location' }));
		await userEvent.click(page.getByRole('option', { name: 'Louvre' }));

		const remove = page.getByRole('button', { name: texts.remove('Louvre') });
		await expect.element(remove).toBeVisible();
		expect(document.activeElement).not.toBe(remove.element());
	});

	it('moves focus to the remove button after a keyboard pick in single mode', async () => {
		render(ValueField, {
			label: 'Location',
			options: [{ kind: 'existing', name: 'Louvre' }],
			single: true
		});

		await userEvent.click(page.getByRole('combobox', { name: 'Location' }));
		await userEvent.keyboard('{Enter}');

		await expect.element(page.getByRole('button', { name: texts.remove('Louvre') })).toHaveFocus();
	});

	it('is disabled without remove buttons or suggestions', async () => {
		render(ValueField, { label: 'Authors', values: ['Rembrandt'], options, disabled: true });

		const field = page.getByRole('combobox', { name: 'Authors' });
		await expect.element(field).toBeDisabled();
		await expect.element(page.getByText('Rembrandt')).toBeVisible();
		await expect.element(page.getByRole('button')).not.toBeInTheDocument();
		await expect.element(field).toHaveAttribute('aria-expanded', 'false');
	});

	it('is locked without suggestions but lets the learner remove a value', async () => {
		render(ValueField, {
			label: 'Style',
			values: ['gothic'],
			options: [],
			locked: true,
			placeholder: 'Choose a period first.'
		});

		const field = page.getByRole('combobox', { name: 'Style' });
		await expect.element(field).toBeDisabled();
		await userEvent.click(page.getByRole('button', { name: texts.remove('gothic') }));

		await expect.element(page.getByText('gothic')).not.toBeInTheDocument();
		await expect.element(field).toHaveAttribute('placeholder', 'Choose a period first.');
		await expect.element(field).toBeDisabled();
	});

	it('shows an error under the field instead of the hint', async () => {
		render(ValueField, {
			label: 'Authors',
			hint: 'Add one or more.',
			error: 'Add an author.'
		});

		const field = page.getByRole('combobox', { name: 'Authors' });
		await expect.element(field).toHaveAttribute('aria-invalid', 'true');
		await expect.element(field).toHaveAccessibleDescription('Add an author.');
		await expect.element(page.getByText('Add one or more.')).not.toBeInTheDocument();
	});

	it('shows the hint when there is no error', async () => {
		render(ValueField, { label: 'Location', hint: 'Where the artwork is now.' });

		const field = page.getByRole('combobox', { name: 'Location' });
		await expect.element(field).toHaveAccessibleDescription('Where the artwork is now.');
		await expect.element(field).not.toHaveAttribute('aria-invalid');
	});

	it('is as high as every other control while empty', async () => {
		render(ValueField, { label: 'Authors' });

		const input = page.getByRole('combobox', { name: 'Authors' }).element();
		expect(outlinedHeight(input, '.control')).toBe(controlHeight());
	});

	it('stays as high as every other control with one value', async () => {
		render(ValueField, { label: 'Authors', values: ['Rembrandt'] });

		const input = page.getByRole('combobox', { name: 'Authors' }).element();
		expect(outlinedHeight(input, '.control')).toBe(controlHeight());
	});

	it('ignores the keyboard while the field is being filled', async () => {
		const options: ValueOption[] = [{ kind: 'existing', name: 'baroque' }];
		const screen = await render(ValueField, {
			label: 'Forms',
			values: ['nawy', 'nawie'],
			options,
			filling: true
		});

		const input = page.getByRole('combobox', { name: 'Forms' });
		await input.click({ force: true });
		await userEvent.keyboard('{Backspace}{ArrowDown}{Enter}');

		expect(screen.container.querySelectorAll('.value')).toHaveLength(2);
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
	});

	it('locks the values while the field is being filled', async () => {
		render(ValueField, { label: 'Forms', values: ['nawy'], filling: true });

		await expect.element(page.getByRole('combobox', { name: 'Forms' })).toHaveAttribute('readonly');
		await expect.element(page.getByRole('button', { name: /nawy/ })).not.toBeInTheDocument();
		expect(document.querySelectorAll('.filling-lines .line')).toHaveLength(1);
	});
});
