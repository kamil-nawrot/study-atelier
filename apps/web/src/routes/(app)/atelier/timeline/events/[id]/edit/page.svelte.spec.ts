import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { searchEvents } from '#lib/timeline/wikipedia/wikipedia.ts';
import EditEventPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/timeline/events/e/edit'), state: {}, data: {} },
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('#lib/timeline/timeline-data/timeline-data.ts', () => ({ saveTimelineEvent: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/timeline/wikipedia/wikipedia.ts', () => ({
	searchEvents: vi.fn().mockResolvedValue([])
}));

describe('edit timeline event page', () => {
	beforeEach(async () => {
		await page.viewport(1280, 800);
	});

	it('fills the form with the event', async () => {
		render(EditEventPage, {
			data: {
				session: testSession(),
				event: {
					id: 'e',
					name: 'Pax Romana',
					yearFrom: -27,
					yearTo: 180,
					yearApproximate: true,
					description: 'Pokój w cesarstwie.',
					source: null
				}
			},
			params: { id: 'e' }
		});

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.timeline.form.editTitle);
		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Pax Romana');
		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.spanFrom }))
			.toHaveValue('27');
		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.spanTo }))
			.toHaveValue('180');
		await expect
			.element(page.getByLabelText(m.timeline.form.description, { exact: true }))
			.toHaveValue('Pokój w cesarstwie.');
	});

	it('says when the event no longer exists', async () => {
		render(EditEventPage, {
			data: { session: testSession(), notFound: true },
			params: { id: 'e' }
		});

		await expect.element(page.getByText(m.timeline.errors.notFound)).toBeVisible();
		await expect.element(page.getByLabelText(m.common.name)).not.toBeInTheDocument();
	});

	it('does not search Wikipedia by itself for an event without a description', async () => {
		render(EditEventPage, {
			data: {
				session: testSession(),
				event: {
					id: 'e',
					name: 'Chrzest Polski',
					yearFrom: null,
					yearTo: 966,
					yearApproximate: false,
					description: '',
					source: null
				}
			},
			params: { id: 'e' }
		});

		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Chrzest Polski');
		await new Promise((resolve) => setTimeout(resolve, 900));
		expect(searchEvents).not.toHaveBeenCalled();
	});
});
