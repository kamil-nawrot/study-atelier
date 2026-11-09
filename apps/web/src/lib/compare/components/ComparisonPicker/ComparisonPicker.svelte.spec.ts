import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import ComparisonPicker from './ComparisonPicker.svelte';

vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	loadAtelier: vi.fn(),
	resolveImages: vi.fn(),
	refreshExpiredImages: vi.fn()
}));

function artwork(number: number, title: string, authors: string[]): WallArtwork {
	return {
		id: `artwork-${number}`,
		number,
		title,
		authors,
		yearFrom: null,
		yearTo: null,
		eraCode: null,
		typeCode: null,
		period: null,
		styles: [],
		materials: [],
		location: null,
		hasImage: false,
		favourite: false
	};
}

const ARTWORKS = [
	artwork(1, 'Mona Lisa', ['Leonardo da Vinci']),
	artwork(2, 'The Birth of Venus', ['Sandro Botticelli']),
	artwork(3, 'The Night Watch', ['Rembrandt'])
];

describe('ComparisonPicker', () => {
	beforeEach(() => {
		vi.mocked(loadAtelier).mockReset();
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: ARTWORKS });
	});

	it('asks what to compare the shown artwork with and lists the others', async () => {
		await render(ComparisonPicker, {
			sides: { left: 1, right: null },
			empty: 'right',
			other: { title: 'Mona Lisa' }
		});

		await expect
			.element(page.getByRole('heading', { name: m.compare.question('Mona Lisa') }))
			.toBeVisible();
		await expect.element(page.getByText('The Birth of Venus')).toBeVisible();
		await expect.element(page.getByText('The Night Watch')).toBeVisible();
		await expect.element(page.getByText('Mona Lisa', { exact: true })).not.toBeInTheDocument();
	});

	it('links each tile to the comparison with that artwork in the empty half', async () => {
		await render(ComparisonPicker, {
			sides: { left: 1, right: null },
			empty: 'right',
			other: { title: 'Mona Lisa' }
		});

		await expect
			.element(page.getByRole('link', { name: /The Night Watch/ }))
			.toHaveAttribute('href', '/atelier/compare?left=1&right=3');
	});

	it('puts the artwork in the left half when that one is empty', async () => {
		await render(ComparisonPicker, {
			sides: { left: null, right: 1 },
			empty: 'left',
			other: { title: 'Mona Lisa' }
		});

		await expect
			.element(page.getByRole('link', { name: /The Night Watch/ }))
			.toHaveAttribute('href', '/atelier/compare?left=3&right=1');
	});

	it('narrows the tiles by title, author or record number', async () => {
		await render(ComparisonPicker, {
			sides: { left: 1, right: null },
			empty: 'right',
			other: { title: 'Mona Lisa' }
		});
		const search = page.getByRole('searchbox', { name: m.compare.search });

		await userEvent.fill(search, 'rembr');
		await expect.element(page.getByText('The Night Watch')).toBeVisible();
		await expect.element(page.getByText('The Birth of Venus')).not.toBeInTheDocument();

		await userEvent.fill(search, '#0002');
		await expect.element(page.getByText('The Birth of Venus')).toBeVisible();
		await expect.element(page.getByText('The Night Watch')).not.toBeInTheDocument();
	});

	it('says what the wall says when nothing matches', async () => {
		await render(ComparisonPicker, {
			sides: { left: 1, right: null },
			empty: 'right',
			other: { title: 'Mona Lisa' }
		});

		await userEvent.fill(page.getByRole('searchbox', { name: m.compare.search }), 'zzz');

		await expect.element(page.getByText(m.atelier.noResultsTitle)).toBeVisible();
		await expect.element(page.getByText(m.atelier.noResults('zzz'))).toBeVisible();
	});

	it('asks which artworks to compare when both halves are empty', async () => {
		await render(ComparisonPicker, { sides: { left: null, right: null }, empty: 'left' });

		await expect
			.element(page.getByRole('heading', { name: m.compare.questionEmpty }))
			.toBeVisible();
	});

	it('shows a load failure', async () => {
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [], error: 'Network down' });
		await render(ComparisonPicker, { sides: { left: 1, right: null }, empty: 'right' });

		await expect.element(page.getByText('Network down')).toBeVisible();
	});
});
