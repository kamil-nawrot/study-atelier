import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import { SharedLoupe } from '#lib/compare/shared-loupe/shared-loupe.svelte.ts';
import { PaletteLoader } from '#lib/images/palette-loader/palette-loader.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import ComparisonStage from './ComparisonStage.svelte';

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;

function artwork(overrides: Partial<ArtworkRecord> = {}): ArtworkRecord {
	return {
		id: 'artwork-42',
		number: 42,
		images: [],
		favourite: false,
		title: 'Girl with a Pearl Earring',
		authors: ['Johannes Vermeer'],
		authorUnknown: false,
		yearFrom: null,
		fromBeforeCommonEra: false,
		yearTo: 1665,
		toBeforeCommonEra: false,
		yearApproximate: true,
		typeCode: 'painting',
		eraCode: 'early_modern',
		period: null,
		styles: [],
		materials: [],
		location: null,
		notes: '',
		image: { kind: 'url', url: IMAGE, width: 40, height: 50, id: 'image-1' },
		...overrides
	};
}

async function renderStage(
	overrides: Partial<ArtworkRecord> = {},
	props: { changeable?: boolean; onchange?: () => void } = {}
): Promise<void> {
	await render(ComparisonStage, {
		artwork: artwork(overrides),
		changeable: props.changeable ?? true,
		loupe: new SharedLoupe(),
		onready: vi.fn(),
		onchange: props.onchange ?? vi.fn(),
		palette: new PaletteLoader(),
		paletteOn: false
	});
}

describe('ComparisonStage', () => {
	it('shows the image with the title, the authors and the year', async () => {
		await renderStage();

		await expect
			.element(page.getByRole('img', { name: 'Girl with a Pearl Earring, Johannes Vermeer' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Girl with a Pearl Earring')).toBeVisible();
		await expect.element(page.getByText(/Johannes Vermeer · /)).toBeVisible();
	});

	it('names an unknown author', async () => {
		await renderStage({ authors: [], authorUnknown: true, yearTo: null });

		await expect.element(page.getByText(m.ui.unknownAuthor)).toBeVisible();
	});

	it('shows a placeholder for an artwork without an image', async () => {
		await renderStage({ image: null });

		expect(document.querySelector('img.backdrop')).toBeNull();
		await expect.element(page.getByText('Girl with a Pearl Earring')).toBeVisible();
	});

	it('empties the half from "Zmień dzieło"', async () => {
		const onchange = vi.fn();
		await renderStage({}, { onchange });

		await page.getByRole('button', { name: m.compare.change }).click();

		expect(onchange).toHaveBeenCalledOnce();
	});

	it('hides "Zmień dzieło" while the other half is empty', async () => {
		await renderStage({}, { changeable: false });

		await expect
			.element(page.getByRole('button', { name: m.compare.change }))
			.not.toBeInTheDocument();
	});
});
