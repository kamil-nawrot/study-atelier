import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import BackroomView from './BackroomView.svelte';

vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({
	countFlags: vi.fn().mockResolvedValue(1),
	deleteFlag: vi.fn()
}));

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
	symbolName: null,
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
});
