import { describe, expect, it, vi } from 'vitest';
import Search from '@lucide/svelte/icons/search';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import StageButton from './StageButton.svelte';

describe('StageButton', () => {
	it('is named by its label and explains itself in a tooltip', async () => {
		render(StageButton, { icon: Search, label: 'Loupe', tooltip: 'Look closer' });

		const button = page.getByRole('button', { name: 'Loupe' });
		await expect.element(button).toBeVisible();
		await userEvent.hover(button);

		await expect.element(page.getByRole('tooltip')).toHaveTextContent('Look closer');
	});

	it('stays dim until it is pointed at or active', async () => {
		render(StageButton, { icon: Search, label: 'Loupe' });
		render(StageButton, { icon: Search, label: 'Pins', active: true });

		await expect
			.element(page.getByRole('button', { name: 'Loupe' }))
			.toHaveStyle({ opacity: '0.6' });
		await expect.element(page.getByRole('button', { name: 'Pins' })).toHaveStyle({ opacity: '1' });
	});

	it('passes its attributes and its click to the button', async () => {
		const onclick = vi.fn();
		render(StageButton, { icon: Search, label: 'Loupe', 'aria-pressed': true, onclick });

		const button = page.getByRole('button', { name: 'Loupe' });
		await button.click();

		expect(onclick).toHaveBeenCalledOnce();
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
	});
});
