import { page, userEvent } from 'vitest/browser';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export const dated = [
	testArtwork(1, 'Mona Lisa', { yearTo: 1503, eraCode: 'early_modern' }),
	testArtwork(2, 'Water Lilies', { yearTo: 1906, eraCode: 'modern' }),
	testArtwork(3, 'Impression, Sunrise', { yearTo: 1872, eraCode: 'modern' }),
	testArtwork(4, 'Untitled study', { yearTo: 1800, eraCode: null })
];

export function manyPeriods(): WallArtwork[] {
	return (
		[
			['early_modern', 1500],
			['modern', 1850],
			['contemporary', 1960]
		] as const
	).flatMap(([eraCode, year], block) =>
		[0, 1, 2, 3].map((position) =>
			testArtwork(block * 4 + position + 1, `${m.eras[eraCode].name} ${position + 1}`, {
				yearTo: year + position,
				eraCode
			})
		)
	);
}

export const byAuthors = [
	testArtwork(1, 'Water Lilies', { yearTo: 1906, authors: ['Claude Monet'] }),
	testArtwork(2, 'Untitled study', { yearTo: 1800, authors: [] }),
	testArtwork(3, 'Melancholia', { yearTo: 1514, authors: ['Albrecht Dürer', 'Claude Monet'] }),
	testArtwork(4, 'Impression, Sunrise', { yearTo: 1872, authors: ['Claude Monet'] }),
	testArtwork(5, 'Self-portrait', { yearTo: 1500, authors: ['Albrecht Dürer'] })
];

export function manyAuthors(count: number): WallArtwork[] {
	return Array.from({ length: count }, (_, index) =>
		testArtwork(index + 1, `Study ${index + 1}`, {
			yearTo: 1800 + index,
			authors: [`Author ${String(index + 1).padStart(2, '0')}`]
		})
	);
}

export function orderSelect(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.atelier.sort.label });
}

function groupingStep(grouping: 'era' | 'period' | 'style'): ReturnType<typeof page.getByRole> {
	return page
		.getByRole('group', { name: m.atelier.grouping.label })
		.getByRole('button', { name: m.atelier.grouping.steps[grouping] });
}

export function groupingButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.atelier.grouping.button('') });
}

export async function chooseGrouping(grouping: 'era' | 'period' | 'style'): Promise<void> {
	const wide = window.innerWidth >= 768;
	if (wide) await groupingButton().click();
	else await page.getByRole('button', { name: m.atelier.filters.viewButton }).click();
	await groupingStep(grouping).click();
	await userEvent.keyboard('{Escape}');
}

export const styled = [
	testArtwork(1, 'Mona Lisa', {
		yearTo: 1503,
		eraCode: 'early_modern',
		typeCode: 'painting',
		styles: ['Renaissance']
	}),
	testArtwork(2, 'Water Lilies', {
		yearTo: 1906,
		eraCode: 'modern',
		typeCode: 'painting',
		styles: ['Impressionism'],
		authors: ['Monet']
	}),
	testArtwork(3, 'Impression, Sunrise', {
		yearTo: 1872,
		eraCode: 'modern',
		typeCode: 'painting',
		styles: ['Impressionism'],
		authors: ['Monet'],
		hasImage: false
	}),
	testArtwork(4, 'The Thinker', { yearTo: 1904, eraCode: 'modern', typeCode: 'sculpture' })
];

export const periods = [
	testArtwork(3, 'Night Watch', { yearTo: 1642, eraCode: 'early_modern', period: 'barok' }),
	testArtwork(2, 'Calling of Saint Matthew', {
		yearTo: 1600,
		eraCode: 'early_modern',
		period: 'barok',
		styles: ['caravaggionizm', 'barok']
	}),
	testArtwork(1, 'Mona Lisa', {
		yearTo: 1503,
		eraCode: 'early_modern',
		period: 'renesans',
		styles: ['wysoki renesans']
	}),
	testArtwork(4, 'Water Lilies', { yearTo: 1906, eraCode: 'modern' })
];

export function filtersButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: new RegExp(`^${m.atelier.filters.button}`) });
}

export function eraTile(code: keyof typeof m.eras): ReturnType<typeof page.getByRole> {
	return page.getByRole('checkbox', { name: new RegExp(`^${m.eras[code].name}`) });
}

export function titlesOnTheWall(list: WallArtwork[]): string[] {
	return page
		.getByRole('link')
		.elements()
		.flatMap((link) => list.find((artwork) => link.textContent?.includes(artwork.title)) ?? [])
		.map((artwork) => artwork.title);
}

export function scrollToTheEnd(): void {
	window.scrollTo({ top: document.documentElement.scrollHeight });
}

export function searchField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('searchbox', { name: m.atelier.search });
}
