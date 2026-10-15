import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../styles/index.css';
import Popover from './Popover.svelte';

const trigger = createRawSnippet(() => ({ render: () => '<span>Renaissance</span>' }));
const content = createRawSnippet(() => ({
	render: () => '<span>The revival of antiquity.</span>'
}));

function renderPopover(): void {
	render(Popover, { children: trigger, content });
}

function button(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: 'Renaissance' });
}

describe('Popover', () => {
	it('keeps the card hidden until the learner asks for it', async () => {
		renderPopover();

		await expect.element(button()).toHaveAttribute('aria-expanded', 'false');
		expect(page.getByRole('tooltip').elements()).toHaveLength(0);
	});

	it('opens on hover and closes when the pointer leaves', async () => {
		renderPopover();

		await userEvent.hover(button());
		await expect.element(page.getByRole('tooltip')).toHaveTextContent('The revival of antiquity.');
		await userEvent.unhover(button());

		await expect.element(button()).toHaveAttribute('aria-expanded', 'false');
	});

	it('opens on a click, describes the trigger, and closes on a click outside', async () => {
		renderPopover();

		await button().click();
		await expect.element(button()).toHaveAccessibleDescription('The revival of antiquity.');
		await userEvent.click(document.body);

		await expect.element(button()).toHaveAttribute('aria-expanded', 'false');
	});

	it('closes on a second click and on Escape', async () => {
		renderPopover();

		await button().click();
		await button().click();
		await expect.element(button()).toHaveAttribute('aria-expanded', 'false');
		await button().click();
		await userEvent.keyboard('{Escape}');

		await expect.element(button()).toHaveAttribute('aria-expanded', 'false');
	});

	it('opens when the trigger gets keyboard focus', async () => {
		renderPopover();

		await userEvent.tab();

		await expect.element(button()).toHaveAttribute('aria-expanded', 'true');
	});

	it('keeps the card inside the window', async () => {
		renderPopover();

		await button().click();
		const box = page.getByRole('tooltip').element().getBoundingClientRect();

		expect(box.left).toBeGreaterThanOrEqual(0);
		expect(box.right).toBeLessThanOrEqual(window.innerWidth);
		expect(box.top).toBeGreaterThanOrEqual(0);
	});

	it('lets a click on the card reach what lies under it and closes', async () => {
		renderPopover();

		await button().click();
		await userEvent.click(page.getByRole('tooltip'), { force: true });

		await expect.element(button()).toHaveAttribute('aria-expanded', 'false');
	});
});
