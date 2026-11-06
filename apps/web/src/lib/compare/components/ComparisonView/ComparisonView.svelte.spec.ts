import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { goto } from '$app/navigation';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import { paletteOf } from '#lib/images/image-palette/image-palette.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import ComparisonView from './ComparisonView.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn(), afterNavigate: vi.fn() }));
vi.mock('#lib/images/image-palette/image-palette.ts', () => ({ paletteOf: vi.fn() }));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	loadAtelier: vi.fn(),
	resolveImages: vi.fn(),
	refreshExpiredImages: vi.fn()
}));

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;
const COLOURS = [{ color: '#aa8855', share: 1 }];

function artwork(
	number: number,
	title: string,
	overrides: Partial<ArtworkRecord> = {}
): ArtworkRecord {
	return {
		id: `artwork-${number}`,
		number,
		images: [],
		favourite: false,
		title,
		authors: ['Johannes Vermeer'],
		authorUnknown: false,
		yearFrom: null,
		fromBeforeCommonEra: false,
		yearTo: 1665,
		toBeforeCommonEra: false,
		yearApproximate: false,
		typeCode: 'painting',
		eraCode: 'early_modern',
		period: null,
		styles: [],
		materials: [],
		location: null,
		notes: '',
		image: { kind: 'url', url: IMAGE, width: 40, height: 50, id: `image-${number}` },
		...overrides
	};
}

const LEFT = artwork(1, 'Girl with a Pearl Earring');
const RIGHT = artwork(2, 'The Milkmaid');

describe('ComparisonView', () => {
	beforeEach(() => {
		vi.mocked(goto).mockReset();
		vi.mocked(paletteOf).mockReset();
		vi.mocked(paletteOf).mockResolvedValue({ colours: COLOURS });
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [] });
	});

	it('shows both artworks and offers to change either of them', async () => {
		await render(ComparisonView, { sides: { left: 1, right: 2 }, left: LEFT, right: RIGHT });

		await expect.element(page.getByText('Girl with a Pearl Earring')).toBeVisible();
		await expect.element(page.getByText('The Milkmaid')).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.compare.change }).first())
			.toBeVisible();
	});

	it('empties one half and keeps the other in the address', async () => {
		await render(ComparisonView, { sides: { left: 1, right: 2 }, left: LEFT, right: RIGHT });

		await page.getByRole('button', { name: m.compare.change }).first().click();

		expect(goto).toHaveBeenCalledWith('/atelier/compare?right=2', { replaceState: true });
	});

	it('puts the picker in the empty half and no change button on the artwork', async () => {
		await render(ComparisonView, { sides: { left: 1, right: null }, left: LEFT });

		await expect
			.element(page.getByRole('heading', { name: m.compare.question('Girl with a Pearl Earring') }))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.compare.change }))
			.not.toBeInTheDocument();
	});

	it('shows the palettes of both images behind one icon', async () => {
		await render(ComparisonView, { sides: { left: 1, right: 2 }, left: LEFT, right: RIGHT });

		await page.getByRole('button', { name: m.palette.label }).click();

		await expect.poll(() => document.querySelectorAll('.band').length).toBe(2);
		expect(paletteOf).toHaveBeenCalledTimes(2);
		await page.getByRole('button', { name: m.palette.label }).click();
		expect(document.querySelector('.band')).toBeNull();
	});

	it('dims the palette icon when no image can be read', async () => {
		vi.mocked(paletteOf).mockResolvedValue({ unreadable: true });
		await render(ComparisonView, { sides: { left: 1, right: 2 }, left: LEFT, right: RIGHT });

		await page.getByRole('button', { name: m.palette.label }).click();

		await expect
			.element(page.getByRole('button', { name: m.palette.label }))
			.toHaveAttribute('aria-disabled', 'true');
	});

	it('offers no palette when neither artwork has an image', async () => {
		await render(ComparisonView, {
			sides: { left: 1, right: 2 },
			left: artwork(1, 'A', { image: null }),
			right: artwork(2, 'B', { image: null })
		});

		await expect
			.element(page.getByRole('button', { name: m.palette.label }))
			.not.toBeInTheDocument();
	});

	it('dims the loupe when neither image is large enough and says why', async () => {
		await render(ComparisonView, { sides: { left: 1, right: 2 }, left: LEFT, right: RIGHT });

		const loupe = page.getByRole('button', { name: m.loupe.label });
		await expect.element(loupe).toHaveAttribute('aria-disabled', 'true');
		await loupe.hover();
		await expect.element(page.getByRole('tooltip').first()).toHaveTextContent(m.loupe.unavailable);
	});

	it('switches one loupe on for both large images', async () => {
		const large = { kind: 'url', url: IMAGE, width: 4000, height: 5000 } as const;
		await render(ComparisonView, {
			sides: { left: 1, right: 2 },
			left: artwork(1, 'A', { image: { ...large, id: 'a' } }),
			right: artwork(2, 'B', { image: { ...large, id: 'b' } })
		});

		const toggle = page.getByRole('button', { name: m.loupe.label });
		await toggle.hover();
		await expect.element(page.getByRole('tooltip').first()).toHaveTextContent(m.compare.loupeBoth);
		await toggle.click();

		await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');
		expect(document.querySelectorAll('.loupe')).toHaveLength(2);
	});
});
