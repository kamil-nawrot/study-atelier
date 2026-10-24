import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { createPin, movePin } from '#lib/pins/pin-data/pin-data.ts';
import type { Pin } from '#lib/pins/types.ts';
import PinLayer from './PinLayer.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/pins/pin-data/pin-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/pins/pin-data/pin-data.ts')>()),
	createPin: vi.fn(),
	movePin: vi.fn()
}));

const PIN: Pin = {
	id: 'pin-1',
	imageId: 'image-1',
	x: 0.25,
	y: 0.75,
	glossaryEntryId: 'entry-1',
	text: 'The sitter’s turban.'
};

function layer(pins: Pin[] = [PIN]): void {
	render(PinLayer, {
		imageId: 'image-1',
		pins,
		entries: [testEntry('entry-1', 'Turban')],
		onfailure: vi.fn()
	});
}

describe('PinLayer', () => {
	beforeEach(() => {
		vi.mocked(createPin).mockReset();
		vi.mocked(movePin).mockReset();
	});

	it('places a new pin and keeps its marker', async () => {
		vi.mocked(createPin).mockResolvedValue({
			pin: { ...PIN, id: 'pin-2', glossaryEntryId: null, text: 'Pearl' }
		});
		layer([]);

		await page.getByRole('button', { name: m.pins.placeHere }).click();
		await userEvent.fill(page.getByLabelText(m.pins.text), 'Pearl');
		await page.getByRole('button', { name: m.pins.save }).click();

		expect(createPin).toHaveBeenCalledWith('image-1', expect.objectContaining({ text: 'Pearl' }));
		await expect.element(page.getByRole('button', { name: 'Pinezka 1' })).toBeVisible();
	});

	it('reverts a pin that could not be moved', async () => {
		vi.mocked(movePin).mockResolvedValue({ error: 'Nie udało się połączyć z serwerem.' });
		layer();

		page.getByRole('button', { name: 'Pinezka 1: Turban' }).element().focus();
		await userEvent.keyboard('{ArrowRight}');

		await vi.waitFor(() => expect(movePin).toHaveBeenCalledWith('pin-1', 0.27, 0.75));
		await expect
			.element(page.getByRole('button', { name: 'Pinezka 1: Turban' }))
			.toHaveStyle({ left: '25%' });
	});

	it('opens a saved pin for editing', async () => {
		layer();

		await page.getByRole('button', { name: 'Pinezka 1: Turban' }).click();

		await expect.element(page.getByRole('dialog', { name: m.pins.title })).toBeVisible();
	});
});
