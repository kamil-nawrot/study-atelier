import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/index.ts';
import { testSession } from '#lib/testing/auth.ts';
import { saveTimelineEvent } from '#lib/timeline/timeline-data.ts';
import NewEventPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/timeline/events/new'), state: {}, data: {} },
	navigating: { to: null }
}));
vi.mock('#lib/timeline/timeline-data.ts', () => ({ saveTimelineEvent: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const save = vi.mocked(saveTimelineEvent);

function renderNew(): void {
	render(NewEventPage, { data: { session: testSession() }, params: {} });
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.timeline.form.save, exact: true });
}

describe('new timeline event page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
	});

	it('shows the title, the name, the date and the description', async () => {
		renderNew();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.timeline.form.newTitle);
		await expect.element(page.getByLabelText(m.timeline.form.name)).toBeVisible();
		await expect.element(page.getByRole('group', { name: m.timeline.form.year })).toBeVisible();
		await expect.element(page.getByLabelText(m.timeline.form.description)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.timeline.form.cancel }))
			.toHaveAttribute('href', '/atelier/timeline');
	});

	it('asks for a name and a year before saving', async () => {
		renderNew();

		await saveButton().click();

		await expect.element(page.getByText(m.timeline.form.nameRequired)).toBeVisible();
		await expect.element(page.getByText(m.timeline.form.yearRequired)).toBeVisible();
		expect(save).not.toHaveBeenCalled();
	});

	it('saves a period and returns to the timeline at it', async () => {
		save.mockResolvedValue({ id: 'event-1' });
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Wojny napoleońskie');
		await page.getByText(m.artworkForm.spanSwitch, { exact: true }).click();
		await userEvent.fill(page.getByRole('textbox', { name: m.artworkForm.spanFrom }), '1803');
		await userEvent.fill(page.getByRole('textbox', { name: m.artworkForm.spanTo }), '1815');
		await saveButton().click();

		await vi.waitFor(() =>
			expect(save).toHaveBeenCalledWith(
				{
					name: 'Wojny napoleońskie',
					yearFrom: 1803,
					yearTo: 1815,
					yearApproximate: false,
					description: ''
				},
				undefined
			)
		);
		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/timeline', {
				replace: true,
				refreshAll: true,
				state: {
					timelineEvent: {
						message: m.timeline.saved('Wojny napoleońskie'),
						yearFrom: 1803,
						yearTo: 1815
					}
				}
			})
		);
	});

	it('keeps the form and shows the error when saving fails', async () => {
		save.mockResolvedValue({ error: m.timeline.errors.invalid });
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Narodziny Jezusa');
		await userEvent.fill(page.getByRole('textbox', { name: m.timeline.form.year }), '4');
		await page.getByText(m.artworkForm.beforeCommonEra, { exact: true }).click();
		await saveButton().click();

		await expect.element(page.getByText(m.timeline.form.errorTitle, { exact: true })).toBeVisible();
		expect(save).toHaveBeenCalledWith(expect.objectContaining({ yearTo: -4 }), undefined);
		expect(goto).not.toHaveBeenCalled();
	});
});
