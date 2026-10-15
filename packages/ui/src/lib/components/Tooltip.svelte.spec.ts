import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../styles/index.css';
import Tooltip from './Tooltip.svelte';

const button = createRawSnippet((describedby: () => string) => ({
	render: () =>
		`<button aria-describedby="${describedby()}" aria-disabled="true" type="button">Delete</button>`
}));

function renderTooltip(): void {
	render(Tooltip, { text: 'Two artworks still use this', children: button });
}

describe('Tooltip', () => {
	it('keeps the text hidden until the learner asks for it', async () => {
		renderTooltip();

		await expect.element(page.getByText('Two artworks still use this')).not.toBeVisible();
	});

	it('shows the text on hover', async () => {
		renderTooltip();

		await userEvent.hover(page.getByRole('button', { name: 'Delete' }));

		await expect.element(page.getByRole('tooltip')).toBeVisible();
		await expect
			.element(page.getByRole('tooltip'))
			.toHaveTextContent('Two artworks still use this');
	});

	it('shows the text when the control inside is focused with the keyboard', async () => {
		renderTooltip();

		page.getByRole('button', { name: 'Delete' }).element().focus();

		await expect.element(page.getByRole('tooltip')).toBeVisible();
	});

	it('describes the wrapped control with the text', async () => {
		renderTooltip();

		await expect
			.element(page.getByRole('button', { name: 'Delete' }))
			.toHaveAccessibleDescription('Two artworks still use this');
	});

	it('opens above the control and grows from its start by default', async () => {
		renderTooltip();

		await userEvent.hover(page.getByRole('button', { name: 'Delete' }));

		const control = page.getByRole('button', { name: 'Delete' }).element().getBoundingClientRect();
		const bubble = page.getByRole('tooltip').element().getBoundingClientRect();
		expect(bubble.bottom).toBeLessThanOrEqual(control.top);
		expect(bubble.left).toBeCloseTo(control.left, 0);
	});

	it('can open below the control and line up with its end', async () => {
		render(Tooltip, {
			text: 'Two artworks still use this',
			placement: 'bottom',
			align: 'end',
			children: button
		});

		await userEvent.hover(page.getByRole('button', { name: 'Delete' }));

		const control = page.getByRole('button', { name: 'Delete' }).element().getBoundingClientRect();
		const bubble = page.getByRole('tooltip').element().getBoundingClientRect();
		expect(bubble.top).toBeGreaterThanOrEqual(control.bottom);
		expect(bubble.right).toBeCloseTo(control.right, 0);
	});
});
