import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { paletteOf } from '#lib/images/image-palette/image-palette.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import { m } from '#lib/i18n/i18n.ts';
import ArtworkStage from './ArtworkStage.svelte';

vi.mock('$app/state', () => ({ page: { data: {}, url: new URL('http://localhost/atelier/42') } }));
vi.mock('#lib/images/image-palette/image-palette.ts', () => ({ paletteOf: vi.fn() }));
vi.mock('#lib/pins/pin-crop/pin-crop.ts', () => ({ ensurePinCrops: vi.fn() }));

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;
const COLOURS = [
	{ color: '#aa8855', share: 0.7 },
	{ color: '#223344', share: 0.3 }
];

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

async function renderStage(record: ArtworkRecord = artwork()): Promise<void> {
	await render(ArtworkStage, {
		artwork: record,
		editHref: '/atelier/42/edit',
		pins: [],
		showPinsOnOpen: false,
		loupeOnOpen: false
	});
}

function paletteButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.palette.label });
}

describe('ArtworkStage palette', () => {
	beforeEach(() => {
		vi.mocked(paletteOf).mockReset();
		vi.mocked(paletteOf).mockResolvedValue({ colours: COLOURS });
	});

	it('keeps the palette hidden until the learner asks for it and hides it again', async () => {
		await renderStage();

		expect(document.querySelector('.band')).toBeNull();
		await paletteButton().click();
		await expect.element(page.getByRole('list', { name: m.palette.label })).toBeInTheDocument();
		await expect.element(paletteButton()).toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText('#aa8855')).toBeInTheDocument();

		await paletteButton().click();
		expect(document.querySelector('.band')).toBeNull();
		await expect.element(paletteButton()).toHaveAttribute('aria-pressed', 'false');
	});

	it('names the action of the icon in its tooltip', async () => {
		await renderStage();

		await paletteButton().hover();
		await expect.element(page.getByRole('tooltip')).toHaveTextContent(m.palette.label);
		await paletteButton().click();
		await expect.element(page.getByRole('tooltip')).toHaveTextContent(m.palette.hide);
	});

	it('says that the colours are being collected while they are read', async () => {
		vi.mocked(paletteOf).mockReturnValue(new Promise(() => {}));
		await renderStage();

		await paletteButton().click();

		await expect.element(page.getByText(m.palette.collecting)).toBeInTheDocument();
	});

	it('dims the icon of an image whose colours cannot be read and explains why', async () => {
		vi.mocked(paletteOf).mockResolvedValue({ unreadable: true });
		await renderStage();

		await paletteButton().click();
		await expect.element(paletteButton()).toHaveAttribute('aria-disabled', 'true');
		expect(document.querySelector('.band')).toBeNull();
		await paletteButton().hover();
		await expect.element(page.getByRole('tooltip')).toHaveTextContent(m.palette.unreadable);
	});

	it('offers no palette to an artwork without an image', async () => {
		await renderStage(artwork({ image: null }));

		await expect.element(paletteButton()).not.toBeInTheDocument();
	});
});
