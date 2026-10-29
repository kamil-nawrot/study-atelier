import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import CardIndexEvents from './CardIndexEvents.svelte';

const events = [
	{ id: 'event-1', name: 'Congress of Vienna', note: '1814–1815', year: 1814 },
	{ id: 'event-2', name: 'Battle of Hastings', note: '1066', year: 1066 },
	{ id: 'event-3', name: 'Undated meeting', note: '' }
];

describe('card index events', () => {
	it('lists the events by name with their dates, each leading to its edit form', async () => {
		render(CardIndexEvents, { entries: events });

		const items = page.getByRole('listitem');
		await expect.element(items.first()).toHaveTextContent('Battle of Hastings');
		await expect.element(items.last()).toHaveTextContent('Undated meeting');
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

	it('sorts the events by date with the undated ones last', async () => {
		render(CardIndexEvents, { entries: events, sort: 'date' });

		expect(
			page
				.getByRole('listitem')
				.elements()
				.map((item) =>
					item.textContent
						?.trim()
						.split(/\s{2,}|\d/)[0]
						.trim()
				)
		).toEqual(['Battle of Hastings', 'Congress of Vienna', 'Undated meeting']);
	});

	it('searches the events however few there are', async () => {
		render(CardIndexEvents, {
			entries: [
				{ id: 'event-1', name: 'Fall of Constantinople', note: '1453' },
				{ id: 'event-2', name: 'Event 2', note: '1500' }
			]
		});

		await userEvent.fill(
			page.getByRole('searchbox', { name: m.cardIndex.search.events }),
			'constan'
		);

		await expect.element(page.getByRole('listitem')).toHaveTextContent('Fall of Constantinople');
	});
});
