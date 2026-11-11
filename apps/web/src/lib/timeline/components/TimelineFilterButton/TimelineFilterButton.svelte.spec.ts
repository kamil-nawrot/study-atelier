import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { emptyTimelineFilter } from '#lib/timeline/filter/filter.ts';
import TimelineFilterButton from './TimelineFilterButton.svelte';

describe('TimelineFilterButton', () => {
	it('toggles the side panel on a larger screen', async () => {
		render(TimelineFilterButton, {
			filter: emptyTimelineFilter(),
			filtering: false,
			wide: true,
			panelOpen: false,
			ondialog: vi.fn()
		});

		const button = page.getByRole('button', { name: m.atelier.filters.button });
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');

		await button.click();

		await expect.element(button).toHaveAttribute('aria-expanded', 'true');
	});

	it('opens the dialog on a phone and names the active filters', async () => {
		const ondialog = vi.fn();
		render(TimelineFilterButton, {
			filter: { ...emptyTimelineFilter(), favourites: true },
			filtering: true,
			wide: false,
			panelOpen: false,
			ondialog
		});

		await page.getByRole('button', { name: m.atelier.filters.buttonWithCount(1) }).click();

		await vi.waitFor(() => expect(ondialog).toHaveBeenCalled());
	});
});
