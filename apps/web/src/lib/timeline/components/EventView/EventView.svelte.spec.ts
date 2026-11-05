import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import EventView from './EventView.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/timeline/events/e'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	refreshExpiredImages: vi.fn().mockResolvedValue([]),
	resolveImages: vi.fn().mockResolvedValue([])
}));
vi.mock('#lib/timeline/timeline-data/timeline-data.ts', () => ({ deleteTimelineEvent: vi.fn() }));

const baptism: TimelineEvent = {
	id: 'e',
	name: 'Chrzest Polski',
	yearFrom: null,
	yearTo: 966,
	yearApproximate: false,
	description: '',
	source: {
		title: 'Chrzest Polski',
		url: 'https://pl.wikipedia.org/wiki/Chrzest_Polski',
		licence: 'CC BY-SA 4.0',
		fetchedOn: '2026-11-05'
	}
};

describe('EventView', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		navigation.state = {};
	});

	it('marks a single moment and credits Wikipedia', async () => {
		render(EventView, { event: baptism, artworks: [] });

		await expect
			.element(
				page.getByText(m.valuePage.header(m.cardIndex.eventKinds.single, m.atelier.count(0)))
			)
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: '„Chrzest Polski”' }))
			.toHaveAttribute('href', 'https://pl.wikipedia.org/wiki/Chrzest_Polski');
	});

	it('confirms a change made on the form', async () => {
		navigation.state = { valueMessage: 'Zapisano.' };
		render(EventView, { event: baptism, artworks: [] });

		await expect.element(page.getByText('Zapisano.')).toBeVisible();
	});
});
