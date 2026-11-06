import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { Relations } from '#lib/relations/types/relations.ts';
import RelationsBand from './RelationsBand.svelte';

const relations: Relations = {
	kind: 'author',
	bounds: { from: 1452, to: 1519 },
	years: [1476, 1503],
	groups: [
		{
			label: 'Materiały',
			values: [
				{ id: 'm', name: 'Oil on poplar', count: 2, href: '/atelier/values/material/m' as never }
			]
		}
	],
	types: [{ code: 'painting', count: 2 }],
	total: 3,
	mastered: 2,
	events: [
		{ id: 'e', name: 'Odkrycie Ameryki', yearFrom: null, yearTo: 1492, yearApproximate: false }
	]
};

describe('RelationsBand', () => {
	it('shows every part of the band, open', async () => {
		render(RelationsBand, { relations });

		await expect.element(page.getByRole('heading', { name: m.relations.title })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: /Oil on poplar/ }))
			.toHaveAttribute('href', '/atelier/values/material/m');
		await expect.element(page.getByText('2 z 3 dzieł opanowane')).toBeVisible();
		await expect.element(page.getByText(m.artworkTypes.painting)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Odkrycie Ameryki' }))
			.toHaveAttribute('href', '/atelier/timeline/events/e');
		await expect.element(page.getByText(m.relations.sameTime)).toBeVisible();
	});

	it('collapses', async () => {
		render(RelationsBand, { relations });

		await page.getByText(m.relations.title).click();

		await expect.element(page.getByText('2 z 3 dzieł opanowane')).not.toBeVisible();
	});

	it('shows eight events of the same time and the rest on request', async () => {
		const events = Array.from({ length: 12 }, (_, index) => ({
			id: `e${index}`,
			name: `Event ${index + 1}`,
			yearFrom: null,
			yearTo: 1400 + index,
			yearApproximate: false
		}));
		render(RelationsBand, { relations: { ...relations, events } });

		await expect.element(page.getByRole('link', { name: 'Event 8', exact: true })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Event 9', exact: true }))
			.not.toBeInTheDocument();
		await page.getByRole('button', { name: m.relations.allEvents(12) }).click();

		await expect.element(page.getByRole('link', { name: 'Event 12', exact: true })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.relations.allEvents(12) }))
			.not.toBeInTheDocument();
	});

	it('names other events on an event page', async () => {
		render(RelationsBand, { relations: { ...relations, kind: 'event' } });
		await expect.element(page.getByText(m.relations.otherEvents)).toBeVisible();
	});

	it('renders nothing when there is nothing to relate', async () => {
		render(RelationsBand, {
			relations: { kind: 'material', years: [], groups: [], types: [], total: 0 }
		});
		expect(page.getByText(m.relations.title).elements()).toHaveLength(0);
	});
});
