import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { emptyFilter } from '../filter.ts';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import type { CollectionFilter } from '../types.ts';
import FilterPanelHost from '#lib/testing/FilterPanelHost.svelte';
import '@study-atelier/ui/styles.css';

const artworks = [
	testArtwork(1, 'Mona Lisa', {
		yearTo: 1503,
		eraCode: 'early_modern',
		typeCode: 'painting',
		authors: ['Leonardo'],
		period: 'Renaissance',
		styles: ['Sfumato'],
		materials: ['Oil'],
		location: 'Louvre'
	}),
	testArtwork(2, 'Venus of Willendorf', {
		authors: [],
		yearTo: -25000,
		eraCode: 'prehistory',
		hasImage: false
	})
];

const state = { current: emptyFilter() };

function renderPanel(filter: CollectionFilter = emptyFilter()): void {
	state.current = filter;
	render(FilterPanelHost, {
		artworks,
		initial: filter,
		report: (next: CollectionFilter) => (state.current = next)
	});
}

describe('FilterPanel', () => {
	it('offers a section for every field', async () => {
		renderPanel();

		for (const title of [
			m.atelier.filters.fields.eras,
			m.atelier.filters.fields.types,
			m.atelier.filters.fields.years,
			m.atelier.filters.fields.authors,
			m.atelier.filters.fields.periods,
			m.atelier.filters.fields.styles,
			m.atelier.filters.fields.materials,
			m.atelier.filters.fields.locations,
			m.atelier.filters.fields.missing
		])
			await expect.element(page.getByText(title, { exact: true }).first()).toBeVisible();
	});

	it('searches the values of every field that lists values', async () => {
		renderPanel();

		for (const field of [
			m.atelier.filters.fields.authors,
			m.atelier.filters.fields.periods,
			m.atelier.filters.fields.styles,
			m.atelier.filters.fields.materials,
			m.atelier.filters.fields.locations
		])
			await expect
				.element(page.getByRole('searchbox', { name: m.atelier.filters.searchValues(field) }))
				.toBeVisible();
	});

	it('narrows the values of a field by the search', async () => {
		renderPanel();

		await userEvent.fill(
			page.getByRole('searchbox', {
				name: m.atelier.filters.searchValues(m.atelier.filters.fields.materials)
			}),
			'zzz'
		);

		await expect.element(page.getByText('Oil')).not.toBeInTheDocument();
	});

	it('counts the artworks of each era and shows eras without artworks as empty', async () => {
		renderPanel();

		await expect
			.element(
				page.getByRole('checkbox', { name: new RegExp(`^${m.eras.early_modern.name}.* 1$`) })
			)
			.toBeVisible();
		await expect
			.element(page.getByRole('checkbox', { name: new RegExp(`^${m.eras.modern.name}.* 0$`) }))
			.toBeVisible();
	});

	it('chooses several eras', async () => {
		renderPanel();

		await page.getByRole('checkbox', { name: new RegExp(`^${m.eras.prehistory.name}`) }).click();
		await page.getByRole('checkbox', { name: new RegExp(`^${m.eras.early_modern.name}`) }).click();

		expect(state.current.eras).toEqual(['prehistory', 'early_modern']);
	});

	it('shows every type as a tile with its count and no search', async () => {
		renderPanel();

		await expect
			.element(page.getByRole('group', { name: m.atelier.filters.fields.types }))
			.toBeVisible();
		await expect
			.element(page.getByRole('checkbox', { name: `${m.artworkTypes.painting} 1` }))
			.toBeVisible();
		await expect
			.element(page.getByRole('checkbox', { name: `${m.artworkTypes.sculpture} 0` }))
			.toBeVisible();
		expect(
			page
				.getByRole('group', { name: m.atelier.filters.fields.types })
				.getByRole('checkbox')
				.elements()
		).toHaveLength(8);
		await expect
			.element(
				page.getByRole('searchbox', {
					name: m.atelier.filters.searchValues(m.atelier.filters.fields.types)
				})
			)
			.not.toBeInTheDocument();
	});

	it('chooses several types', async () => {
		renderPanel();

		await page.getByRole('checkbox', { name: new RegExp(`^${m.artworkTypes.sculpture}`) }).click();
		await page.getByRole('checkbox', { name: new RegExp(`^${m.artworkTypes.painting}`) }).click();

		expect(state.current.types).toEqual(['sculpture', 'painting']);
	});

	it('writes the years with p.n.e. as negative years', async () => {
		renderPanel();

		await page.getByRole('textbox', { name: m.atelier.filters.yearFrom }).fill('30000');
		await page
			.getByRole('checkbox', { name: m.atelier.filters.beforeCommonEra, exact: true })
			.first()
			.click();
		await page.getByRole('textbox', { name: m.atelier.filters.yearTo }).fill('1600');

		expect(state.current).toMatchObject({ yearFrom: -30000, yearTo: 1600 });
	});

	it('shows the years of the filter in the fields', async () => {
		renderPanel({ ...emptyFilter(), yearFrom: -500, yearTo: 100 });

		await expect
			.element(page.getByRole('textbox', { name: m.atelier.filters.yearFrom }))
			.toHaveValue('500');
		await expect
			.element(page.getByRole('textbox', { name: m.atelier.filters.yearTo }))
			.toHaveValue('100');
		await expect
			.element(
				page.getByRole('checkbox', { name: m.atelier.filters.beforeCommonEra, exact: true }).first()
			)
			.toBeChecked();
	});

	it('ignores text that is not a year', async () => {
		renderPanel();

		await userEvent.fill(page.getByRole('textbox', { name: m.atelier.filters.yearFrom }), 'abc');

		expect(state.current).toMatchObject({ yearFrom: null, yearTo: null });
	});

	it('chooses a value of a tag field', async () => {
		renderPanel();

		await page.getByRole('button', { name: /^Sfumato/ }).click();

		expect(state.current.styles).toEqual(['Sfumato']);
	});

	it('chooses the unknown author', async () => {
		renderPanel();

		await page
			.getByRole('button', { name: new RegExp(`^${m.atelier.filters.unknownAuthor}`) })
			.click();

		expect(state.current.unknownAuthor).toBe(true);
	});

	it('hides the values that no artwork has with the other choices', async () => {
		renderPanel();

		await page.getByRole('button', { name: /^Sfumato/ }).click();

		await expect
			.element(
				page.getByRole('button', { name: new RegExp(`^${m.atelier.filters.unknownAuthor}`) })
			)
			.not.toBeInTheDocument();
	});

	it('lists what is missing', async () => {
		renderPanel();

		await page
			.getByRole('button', { name: new RegExp(`^${m.atelier.filters.missing.image}`) })
			.click();

		expect(state.current.missing).toEqual(['image']);
	});

	it('starts with the favourites tag and counts the favourites', async () => {
		render(FilterPanelHost, {
			artworks: [...artworks, testArtwork(3, 'The Kiss', { favourite: true })],
			initial: emptyFilter(),
			report: (next: CollectionFilter) => (state.current = next)
		});

		const tag = page.getByRole('button', {
			name: new RegExp(`^${m.atelier.filters.fields.favourites}.* 1$`)
		});
		await expect.element(tag).toHaveAttribute('aria-pressed', 'false');
		await tag.click();

		expect(state.current.favourites).toBe(true);
		await expect.element(tag).toHaveAttribute('aria-pressed', 'true');
	});
});
