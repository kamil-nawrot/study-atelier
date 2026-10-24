import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { createPin, deletePin, updatePin } from '#lib/pins/pin-data/pin-data.ts';
import type { Pin } from '#lib/pins/types/pin.ts';
import PinDialog from './PinDialog.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/pins/pin-data/pin-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/pins/pin-data/pin-data.ts')>()),
	createPin: vi.fn(),
	updatePin: vi.fn(),
	deletePin: vi.fn()
}));

const SAVED: Pin = {
	id: 'pin-1',
	imageId: 'image-1',
	x: 0.25,
	y: 0.75,
	glossaryEntryId: null,
	text: 'A detail'
};
const ENTRIES = [testEntry('entry-1', 'Apse')];
const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"/>')}`;

function open(overrides: Record<string, unknown> = {}): {
	onsaved: Mock;
	ondeleted: Mock;
} {
	const onsaved = vi.fn();
	const ondeleted = vi.fn();
	render(PinDialog, {
		open: true,
		imageId: 'image-1',
		spot: { x: 0.25, y: 0.75 },
		entries: ENTRIES,
		onsaved,
		ondeleted,
		...overrides
	});
	return { onsaved, ondeleted };
}

describe('PinDialog', () => {
	beforeEach(() => {
		vi.mocked(createPin).mockReset();
		vi.mocked(updatePin).mockReset();
		vi.mocked(deletePin).mockReset();
	});

	it('creates a pin at the chosen spot', async () => {
		vi.mocked(createPin).mockResolvedValue({ pin: SAVED });
		const { onsaved } = open();

		await userEvent.fill(page.getByLabelText('Opis (opcjonalnie)'), 'A detail');
		await page.getByRole('button', { name: 'Zapisz' }).click();

		expect(createPin).toHaveBeenCalledWith('image-1', {
			x: 0.25,
			y: 0.75,
			glossaryEntryId: null,
			text: 'A detail'
		});
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalledWith(SAVED));
	});

	it('refuses an empty pin without calling the server', async () => {
		open();

		await page.getByRole('button', { name: 'Zapisz' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Wybierz pojęcie albo wpisz opis.');
		expect(createPin).not.toHaveBeenCalled();
	});

	it('updates an existing pin and keeps its place', async () => {
		vi.mocked(updatePin).mockResolvedValue({ pin: { ...SAVED, text: 'Changed' } });
		const { onsaved } = open({ pin: SAVED });

		await userEvent.fill(page.getByLabelText('Opis (opcjonalnie)'), 'Changed');
		await page.getByRole('button', { name: 'Zapisz' }).click();

		expect(updatePin).toHaveBeenCalledWith('pin-1', {
			x: 0.25,
			y: 0.75,
			glossaryEntryId: null,
			text: 'Changed'
		});
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
	});

	it('shows the server error and stays open', async () => {
		vi.mocked(createPin).mockResolvedValue({ error: 'Nie udało się połączyć z serwerem.' });
		const { onsaved } = open();

		await userEvent.fill(page.getByLabelText('Opis (opcjonalnie)'), 'A detail');
		await page.getByRole('button', { name: 'Zapisz' }).click();

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Nie udało się połączyć z serwerem.');
		expect(onsaved).not.toHaveBeenCalled();
	});

	it('deletes a pin', async () => {
		vi.mocked(deletePin).mockResolvedValue({});
		const { ondeleted } = open({ pin: SAVED });

		await page.getByRole('button', { name: 'Usuń' }).click();

		expect(deletePin).toHaveBeenCalledWith('pin-1');
		await vi.waitFor(() => expect(ondeleted).toHaveBeenCalledWith(SAVED));
	});

	it('offers no delete for a new pin', async () => {
		open();

		expect(page.getByRole('button', { name: 'Usuń' }).elements()).toHaveLength(0);
	});

	it('saves a pin that keeps only the view of the loupe', async () => {
		vi.mocked(createPin).mockResolvedValue({ pin: { ...SAVED, text: '', viewWidth: 0.1 } });
		const { onsaved } = open({
			image: { kind: 'url', url: IMAGE, width: 4000, height: 3000 },
			view: 0.1,
			shownWidth: 550
		});

		await expect.element(page.getByText('Widok lupy (4×)')).toBeVisible();
		await page.getByRole('button', { name: 'Zapisz' }).click();

		expect(createPin).toHaveBeenCalledWith('image-1', {
			x: 0.25,
			y: 0.75,
			glossaryEntryId: null,
			text: '',
			viewWidth: 0.1
		});
		await vi.waitFor(() => expect(onsaved).toHaveBeenCalled());
	});

	it('removes the view of a saved pin', async () => {
		vi.mocked(updatePin).mockResolvedValue({ pin: SAVED });
		open({
			pin: { ...SAVED, viewWidth: 0.1 },
			image: { kind: 'url', url: IMAGE, width: 4000, height: 3000 }
		});

		await page.getByRole('button', { name: 'Usuń widok' }).click();
		await expect.element(page.getByText('Widok lupy')).not.toBeInTheDocument();
		await page.getByRole('button', { name: 'Zapisz' }).click();

		expect(updatePin).toHaveBeenCalledWith('pin-1', {
			x: 0.25,
			y: 0.75,
			glossaryEntryId: null,
			text: 'A detail'
		});
	});
});
