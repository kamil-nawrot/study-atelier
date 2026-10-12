import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Toast from './Toast.svelte';

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Toast', () => {
	it('keeps an empty status region on the page until a message is shown', async () => {
		render(Toast);

		await expect.element(page.getByRole('status')).toBeInTheDocument();
		await expect.element(page.getByRole('status')).toHaveTextContent('');
	});

	it('shows the message in the status region and hides it after the duration', async () => {
		const { component } = await render(Toast, { duration: 300 });

		component.show('Artwork 0012 saved.');

		await expect.element(page.getByRole('status')).toHaveTextContent('Artwork 0012 saved.');
		await expect.element(page.getByText('Artwork 0012 saved.')).toBeVisible();
		await expect.element(page.getByText('Artwork 0012 saved.')).not.toBeInTheDocument();
	});

	it('replaces the visible message and counts the duration again', async () => {
		const { component } = await render(Toast, { duration: 400 });

		component.show('Artwork 0012 saved.');
		await wait(250);
		component.show('Artwork 0013 saved.');
		await wait(250);

		await expect.element(page.getByText('Artwork 0013 saved.')).toBeVisible();
		await expect.element(page.getByText('Artwork 0012 saved.')).not.toBeInTheDocument();
	});

	it('stays while the pointer is over it', async () => {
		const { component } = await render(Toast, { duration: 600 });

		component.show('Artwork 0012 saved.');
		const toast = page.getByText('Artwork 0012 saved.');
		await userEvent.hover(toast);
		await wait(800);

		await expect.element(toast).toBeVisible();

		await userEvent.unhover(toast);
		await expect.element(toast).not.toBeInTheDocument();
	});

	it('stands above content fixed to the bottom of the screen', async () => {
		await render(Toast, { offset: 80 });

		const region = page.getByRole('status').element() as HTMLElement;
		expect(region.style.getPropertyValue('--toast-offset')).toBe('80px');
	});
});
