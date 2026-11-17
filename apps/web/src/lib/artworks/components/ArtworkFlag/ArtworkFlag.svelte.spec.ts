import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { saveFlag } from '#lib/backroom/flags-data/flags-data.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import ArtworkFlag from './ArtworkFlag.svelte';

vi.mock('#lib/backroom/flags-data/flags-data.ts', () => ({
	saveFlag: vi.fn(),
	restoreFlag: vi.fn()
}));
vi.mock('#lib/backroom/flag-count/flag-count.svelte.ts', () => ({
	flagCount: { refresh: vi.fn() }
}));

const save = vi.mocked(saveFlag);

const artwork = {
	id: 'artwork-1',
	title: 'Saint Jerome',
	image: { kind: 'url', url: 'https://example.com/a.jpg', width: 1, height: 1, id: 'image-1' }
} as unknown as ArtworkRecord;

describe('ArtworkFlag', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('flags the image on the stage', async () => {
		save.mockResolvedValue({ created: true });
		const onflagged = vi.fn();
		render(ArtworkFlag, { open: true, artwork, imageId: 'image-1', onflagged });

		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.image }));
		await userEvent.click(page.getByRole('button', { name: m.backroom.confirm, exact: true }));

		await expect.poll(() => onflagged.mock.calls).toEqual([[m.backroom.flagged]]);
		expect(save).toHaveBeenCalledWith({
			item: { kind: 'artwork', id: 'artwork-1', title: 'Saint Jerome', imageId: 'image-1' },
			reason: 'image',
			comment: '',
			holds: false
		});
	});

	it('offers the pins of the stage image only', async () => {
		render(ArtworkFlag, {
			open: true,
			artwork,
			imageId: 'image-1',
			pins: [
				{ id: 'pin-1', imageId: 'image-1', x: 0.1, y: 0.1, glossaryEntryId: null, text: '' },
				{ id: 'pin-2', imageId: 'image-2', x: 0.1, y: 0.1, glossaryEntryId: null, text: '' }
			],
			onflagged: vi.fn()
		});

		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.pin }));

		await expect.element(page.getByRole('radio', { name: m.pins.marker(1) })).toBeChecked();
		await expect
			.element(page.getByRole('radio', { name: m.pins.marker(2) }))
			.not.toBeInTheDocument();
	});
});
