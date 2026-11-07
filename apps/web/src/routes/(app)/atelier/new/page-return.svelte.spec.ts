import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { suggest } from '#lib/testing/form-suggestions/form-suggestions.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { answerRpc, saveArtworkCalls } from '#lib/testing/duplicates/duplicates.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import {
	fillRequired,
	saveButton,
	answerNothingFromWikidata
} from '#lib/testing/add-artwork/add-artwork.ts';
import AddArtworkPage from './+page.svelte';

vi.mock('#lib/artworks/form-suggestions/form-suggestions.svelte.ts', async () => ({
	FormSuggestions: (await import('#lib/testing/form-suggestions/form-suggestions.ts'))
		.FakeFormSuggestions
}));
vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
const navigation = vi.hoisted(() => ({ url: new URL('http://localhost/atelier/new'), data: {} }));
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
	render(AddArtworkPage, { data: { session: testSession(), ownFields: undefined }, params: {} });
}

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

describe('adding an artwork on the way from an exhibition', () => {
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
		navigation.url = new URL('http://localhost/atelier/new');
	});

	it('returns to the exhibition after the artwork is saved', async () => {
		navigation.url = new URL(
			`http://localhost/atelier/new?return=${encodeURIComponent(`/atelier/exhibitions/${ID}?edit`)}`
		);
		renderPage();
		await fillRequired();

		await saveButton().click();

		await vi.waitFor(() => expect(saveArtworkCalls()).toHaveLength(1));
		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith(`/atelier/exhibitions/${ID}?edit`, { invalidateAll: true })
		);
	});

	it('ignores a return address that is not an exhibition', async () => {
		navigation.url = new URL('http://localhost/atelier/new?return=https%3A%2F%2Fevil.test');
		renderPage();
		await fillRequired();

		await saveButton().click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier', expect.objectContaining({ refreshAll: true }))
		);
	});
});
