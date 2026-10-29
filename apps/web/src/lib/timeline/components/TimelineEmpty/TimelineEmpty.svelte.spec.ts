import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import TimelineEmpty from './TimelineEmpty.svelte';

describe('TimelineEmpty', () => {
	it('says what the timeline will show and offers the first event', async () => {
		render(TimelineEmpty);

		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent(m.timeline.emptyTitle);
		await expect.element(page.getByText(m.timeline.empty)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.timeline.addFirst }))
			.toHaveAttribute('href', '/atelier/timeline/events/new');
	});
});
