import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { deleteTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
import { refreshExpiredImages, resolveImages } from '#lib/wall/wall-data/wall-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import EventPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/timeline/events/e'), state: {}, data: {} },
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	refreshExpiredImages: vi.fn(),
	resolveImages: vi.fn()
}));
vi.mock('#lib/timeline/timeline-data/timeline-data.ts', () => ({ deleteTimelineEvent: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const paxRomana: TimelineEvent = {
	id: 'e',
	name: 'Pax Romana',
	yearFrom: -27,
	yearTo: 180,
	yearApproximate: true,
	description: 'Pokój w cesarstwie.',
	source: null
};

describe('timeline event page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(resolveImages).mockResolvedValue([]);
		vi.mocked(refreshExpiredImages).mockResolvedValue([]);
		await page.viewport(1280, 800);
	});

	it('shows the event with the artworks of its time', async () => {
		render(EventPage, {
			data: {
				session: testSession(),
				event: paxRomana,
				artworks: [testArtwork(2, 'Ara Pacis', { yearFrom: -13, yearTo: -9 })]
			},
			params: { id: 'e' }
		});

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Pax Romana');
		await expect
			.element(page.getByText(m.valuePage.header(m.cardIndex.eventKinds.span, m.atelier.count(1))))
			.toBeVisible();
		await expect.element(page.getByText('Pokój w cesarstwie.')).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.timeline.card.artworksOfTime }))
			.toBeVisible();
		await expect.element(page.getByRole('link', { name: /Ara Pacis/ })).toBeVisible();
	});

	it('links Edytuj to the form and returns to the card index after deleting', async () => {
		vi.mocked(deleteTimelineEvent).mockResolvedValue({});
		render(EventPage, {
			data: { session: testSession(), event: paxRomana, artworks: [] },
			params: { id: 'e' }
		});

		await expect.element(page.getByText(m.timeline.card.noArtworks)).toBeVisible();
		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.common.edit }))
			.toHaveAttribute('href', '/atelier/timeline/events/e/edit');
		await page.getByRole('banner').getByRole('button', { name: m.common.delete }).click();
		await page.getByRole('alertdialog').getByRole('button', { name: m.common.delete }).click();

		expect(deleteTimelineEvent).toHaveBeenCalledWith('e');
		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/values', {
				refreshAll: true,
				state: { valueMessage: m.timeline.deleted('Pax Romana') }
			})
		);
	});

	it('says when the event no longer exists', async () => {
		render(EventPage, {
			data: { session: testSession(), notFound: true, artworks: [] },
			params: { id: 'e' }
		});

		await expect.element(page.getByText(m.timeline.errors.notFound)).toBeVisible();
	});
});
