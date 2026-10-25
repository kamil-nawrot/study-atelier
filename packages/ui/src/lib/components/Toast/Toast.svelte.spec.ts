import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Toast from './Toast.svelte';

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
});

afterEach(() => {
	vi.useRealTimers();
});

describe('Toast', () => {
	it('keeps an empty status region on the page until a message is shown', async () => {
		await render(Toast);

		await expect.element(page.getByRole('status')).toHaveTextContent(/^$/);
	});

	it('shows the message in the status region and hides it after the duration', async () => {
		const { component } = await render(Toast, { duration: 5000 });

		component.show('Artwork #0012 saved.');

		await expect.element(page.getByRole('status')).toHaveTextContent('Artwork #0012 saved.');
		vi.advanceTimersByTime(4900);
		await expect.element(page.getByText('Artwork #0012 saved.')).toBeVisible();
		vi.advanceTimersByTime(100);
		await expect.element(page.getByText('Artwork #0012 saved.')).not.toBeInTheDocument();
	});

	it('replaces the visible message and counts the duration again', async () => {
		const { component } = await render(Toast, { duration: 5000 });

		component.show('Artwork #0012 saved.');
		vi.advanceTimersByTime(3000);
		component.show('Artwork #0013 saved.');

		await expect.element(page.getByText('Artwork #0012 saved.')).not.toBeInTheDocument();
		vi.advanceTimersByTime(4900);
		await expect.element(page.getByText('Artwork #0013 saved.')).toBeVisible();
		vi.advanceTimersByTime(100);
		await expect.element(page.getByText('Artwork #0013 saved.')).not.toBeInTheDocument();
	});

	it('stays while the pointer is over it', async () => {
		const { component } = await render(Toast, { duration: 5000 });

		component.show('Artwork #0012 saved.');
		const toast = page.getByText('Artwork #0012 saved.');
		await userEvent.hover(toast);
		vi.advanceTimersByTime(10000);
		await expect.element(toast).toBeVisible();

		await userEvent.unhover(toast);
		vi.advanceTimersByTime(5000);
		await expect.element(toast).not.toBeInTheDocument();
	});

	it('hides within a second once the pointer leaves, however long it stayed', async () => {
		const { component } = await render(Toast, { duration: 5000 });

		component.show('Artwork #0012 saved.');
		const toast = page.getByText('Artwork #0012 saved.');
		await userEvent.hover(toast);
		vi.advanceTimersByTime(1000);

		await userEvent.unhover(toast);
		vi.advanceTimersByTime(900);
		await expect.element(toast).toBeVisible();
		vi.advanceTimersByTime(100);
		await expect.element(toast).not.toBeInTheDocument();
	});

	it('keeps a shorter remaining time when the pointer leaves late', async () => {
		const { component } = await render(Toast, { duration: 5000 });

		component.show('Artwork #0012 saved.');
		const toast = page.getByText('Artwork #0012 saved.');
		vi.advanceTimersByTime(4700);
		await userEvent.hover(toast);
		await userEvent.unhover(toast);
		vi.advanceTimersByTime(300);

		await expect.element(toast).not.toBeInTheDocument();
	});

	it('stands above content fixed to the bottom of the screen', async () => {
		await render(Toast, { offset: 80 });

		const region = page.getByRole('status').element() as HTMLElement;
		expect(region.style.getPropertyValue('--toast-offset')).toBe('80px');
	});
});
