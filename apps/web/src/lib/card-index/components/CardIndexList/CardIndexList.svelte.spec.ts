import Landmark from '@lucide/svelte/icons/landmark';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { ListedRecord } from '#lib/card-index/types/listed-record.ts';
import CardIndexList from './CardIndexList.svelte';

const RECORDS: ListedRecord[] = [
	{
		id: 'v-louvre',
		name: 'Louvre',
		count: 2,
		detail: 'Paryż',
		icon: Landmark,
		iconLabel: 'Muzeum'
	},
	{ id: 'v-motif', name: 'Motif', note: 'pole własne' }
];

describe('CardIndexList', () => {
	it('shows the icon and the detail of a record and its note in place of the count', async () => {
		render(CardIndexList, {
			records: RECORDS,
			empty: m.cardIndex.emptyList.location,
			searchLabel: m.cardIndex.search.location,
			href: (id: string) => `/atelier/values/location/${id}` as `/atelier/values/${string}`
		});

		const louvre = page.getByRole('link', {
			name: m.cardIndex.openValue('Louvre', m.atelier.count(2))
		});
		await expect.element(louvre).toHaveAttribute('href', '/atelier/values/location/v-louvre');
		await expect.element(louvre).toHaveTextContent('Paryż');
		expect(louvre.element().querySelector('[title="Muzeum"] svg')).not.toBeNull();
		await expect
			.element(page.getByRole('link', { name: m.cardIndex.openValue('Motif', 'pole własne') }))
			.toBeVisible();
	});

	it('chooses a record with a button when it has no page', async () => {
		const onchoose = vi.fn();
		render(CardIndexList, {
			records: RECORDS,
			empty: m.cardIndex.emptyList.location,
			searchLabel: m.cardIndex.search.location,
			onchoose
		});

		await page
			.getByRole('button', { name: m.cardIndex.openValue('Louvre', m.atelier.count(2)) })
			.click();

		expect(onchoose).toHaveBeenCalledWith('v-louvre');
		expect(page.getByRole('link').elements()).toHaveLength(0);
	});

	it('says when no record matches the search', async () => {
		render(CardIndexList, {
			records: RECORDS,
			empty: m.cardIndex.emptyList.location,
			searchLabel: m.cardIndex.search.location,
			query: 'Prado'
		});

		await expect.element(page.getByText(m.cardIndex.noResults('Prado'))).toBeVisible();
	});

	it('shows the empty state without records', async () => {
		render(CardIndexList, {
			records: [],
			empty: m.cardIndex.emptyList.location,
			searchLabel: m.cardIndex.search.location
		});

		await expect.element(page.getByText(m.cardIndex.emptyList.location)).toBeVisible();
	});
});
