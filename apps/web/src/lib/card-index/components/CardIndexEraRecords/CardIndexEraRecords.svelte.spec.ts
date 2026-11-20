import type { ComponentProps } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import CardIndexEraRecords from './CardIndexEraRecords.svelte';

const KEY = 'study-atelier:test-folded-eras';

function props(
	outside = [{ id: 'a-unknown', name: 'Unknown', count: 1 }]
): ComponentProps<typeof CardIndexEraRecords> {
	return {
		eras: ERA_CODES.map((code) => ({
			code,
			records: code === 'antiquity' ? [{ id: 'a-phidias', name: 'Phidias', count: 2 }] : []
		})),
		outside: { title: m.cardIndex.authorsWithoutEra, records: outside },
		empty: m.cardIndex.emptyList.author,
		eraEmpty: m.cardIndex.emptyEraAuthors,
		searchLabel: m.cardIndex.search.author,
		foldingKey: KEY,
		href: (id: string) =>
			`/atelier/values/author/${id}` as ComponentProps<typeof CardIndexEraRecords>['href'] extends (
				id: string
			) => infer R
				? R
				: never
	};
}

describe('CardIndexEraRecords', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('lists the records under their eras and the rest after the axis', async () => {
		render(CardIndexEraRecords, props());

		await expect
			.element(
				page.getByRole('link', { name: m.cardIndex.openValue('Phidias', m.atelier.count(2)) })
			)
			.toHaveAttribute('href', '/atelier/values/author/a-phidias');
		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.authorsWithoutEra }))
			.toBeVisible();
		await expect.element(page.getByText(m.cardIndex.emptyEraAuthors).first()).toBeVisible();
	});

	it('folds an era and remembers it under its own key', async () => {
		render(CardIndexEraRecords, props());

		await page.getByRole('button', { name: m.eras.antiquity.name }).click();

		await expect.element(page.getByText('Phidias')).not.toBeInTheDocument();
		expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toEqual(['antiquity']);
	});

	it('keeps only the matching eras while searching', async () => {
		render(CardIndexEraRecords, props([]));

		await userEvent.fill(page.getByRole('searchbox', { name: m.cardIndex.search.author }), 'phid');

		await expect.element(page.getByText('Phidias')).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.eras.modern.name }))
			.not.toBeInTheDocument();
	});

	it('shows the empty state when nothing is listed', async () => {
		render(CardIndexEraRecords, {
			...props([]),
			eras: ERA_CODES.map((code) => ({ code, records: [] }))
		});

		await expect.element(page.getByText(m.cardIndex.emptyList.author)).toBeVisible();
	});
});
