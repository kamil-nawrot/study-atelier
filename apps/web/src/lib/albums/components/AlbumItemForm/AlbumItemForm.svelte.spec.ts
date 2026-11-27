import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { albumItems } from '#lib/albums/album-items/album-items.ts';
import { saveGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
import { saveTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
import { saveValueForm } from '#lib/values/value-form-save/value-form-save.ts';
import { albumWithItems } from '#lib/testing/albums/albums.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import type { AlbumItem } from '#lib/albums/types/album-item.ts';
import type { ItemMatches } from '#lib/albums/types/item-matches.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import AlbumItemForm from './AlbumItemForm.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ saveGlossaryEntry: vi.fn() }));
vi.mock('#lib/timeline/timeline-data/timeline-data.ts', () => ({ saveTimelineEvent: vi.fn() }));
vi.mock('#lib/values/value-form-save/value-form-save.ts', () => ({ saveValueForm: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const NOTHING: ItemMatches = { entries: [], events: [], records: [], details: {} };

function itemOf(key: string, matches: ItemMatches = NOTHING): AlbumItem {
	const item = albumItems(albumWithItems(), matches, []).find((candidate) => candidate.key === key);
	if (!item) throw new Error(key);
	return item;
}

function renderItem(item: AlbumItem, last = false): Record<string, ReturnType<typeof vi.fn>> {
	const handlers = { onfinish: vi.fn(), onsaved: vi.fn(), onskip: vi.fn() };
	render(AlbumItemForm, {
		item,
		terms: [],
		index: testCardIndex(),
		last,
		cancelHref: '/atelier/albums/sample-album',
		...handlers
	});
	return handlers;
}

describe('AlbumItemForm', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		autoFetch.definition = false;
		autoFetch.forms = false;
		autoFetch.event = false;
		autoFetch.image = false;
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ id: 'a-new' });
		vi.mocked(saveTimelineEvent).mockResolvedValue({ id: 'e-new' });
		vi.mocked(saveValueForm).mockResolvedValue({ path: '/atelier/values/author/r', message: 'ok' });
		await page.viewport(1280, 800);
	});

	it('opens a term with the album text and saves it, then goes on', async () => {
		const handlers = renderItem(itemOf('term:carving'));

		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Carving');
		await expect
			.element(page.getByLabelText(m.glossary.form.definition))
			.toHaveValue('carving definition.');
		await page.getByRole('button', { name: m.albums.walk.saveAndNext }).click();

		await vi.waitFor(() => expect(handlers.onsaved).toHaveBeenCalled());
		expect(saveGlossaryEntry).toHaveBeenCalled();
	});

	it('opens an event with the album dates and description', async () => {
		const handlers = renderItem(itemOf('event:discovery'), true);

		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Discovery');
		await page.getByRole('button', { name: m.albums.walk.saveAndFinish }).click();

		await vi.waitFor(() => expect(handlers.onsaved).toHaveBeenCalled());
		expect(saveTimelineEvent).toHaveBeenCalled();
	});

	it('opens a value with the album summary', async () => {
		const handlers = renderItem(itemOf('value:cave'));

		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Cave');
		await expect.element(page.getByLabelText(m.valueForm.summary)).toHaveValue('cave summary.');
		await page.getByRole('button', { name: m.albums.walk.saveAndNext }).click();

		await vi.waitFor(() => expect(handlers.onsaved).toHaveBeenCalled());
		expect(saveValueForm).toHaveBeenCalled();
	});

	it('offers to append the new album text to the notes of an existing value', async () => {
		const record = {
			id: 'r-carver',
			category: 'author' as const,
			name: 'Unknown Carver',
			count: 1
		};
		const details: ValueDetails = { summary: 'Own.', notes: 'Mine.' };
		renderItem(
			itemOf('value:carver', { ...NOTHING, records: [record], details: { 'r-carver': details } })
		);

		await page.getByRole('button', { name: m.albums.closing.appendNote }).click();

		await expect
			.element(page.getByLabelText(m.common.notes))
			.toHaveTextContent('A carver of figures.');
		await expect
			.element(page.getByRole('button', { name: m.albums.closing.appendNote }))
			.toBeDisabled();
	});

	it('skips an item and finishes early', async () => {
		const handlers = renderItem(itemOf('term:carving'));

		await page.getByRole('button', { name: m.albums.walk.skip }).click();
		expect(handlers.onskip).toHaveBeenCalled();

		await page.getByRole('link', { name: m.albums.walk.finish }).click();
		await vi.waitFor(() => expect(handlers.onfinish).toHaveBeenCalled());
	});
});
