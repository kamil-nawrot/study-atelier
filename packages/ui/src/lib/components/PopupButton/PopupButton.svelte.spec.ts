import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import PopupButton from './PopupButton.svelte';

const trigger = createRawSnippet(() => ({ render: () => '<span>Group</span>' }));
const panel = createRawSnippet(() => ({
	render: () => '<button type="button">Era</button>'
}));

function renderPopup(tooltip = false): void {
	render(PopupButton, { label: 'Grouping: era', trigger, children: panel, tooltip });
}

function button(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: 'Grouping: era' });
}

describe('PopupButton', () => {
	it('opens its panel on a click and closes it on a second one', async () => {
		renderPopup();

		await expect.element(button()).toHaveAttribute('aria-expanded', 'false');
		await button().click();

		await expect.element(button()).toHaveAttribute('aria-expanded', 'true');
		await expect.element(page.getByRole('dialog', { name: 'Grouping: era' })).toBeVisible();

		await button().click();

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('stays open while the learner chooses inside the panel', async () => {
		renderPopup();
		await button().click();

		await page.getByRole('button', { name: 'Era', exact: true }).click();

		await expect.element(page.getByRole('dialog', { name: 'Grouping: era' })).toBeVisible();
	});

	it('closes from the code and gives the focus back to its button', async () => {
		const popup = await render(PopupButton, { label: 'Grouping: era', trigger, children: panel });
		await button().click();

		popup.component.close();

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.element(button()).toHaveFocus();
	});

	it('closes on Escape and gives the focus back to its button', async () => {
		renderPopup();
		await button().click();
		await page.getByRole('button', { name: 'Era', exact: true }).click();

		await userEvent.keyboard('{Escape}');

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.element(button()).toHaveFocus();
	});

	it('closes on a click outside', async () => {
		renderPopup();
		await button().click();

		document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('names its state in a tooltip', async () => {
		renderPopup(true);

		await userEvent.hover(button());

		await expect.element(page.getByRole('tooltip')).toHaveTextContent('Grouping: era');
	});
});
