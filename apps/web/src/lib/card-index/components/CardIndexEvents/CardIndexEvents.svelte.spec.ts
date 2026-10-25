import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { CARD_INDEX_SEARCH_MIN_VALUES } from '#lib/card-index/card-index/card-index.ts';
import { m } from '#lib/i18n/i18n.ts';
import CardIndexEvents from './CardIndexEvents.svelte';

const events = [
	{ id: 'event-1', name: 'Congress of Vienna', note: '1814–1815' },
	{ id: 'event-2', name: 'Battle of Hastings', note: '1066' }
];

describe('card index events', () => {
	it('lists the events in the given order with their dates, each leading to its edit form', async () => {
		render(CardIndexEvents, { entries: events });

		const items = page.getByRole('listitem');
		await expect.element(items.first()).toHaveTextContent('Congress of Vienna');
		await expect.element(items.last()).toHaveTextContent('Battle of Hastings');
		await expect
			.element(
				page.getByRole('link', { name: m.cardIndex.openValue('Battle of Hastings', '1066') })
			)
			.toHaveAttribute('href', '/atelier/timeline/events/event-2/edit');
	});

	it('offers adding an event, also when there are none', async () => {
		render(CardIndexEvents, { entries: [] });

		await expect.element(page.getByText(m.cardIndex.emptyEvents)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.cardIndex.eventsAdd }))
			.toHaveAttribute('href', '/atelier/timeline/events/new');
	});

	it('searches the events from the same number of entries as the other lists', async () => {
		const many = Array.from({ length: CARD_INDEX_SEARCH_MIN_VALUES }, (_, position) => ({
			id: `event-${position}`,
			name: position === 0 ? 'Fall of Constantinople' : `Event ${position}`,
			note: '1453'
		}));
		render(CardIndexEvents, { entries: many });

		await userEvent.fill(
			page.getByRole('searchbox', { name: m.cardIndex.search.events }),
			'constan'
		);

		await expect.element(page.getByRole('listitem')).toHaveTextContent('Fall of Constantinople');
	});
});
