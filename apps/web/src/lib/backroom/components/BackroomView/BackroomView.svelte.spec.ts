import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { refreshAll } from '$app/navigation';
import { deleteFlag } from '#lib/backroom/backroom-data/backroom-data.ts';
import { restoreFlag } from '#lib/backroom/flags-data/flags-data.ts';
import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import BackroomView from './BackroomView.svelte';

vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({
	countFlags: vi.fn().mockResolvedValue(1),
	deleteFlag: vi.fn().mockResolvedValue({}),
	deleteItemFlags: vi.fn().mockResolvedValue({})
}));
vi.mock('#lib/backroom/flags-data/flags-data.ts', () => ({
	restoreFlag: vi.fn().mockResolvedValue({})
}));
vi.mock('$app/navigation', () => ({ refreshAll: vi.fn().mockResolvedValue(undefined) }));

const jerome = testArtwork(12, 'Saint Jerome', { styles: ['Baroque'] });
const undated = testArtwork(3, 'Undated', { styles: ['Gothic'], yearTo: null });
const flag = {
	id: 'flag-1',
	reason: 'data' as const,
	comment: null,
	question: null,
	artworkId: jerome.id,
	termId: null,
	symbolId: null,
	eventId: null,
	symbolName: null,
	eventName: null,
	imageId: null,
	pinId: null,
	imageNumber: null,
	holds: false
};

function preventNavigation(): void {
	for (const link of page.getByRole('link').elements()) {
		link.addEventListener('click', (event) => event.preventDefault());
	}
}

describe('BackroomView', () => {
	beforeEach(() => {
		fixSession.clear();
	});

	it('lists the flags first and the missing data in the second tab', async () => {
		render(BackroomView, { flags: [flag], artworks: [jerome, undated], terms: [] });

		await expect.element(page.getByText(m.backroom.reasons.data)).toBeVisible();
		await userEvent.click(page.getByRole('tab', { name: m.backroom.tabs.missing }));

		await expect.element(page.getByText('Undated')).toBeVisible();
		await expect.element(page.getByText(m.backroom.missing.year)).toBeVisible();
	});

	it('starts the queue of the open tab', async () => {
		render(BackroomView, { flags: [flag], artworks: [jerome, undated], terms: [] });
		await userEvent.click(page.getByRole('tab', { name: m.backroom.tabs.missing }));
		await expect.element(page.getByText('Undated')).toBeVisible();
		preventNavigation();

		await userEvent.click(page.getByRole('link', { name: m.backroom.fixAll }));

		expect(fixSession.progressFor('/atelier/3/edit')).toEqual({ position: 1, total: 1 });
	});

	it('says when nothing is flagged and shows the message of a finished queue', async () => {
		render(BackroomView, {
			flags: [],
			artworks: [jerome],
			terms: [],
			message: m.backroom.done(2)
		});

		await expect.element(page.getByText(m.backroom.emptyFlagsTitle)).toBeVisible();
		await expect.element(page.getByText(m.backroom.done(2))).toBeInTheDocument();
	});

	it('says when Zaplecze cannot be loaded', async () => {
		render(BackroomView, { flags: [], artworks: [], terms: [], error: m.common.network });

		await expect.element(page.getByText(m.backroom.loadErrorTitle)).toBeVisible();
	});

	it('marks a flag as fixed from the list and brings it back with Cofnij', async () => {
		render(BackroomView, { flags: [flag], artworks: [jerome], terms: [] });

		await userEvent.click(page.getByRole('button', { name: m.backroom.markFixed }));

		expect(deleteFlag).toHaveBeenCalledWith('flag-1');
		await expect.element(page.getByText(m.backroom.emptyFlagsTitle)).toBeVisible();
		await userEvent.click(page.getByRole('button', { name: m.backroom.undo }));

		expect(restoreFlag).toHaveBeenCalledWith(flag);
		expect(refreshAll).toHaveBeenCalled();
		await expect.element(page.getByText(m.backroom.reasons.data)).toBeVisible();
	});

	it('keeps the flag and says so when marking it fails', async () => {
		vi.mocked(deleteFlag).mockResolvedValueOnce({ error: m.common.network });
		render(BackroomView, { flags: [flag], artworks: [jerome], terms: [] });

		await userEvent.click(page.getByRole('button', { name: m.backroom.markFixed }));

		await expect.element(page.getByText(m.backroom.fixErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.backroom.reasons.data)).toBeVisible();
	});

	it('visits an item once in the queue with all its flags', async () => {
		const second = { ...flag, id: 'flag-2', reason: 'note' as const };
		render(BackroomView, { flags: [flag, second], artworks: [jerome], terms: [] });
		await expect.element(page.getByText(m.backroom.reasons.note)).toBeVisible();
		preventNavigation();

		await userEvent.click(page.getByRole('link', { name: m.backroom.fixAll }));

		expect(fixSession.progressFor('/atelier/12/edit')).toEqual({ position: 1, total: 1 });
		expect(fixSession.entryFor('/atelier/12/edit')?.flagIds).toEqual(['flag-1', 'flag-2']);
	});
});
