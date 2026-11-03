import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { suggest } from '#lib/testing/form-suggestions/form-suggestions.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	answerRpc,
	saveArtworkCalls,
	savedCandidates
} from '#lib/testing/duplicates/duplicates.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import {
	duplicateDialog,
	eraTile,
	fillRequired,
	saveButton,
	titleField,
	answerNothingFromWikidata
} from '#lib/testing/add-artwork/add-artwork.ts';
import AddArtworkPage from './+page.svelte';

vi.mock('#lib/artworks/form-suggestions/form-suggestions.svelte.ts', async () => ({
	FormSuggestions: (await import('#lib/testing/form-suggestions/form-suggestions.ts'))
		.FakeFormSuggestions
}));
vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
const artworks = vi.hoisted(() => ({ select: vi.fn(), is: vi.fn() }));

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: {
		auth: { getSession: vi.fn(), signOut: vi.fn() },
		from: vi.fn(() => artworks),
		rpc: vi.fn(),
		storage: { from: vi.fn() }
	}
}));

const rpcCall = { single: vi.fn() };

function renderPage(): void {
	suggest({ ownValues: {}, valueLinks: emptyValueLinks(), placeStarter: emptyPlaceStarter() });
	render(AddArtworkPage, { data: { session: testSession() }, params: {} });
}

function eraDialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog', { name: m.eraDialog.title });
}

async function fillOutsideEra(): Promise<void> {
	await fillRequired();
	await page.getByRole('textbox', { name: m.artworkForm.year }).fill('1300');
	await userEvent.click(eraTile('early_modern'));
}

describe('the year and the era on the add artwork page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		answerNothingFromWikidata();
		answerRpc(rpcCall);
		rpcCall.single.mockResolvedValue({
			data: { id: 'artwork-12', record_number: 12 },
			error: null
		});
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: testSession() },
			error: null
		});
		artworks.select.mockReturnValue(artworks);
		artworks.is.mockResolvedValue({ data: [], error: null });
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('asks before saving a year outside the era and goes back on request', async () => {
		renderPage();
		await fillOutsideEra();

		await saveButton().click();

		await expect
			.element(eraDialog())
			.toHaveAccessibleDescription(
				m.eraDialog.description('1300', false, m.eras.early_modern.name, m.eras.early_modern.years)
			);
		await page.getByRole('button', { name: m.eraDialog.back }).click();

		await expect.element(eraDialog()).not.toBeInTheDocument();
		await expect.element(titleField()).toHaveValue('The Milkmaid');
		expect(saveArtworkCalls()).toHaveLength(0);
		expect(goto).not.toHaveBeenCalled();
	});

	it('saves after the learner confirms', async () => {
		renderPage();
		await fillOutsideEra();

		await saveButton().click();
		await page.getByRole('button', { name: m.eraDialog.confirm }).click();

		await vi.waitFor(() => expect(saveArtworkCalls()).toHaveLength(1));
	});

	it('asks about the era first and about a duplicate after it', async () => {
		savedCandidates({
			id: 'artwork-5',
			record_number: 5,
			title: 'The Milkmaid',
			authors: ['Johannes Vermeer']
		});
		renderPage();
		await fillOutsideEra();

		await saveButton().click();
		await expect.element(eraDialog()).toBeVisible();
		await expect.element(duplicateDialog()).not.toBeInTheDocument();
		await page.getByRole('button', { name: m.eraDialog.confirm }).click();

		await expect.element(duplicateDialog()).toBeVisible();
		expect(saveArtworkCalls()).toHaveLength(0);
	});

	it('saves a year within its era without asking', async () => {
		renderPage();
		await fillRequired();
		await page.getByRole('textbox', { name: m.artworkForm.year }).fill('1658');
		await userEvent.click(eraTile('early_modern'));

		await saveButton().click();

		await vi.waitFor(() => expect(saveArtworkCalls()).toHaveLength(1));
		await expect.element(eraDialog()).not.toBeInTheDocument();
	});
});
