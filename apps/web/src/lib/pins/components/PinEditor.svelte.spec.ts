import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { testEntry } from '#lib/testing/glossary.ts';
import { createPin, movePin } from '../pin-data.ts';
import type { Pin } from '../types.ts';
import PinEditor from './PinEditor.svelte';

vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));
vi.mock('../pin-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('../pin-data.ts')>()),
	createPin: vi.fn(),
	movePin: vi.fn()
}));

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;
const PIN: Pin = {
	id: 'pin-1',
	imageId: 'image-1',
	x: 0.25,
	y: 0.75,
	glossaryEntryId: 'entry-1',
	text: 'The sitter’s turban.'
};

function open(pins: Pin[] = [PIN]): void {
	render(PinEditor, {
		open: true,
		alt: 'Girl with a Pearl Earring',
		source: { src: IMAGE, width: 40, height: 50 },
		imageId: 'image-1',
		pins,
		entries: [testEntry('entry-1', 'Turban')]
	});
}

describe('PinEditor', () => {
	beforeEach(() => {
		vi.mocked(createPin).mockReset();
		vi.mocked(movePin).mockReset();
	});

	it('places a new pin and keeps its marker', async () => {
		vi.mocked(createPin).mockResolvedValue({
			pin: { ...PIN, id: 'pin-2', glossaryEntryId: null, text: 'Pearl' }
		});
		open([]);

		await page.getByRole('button', { name: m.pins.placeHere }).click();
		await userEvent.fill(page.getByLabelText(m.pins.text), 'Pearl');
		await page.getByRole('button', { name: m.pins.save }).click();

		expect(createPin).toHaveBeenCalledWith('image-1', expect.objectContaining({ text: 'Pearl' }));
		await expect.element(page.getByRole('button', { name: 'Pinezka 1' })).toBeVisible();
	});

	it('reverts a pin that could not be moved and shows the error', async () => {
		vi.mocked(movePin).mockResolvedValue({ error: 'Nie udało się połączyć z serwerem.' });
		open();

		page.getByRole('button', { name: 'Pinezka 1: Turban' }).element().focus();
		await userEvent.keyboard('{ArrowRight}');

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Nie udało się połączyć z serwerem.');
		expect(movePin).toHaveBeenCalledWith('pin-1', 0.27, 0.75);
		await expect
			.element(page.getByRole('button', { name: 'Pinezka 1: Turban' }))
			.toHaveStyle({ left: '25%' });
	});

	it('opens a saved pin for editing', async () => {
		open();

		await page.getByRole('button', { name: 'Pinezka 1: Turban' }).click();

		await expect.element(page.getByRole('dialog', { name: m.pins.title })).toBeVisible();
	});
});
