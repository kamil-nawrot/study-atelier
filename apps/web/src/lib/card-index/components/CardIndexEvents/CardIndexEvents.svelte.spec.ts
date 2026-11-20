import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import CardIndexEvents from './CardIndexEvents.svelte';

const events = [
	{
		id: 'event-1',
		name: 'Congress of Vienna',
		note: '1814–1815',
		year: 1814,
		yearFrom: 1814,
		yearTo: 1815,
		span: true
	},
	{
		id: 'event-2',
		name: 'Battle of Hastings',
		note: '1066',
		year: 1066,
		yearFrom: null,
		yearTo: 1066
	},
	{
		id: 'event-3',
		name: 'Industrial Revolution',
		note: '1760–1840',
		year: 1760,
		yearFrom: 1760,
		yearTo: 1840,
		span: true
	},
	{ id: 'event-4', name: 'Fall of Granada', note: '1492', year: 1492, yearFrom: null, yearTo: 1492 }
];

function era(name: string): Locator {
	return page.getByRole('listitem').filter({ has: page.getByRole('heading', { name }) });
}

function names(name: string): string[] {
	return era(name)
		.getByRole('link', { name: /,/ })
		.elements()
		.map((link) => link.getAttribute('aria-label')?.split(',')[0] ?? '');
}

describe('card index events', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('groups the events under the eras of their years, each leading to its page', async () => {
		render(CardIndexEvents, { entries: events });

		await expect
			.element(
				era(m.eras.middle_ages.name).getByRole('link', {
					name: m.cardIndex.openValue('Battle of Hastings', '1066')
				})
			)
			.toHaveAttribute('href', '/atelier/timeline/events/event-2');
		expect(names(m.eras.modern.name)).toEqual(['Congress of Vienna', 'Industrial Revolution']);
	});

	it('shows an event across an era bound under every era it covers', async () => {
		render(CardIndexEvents, { entries: events });

		await expect
			.element(era(m.eras.early_modern.name).getByText('Industrial Revolution'))
			.toBeVisible();
		await expect.element(era(m.eras.modern.name).getByText('Industrial Revolution')).toBeVisible();
	});

	it('puts an event of a junction year in the era it starts', async () => {
		render(CardIndexEvents, { entries: events });

		await expect.element(era(m.eras.early_modern.name).getByText('Fall of Granada')).toBeVisible();
		await expect
			.element(era(m.eras.middle_ages.name).getByText('Fall of Granada'))
			.not.toBeInTheDocument();
	});

	it('says what an era without events lacks', async () => {
		render(CardIndexEvents, { entries: events });

		await expect
			.element(era(m.eras.antiquity.name).getByText(m.cardIndex.emptyEraEvents))
			.toBeVisible();
	});

	it('offers adding an event, also when there are none', async () => {
		render(CardIndexEvents, { entries: [] });

		await expect.element(page.getByText(m.cardIndex.emptyEvents)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.cardIndex.eventsAdd }))
			.toHaveAttribute('href', '/atelier/timeline/events/new');
	});

	it('orders the eras and the events of each from the newest', async () => {
		render(CardIndexEvents, { entries: events, sort: 'newest' });

		const headings = page
			.getByRole('heading', { level: 2 })
			.elements()
			.map((heading) => heading.textContent?.trim());
		expect(headings[0]).toBe(m.eras.contemporary.name);
		expect(names(m.eras.modern.name)).toEqual(['Congress of Vienna', 'Industrial Revolution']);
	});

	it('searches the events and keeps only the eras with a match', async () => {
		render(CardIndexEvents, { entries: events });

		await userEvent.fill(page.getByRole('searchbox', { name: m.cardIndex.search.events }), 'hast');

		await expect
			.element(era(m.eras.middle_ages.name).getByText('Battle of Hastings'))
			.toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.eras.modern.name }))
			.not.toBeInTheDocument();
	});

	it('marks an event of one year and an event over a span with their own icons', async () => {
		render(CardIndexEvents, { entries: events });

		await expect
			.element(
				era(m.eras.modern.name)
					.getByRole('listitem')
					.filter({ hasText: 'Congress of Vienna' })
					.getByTitle(m.cardIndex.eventKinds.span)
			)
			.toBeInTheDocument();
		await expect
			.element(
				era(m.eras.middle_ages.name)
					.getByRole('listitem')
					.filter({ hasText: 'Battle of Hastings' })
					.getByTitle(m.cardIndex.eventKinds.single)
			)
			.toBeInTheDocument();
	});
});
