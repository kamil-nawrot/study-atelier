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

	it('keeps its whole time after a tap on a touch screen', async () => {
		const { component } = await render(Toast, { duration: 5000 });

		component.show('Artwork #0012 saved.');
		const toast = page.getByText('Artwork #0012 saved.');
		await expect.element(toast).toBeVisible();
		const element = toast.element();
		for (const type of ['pointerenter', 'pointerleave']) {
			element.dispatchEvent(new PointerEvent(type, { pointerType: 'touch' }));
		}
		vi.advanceTimersByTime(4900);

		await expect.element(toast).toBeVisible();
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

	it('runs its action once and goes away', async () => {
		const { component } = await render(Toast);
		const run = vi.fn();

		component.show('Marked as fixed.', { label: 'Undo', run });
		await userEvent.click(page.getByRole('button', { name: 'Undo' }));

		expect(run).toHaveBeenCalledOnce();
		await expect.element(page.getByText('Marked as fixed.')).not.toBeInTheDocument();
	});

	it('drops the action of an earlier message', async () => {
		const { component } = await render(Toast);

		component.show('Marked as fixed.', { label: 'Undo', run: vi.fn() });
		component.show('Saved.');

		await expect.element(page.getByText('Saved.')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
	});

	it('goes away without motion when the learner asks for less motion or no duration is set', async () => {
		const original = window.matchMedia;
		window.matchMedia = ((query: string) => ({
			...original.call(window, query),
			matches: query.includes('reduce')
		})) as typeof window.matchMedia;
		document.documentElement.style.setProperty('--duration-short', 'none');
		const { component } = await render(Toast);

		component.show('Saved.', { label: 'Undo', run: vi.fn() });
		await userEvent.click(page.getByRole('button', { name: 'Undo' }));
		window.matchMedia = original;
		document.documentElement.style.removeProperty('--duration-short');

		await expect.element(page.getByText('Saved.')).not.toBeInTheDocument();
	});
});
