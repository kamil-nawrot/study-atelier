import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { afterNavigate, goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { saveTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
import type { EventArticle } from '#lib/timeline/types/event-article.ts';
import { searchEvents } from '#lib/timeline/wikipedia/wikipedia.ts';
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
vi.mock('#lib/timeline/timeline-data/timeline-data.ts', () => ({ saveTimelineEvent: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/timeline/wikipedia/wikipedia.ts', () => ({ searchEvents: vi.fn() }));

const save = vi.mocked(saveTimelineEvent);
const search = vi.mocked(searchEvents);

function article(
	title: string,
	extract: string,
	yearFrom: number | null,
	yearTo: number,
	approximate = false
): EventArticle {
	return {
		title,
		url: `https://pl.wikipedia.org/wiki/${encodeURIComponent(title)}`,
		extract,
		dates: { yearFrom, yearTo, approximate }
	};
}

const deluge = article('Potop szwedzki', 'Najazd Szwecji na Rzeczpospolitą.', 1655, 1660);
const vienna = article('Bitwa pod Wiedniem', 'Bitwa z 1683 roku.', null, 1683);

function renderNew(): void {
	render(NewEventPage, { data: { session: testSession() }, params: {} });
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.timeline.form.save, exact: true });
}

describe('new timeline event page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		vi.mocked(afterNavigate).mockReset();
		search.mockResolvedValue([]);
		autoFetch.event = true;
		await page.viewport(1280, 800);
	});

	it('shows the title, the name, the date and the description', async () => {
		renderNew();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.timeline.form.newTitle);
		await expect.element(page.getByLabelText(m.timeline.form.name)).toBeVisible();
		await expect.element(page.getByRole('group', { name: m.timeline.form.year })).toBeVisible();
		await expect
			.element(page.getByLabelText(m.timeline.form.description, { exact: true }))
			.toBeVisible();
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

	it('returns to the card index with a message when it was opened from there', async () => {
		save.mockResolvedValue({ id: 'event-1' });
		vi.mocked(afterNavigate).mockImplementation((callback) =>
			callback({ from: { url: new URL('http://localhost/atelier/values') } } as never)
		);
		vi.spyOn(history, 'back').mockImplementation(() =>
			dispatchEvent(new PopStateEvent('popstate'))
		);
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Wojny napoleońskie');
		await userEvent.fill(page.getByRole('textbox', { name: m.timeline.form.year }), '1803');
		await saveButton().click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/values', {
				replace: true,
				refreshAll: true,
				state: { valueMessage: m.timeline.saved('Wojny napoleońskie') }
			})
		);
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
					description: '',
					source: null
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

	it('fills the dates and the description from Wikipedia without a word before a match', async () => {
		let answer: (articles: EventArticle[]) => void = () => {};
		search.mockReturnValue(new Promise((resolve) => (answer = resolve)));
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Potop szwedzki');
		await vi.waitFor(() => expect(search).toHaveBeenCalledWith('Potop szwedzki'));
		await expect.element(page.getByText(/Szukam/)).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.timeline.form.pickArticle }))
			.not.toBeInTheDocument();
		answer([deluge, vienna]);

		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.spanFrom }))
			.toHaveValue('1655');
		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.spanTo }))
			.toHaveValue('1660');
		await expect
			.element(page.getByLabelText(m.timeline.form.description, { exact: true }))
			.toHaveValue('Najazd Szwecji na Rzeczpospolitą.');
		await expect
			.element(page.getByText(`${m.timeline.form.sourcePrefix}„Potop szwedzki”, CC BY-SA 4.0`))
			.toBeVisible();

		save.mockResolvedValue({ id: 'event-1' });
		await saveButton().click();
		await vi.waitFor(() =>
			expect(save).toHaveBeenCalledWith(
				expect.objectContaining({
					yearFrom: 1655,
					yearTo: 1660,
					description: 'Najazd Szwecji na Rzeczpospolitą.',
					source: expect.objectContaining({ title: 'Potop szwedzki', licence: 'CC BY-SA 4.0' })
				}),
				undefined
			)
		);
	});

	it('does not search Wikipedia by itself when the learner switched it off, but does on request', async () => {
		autoFetch.event = false;
		search.mockResolvedValue([deluge]);
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Potop szwedzki');
		await new Promise((resolve) => setTimeout(resolve, 900));

		expect(search).not.toHaveBeenCalled();
		await page.getByRole('button', { name: m.timeline.form.searchArticles }).click();

		await vi.waitFor(() => expect(search).toHaveBeenCalledWith('Potop szwedzki'));
		await expect.element(page.getByText(deluge.title, { exact: true })).toBeVisible();
	});

	it('says nothing when Wikipedia finds nothing or does not answer', async () => {
		search.mockRejectedValueOnce(new Error('offline'));
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Moje urodziny');
		await vi.waitFor(() => expect(search).toHaveBeenCalled());

		await expect.element(page.getByText(m.timeline.articles.failed)).not.toBeInTheDocument();
		await expect.element(page.getByText(m.timeline.articles.none)).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.timeline.form.pickArticle }))
			.not.toBeInTheDocument();
	});

	it('does not search when the learner wrote both the dates and the description', async () => {
		search.mockResolvedValue([vienna]);
		renderNew();

		await userEvent.fill(
			page.getByLabelText(m.timeline.form.description, { exact: true }),
			'Mój opis.'
		);
		await userEvent.fill(page.getByRole('textbox', { name: m.timeline.form.year }), '1684');
		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Odsiecz wiedeńska');
		await new Promise((resolve) => setTimeout(resolve, 900));
		expect(search).not.toHaveBeenCalled();

		await expect
			.element(page.getByLabelText(m.timeline.form.description, { exact: true }))
			.toHaveValue('Mój opis.');
		await expect
			.element(page.getByRole('textbox', { name: m.timeline.form.year }))
			.toHaveValue('1684');
	});

	it('picks another article and removes the source', async () => {
		search.mockResolvedValue([deluge, vienna]);
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Potop szwedzki');
		await page.getByRole('button', { name: m.timeline.form.pickArticle }).click();
		const dialog = page.getByRole('dialog');
		await expect.element(dialog.getByText('1683', { exact: true })).toBeVisible();
		await dialog.getByRole('radio', { name: /Bitwa pod Wiedniem/ }).click();
		await dialog.getByRole('button', { name: m.glossary.articles.use }).click();

		await expect
			.element(page.getByRole('textbox', { name: m.timeline.form.year }))
			.toHaveValue('1683');
		await expect
			.element(page.getByLabelText(m.timeline.form.description, { exact: true }))
			.toHaveValue('Bitwa z 1683 roku.');

		await page.getByRole('button', { name: m.timeline.form.removeSource }).click();
		await expect
			.element(page.getByRole('button', { name: m.timeline.form.pickArticle }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByLabelText(m.timeline.form.description, { exact: true }))
			.toHaveValue('Bitwa z 1683 roku.');
	});

	it('searches once for a name and keeps the article the learner picked', async () => {
		search.mockResolvedValue([deluge, vienna]);
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Potop szwedzki');
		await expect
			.element(page.getByRole('button', { name: m.timeline.form.pickArticle }))
			.toBeVisible();
		await page.getByRole('button', { name: m.timeline.form.pickArticle }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByRole('radio', { name: /Bitwa pod Wiedniem/ }).click();
		await dialog.getByRole('button', { name: m.glossary.articles.use }).click();

		await new Promise((resolve) => setTimeout(resolve, 1500));
		expect(search).toHaveBeenCalledTimes(1);
		await expect
			.element(page.getByRole('textbox', { name: m.timeline.form.year }))
			.toHaveValue('1683');
	});

	it('drops an answer that comes after the name was cleared', async () => {
		let answer: (articles: EventArticle[]) => void = () => {};
		search.mockReturnValue(new Promise((resolve) => (answer = resolve)));
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Potop szwedzki');
		await vi.waitFor(() => expect(search).toHaveBeenCalled());
		await userEvent.clear(page.getByLabelText(m.timeline.form.name));
		answer([deluge]);

		await new Promise((resolve) => setTimeout(resolve, 300));
		await expect
			.element(page.getByLabelText(m.timeline.form.description, { exact: true }))
			.toHaveValue('');
	});

	it('keeps the source of a description the learner edited when a new name finds nothing', async () => {
		search.mockResolvedValueOnce([deluge]).mockResolvedValue([]);
		renderNew();

		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Potop szwedzki');
		await expect
			.element(page.getByRole('button', { name: m.timeline.form.pickArticle }))
			.toBeVisible();
		await userEvent.fill(
			page.getByLabelText(m.timeline.form.description, { exact: true }),
			'Najazd Szwecji na Polskę.'
		);
		await userEvent.fill(page.getByLabelText(m.timeline.form.name), 'Potop szwedzki 1655');
		await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(2));

		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.spanTo }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByText(`${m.timeline.form.sourcePrefix}„Potop szwedzki”, CC BY-SA 4.0`))
			.toBeVisible();
	});
});
