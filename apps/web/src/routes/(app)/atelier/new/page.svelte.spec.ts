import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
import { emptyCategoryValues } from '#lib/collection/category-values.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { pending, testSession } from '#lib/testing/auth.ts';
import AddArtworkPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
vi.mock('#lib/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() }, rpc: vi.fn() }
}));

const rpcCall = { single: vi.fn() };

function renderPage(): void {
	const values = emptyCategoryValues();
	values.style = ['Delft school'];
	render(AddArtworkPage, { data: { session: testSession(), values }, params: {} });
}

function titleField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('textbox', { name: m.artworkForm.title });
}

function authorsField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.artworkForm.authors });
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.artworkForm.save, exact: true });
}

type Leave = Parameters<Parameters<typeof beforeNavigate>[0]>[0];

function leave(type: 'link' | 'popstate' | 'leave' = 'link'): Leave {
	const navigation = {
		type,
		to: type === 'leave' ? null : { url: new URL('http://localhost/atelier/trash') },
		delta: type === 'popstate' ? -1 : undefined,
		cancel: vi.fn()
	};
	const guard = vi.mocked(beforeNavigate).mock.calls[0][0];
	guard(navigation as unknown as Leave);
	return navigation as unknown as Leave;
}

async function fillRequired(): Promise<void> {
	await titleField().fill('The Milkmaid');
	await userEvent.click(authorsField());
	await userEvent.keyboard('Johannes Vermeer{Enter}');
}

describe('add artwork page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockReturnValue(rpcCall as never);
		rpcCall.single.mockResolvedValue({
			data: { id: 'artwork-12', record_number: 12 },
			error: null
		});
		await page.viewport(1280, 800);
	});

	it('shows the empty form with the image window and the actions', async () => {
		renderPage();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.artworkForm.newTitle);
		await expect.element(titleField()).toHaveValue('');
		await expect.element(authorsField()).toBeVisible();
		await expect.element(page.getByRole('textbox', { name: m.artworkForm.year })).toBeVisible();
		await expect.element(page.getByRole('textbox', { name: m.artworkForm.notes })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.findImage }))
			.toBeDisabled();
		await expect.element(page.getByText(m.artworkForm.findImageHint)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.artworkForm.cancel }))
			.toHaveAttribute('href', '/atelier');
		await expect
			.element(page.getByRole('link', { name: m.artworkForm.back }))
			.toHaveAttribute('href', '/atelier');
	});

	it('shows field errors on save and moves focus to the first one', async () => {
		renderPage();

		await saveButton().click();

		await expect.element(page.getByText(m.artworkErrors.titleRequired)).toBeVisible();
		await expect.element(page.getByText(m.artworkErrors.authorRequired)).toBeVisible();
		await expect.element(titleField()).toHaveFocus();
		expect(supabase.rpc).not.toHaveBeenCalled();
	});

	it('rejects a year that is not a whole number', async () => {
		renderPage();
		await fillRequired();

		await page.getByRole('textbox', { name: m.artworkForm.year }).fill('1660s');
		await saveButton().click();

		await expect.element(page.getByText(m.artworkErrors.yearInvalid)).toBeVisible();
		expect(supabase.rpc).not.toHaveBeenCalled();
	});

	it('clears and disables the authors when the author is unknown', async () => {
		renderPage();
		await userEvent.click(authorsField());
		await userEvent.keyboard('Johannes Vermeer{Enter}');

		await page.getByText(m.artworkForm.authorUnknown).click();

		await expect.element(authorsField()).toBeDisabled();
		await expect.element(page.getByText('Johannes Vermeer')).not.toBeInTheDocument();
	});

	it('enables the image search once the title and an author are filled in', async () => {
		renderPage();

		await fillRequired();

		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toBeEnabled();
		await expect.element(page.getByText(m.artworkForm.findImageHint)).not.toBeInTheDocument();
	});

	it('suggests the values already used and the starting list', async () => {
		renderPage();

		await userEvent.click(page.getByRole('combobox', { name: m.artworkForm.style }));

		const options = page.getByRole('listbox').getByRole('option');
		await expect.element(options.first()).toHaveTextContent('Delft school');
		await expect
			.element(page.getByRole('option', { name: m.startingValues.style[0] }))
			.toBeVisible();
	});

	it('saves the artwork and opens the atelier with the new tile highlighted', async () => {
		renderPage();
		await fillRequired();
		await page.getByRole('textbox', { name: m.artworkForm.year }).fill('1658');
		await page.getByText(m.artworkForm.yearApproximate, { exact: true }).click();
		await page
			.getByRole('combobox', { name: m.artworkForm.type })
			.selectOptions(m.artworkTypes.painting);
		await page.getByRole('textbox', { name: m.artworkForm.notes }).fill('Seen in Amsterdam.');

		await saveButton().click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier', { state: { highlight: 12 } })
		);
		expect(supabase.rpc).toHaveBeenCalledWith('save_artwork', {
			artwork: expect.objectContaining({
				title: 'The Milkmaid',
				author_unknown: false,
				year: 1658,
				year_approximate: true,
				type_code: 'painting',
				notes: 'Seen in Amsterdam.'
			}),
			values_by_category: {
				author: ['Johannes Vermeer'],
				period: [],
				style: [],
				material: [],
				location: []
			},
			existing_id: null
		});
	});

	it('shows the running label while saving', async () => {
		rpcCall.single.mockReturnValue(pending());
		renderPage();
		await fillRequired();

		await saveButton().click();

		await expect.element(page.getByRole('button', { name: m.artworkForm.saving })).toBeDisabled();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.saveAndNext }))
			.toBeDisabled();
	});

	it('saves, confirms the record number and opens an empty form for the next artwork', async () => {
		renderPage();
		await fillRequired();

		await page.getByRole('button', { name: m.artworkForm.saveAndNext }).click();

		await expect.element(titleField()).toHaveValue('');
		await expect.element(titleField()).toHaveFocus();
		await expect.element(page.getByRole('status')).toHaveTextContent(m.artworkForm.saved('#0012'));
		await expect.element(page.getByText('Johannes Vermeer')).not.toBeInTheDocument();
		expect(invalidateAll).toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('says when saving failed and lets the learner try again', async () => {
		rpcCall.single.mockResolvedValue({
			data: null,
			error: { code: '', message: 'Failed to fetch' }
		});
		renderPage();
		await fillRequired();

		await saveButton().click();

		await expect.element(page.getByText(m.artworkForm.errorTitle)).toBeVisible();
		await expect.element(saveButton()).toBeEnabled();
		await expect.element(titleField()).toHaveValue('The Milkmaid');
		expect(goto).not.toHaveBeenCalled();
	});

	it('leaves without asking when nothing was changed', async () => {
		renderPage();

		const navigation = leave();

		expect(navigation.cancel).not.toHaveBeenCalled();
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('asks before discarding changes and stays on the form', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		const navigation = leave();

		expect(navigation.cancel).toHaveBeenCalled();
		const dialog = page.getByRole('alertdialog', { name: m.artworkForm.discardTitle });
		await expect.element(dialog).toBeVisible();
		await dialog.getByRole('button', { name: m.artworkForm.keepEditing }).click();

		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(titleField()).toHaveValue('The Milkmaid');
		expect(goto).not.toHaveBeenCalled();
	});

	it('continues to the chosen page after the learner discards the changes', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		leave();
		await page.getByRole('button', { name: m.artworkForm.discard, exact: true }).click();

		expect(goto).toHaveBeenCalledWith('/atelier/trash');
	});

	it('leaves the warning to the browser when the tab is closed', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		const navigation = leave('leave');

		expect(navigation.cancel).toHaveBeenCalled();
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('asks about unsaved changes before signing out', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		await page.getByRole('button', { name: m.menu.signOut }).click();
		const dialog = page.getByRole('alertdialog', { name: m.artworkForm.discardTitle });
		await dialog.getByRole('button', { name: m.artworkForm.keepEditing }).click();

		expect(supabase.auth.signOut).not.toHaveBeenCalled();

		await page.getByRole('button', { name: m.menu.signOut }).click();
		await dialog.getByRole('button', { name: m.artworkForm.discard, exact: true }).click();

		await vi.waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled());
	});
});

describe('image search on the add artwork page', () => {
	const fetchMock = vi.fn<typeof fetch>();
	const thumbnail = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

	function binding(id: string, file: string | null): Record<string, { value: string }> {
		return {
			item: { value: `http://www.wikidata.org/entity/${id}` },
			title: { value: 'The Milkmaid' },
			...(file && {
				file: { value: `http://commons.wikimedia.org/wiki/Special:FilePath/${file}` }
			}),
			date: { value: '1658-01-01T00:00:00Z/9' },
			creators: { value: 'Johannes Vermeer' },
			creatorNames: { value: 'Johannes Vermeer' },
			creatorCount: { value: '1' }
		};
	}

	function answerSearch(): void {
		fetchMock.mockImplementation(async (input) => {
			const url = new URL(String(input));
			if (url.hostname === 'query.wikidata.org') {
				return new Response(
					JSON.stringify({
						results: {
							bindings: [binding('Q167605', 'The%20Milkmaid.jpg'), binding('Q99', null)]
						}
					})
				);
			}
			return new Response(
				JSON.stringify({
					query: {
						pages: [
							{
								title: 'File:The Milkmaid.jpg',
								imageinfo: [
									{
										thumburl: thumbnail,
										width: 2000,
										height: 2250,
										extmetadata: {
											LicenseShortName: { value: 'CC BY-SA 4.0' },
											Artist: { value: 'Jane Doe' }
										}
									}
								]
							}
						]
					}
				})
			);
		});
	}

	function searchDialog(): ReturnType<typeof page.getByRole> {
		return page.getByRole('dialog', { name: m.imageSearch.title });
	}

	async function openSearch(): Promise<void> {
		renderPage();
		await fillRequired();
		await page.getByRole('button', { name: m.artworkForm.findImage }).click();
	}

	beforeEach(async () => {
		vi.clearAllMocks();
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
		vi.mocked(supabase.rpc).mockReturnValue(rpcCall as never);
		rpcCall.single.mockResolvedValue({
			data: { id: 'artwork-12', record_number: 12 },
			error: null
		});
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('lists the candidates and says which one has no free image', async () => {
		answerSearch();
		await openSearch();

		await expect
			.element(searchDialog())
			.toHaveAccessibleDescription(m.imageSearch.description('The Milkmaid', 'Johannes Vermeer'));
		await expect
			.element(searchDialog().getByRole('button', { name: /The Milkmaid/ }))
			.toHaveAccessibleName('The Milkmaid Johannes Vermeer 1658');
		await expect.element(searchDialog().getByText(m.imageSearch.noImage)).toBeVisible();
		const sparql = new URL(String(fetchMock.mock.calls[0][0]));
		expect(sparql.searchParams.get('query')).toContain('"The Milkmaid"');
	});

	it('shows the picked image with its credit and saves it with the artwork', async () => {
		answerSearch();
		await openSearch();

		await searchDialog()
			.getByRole('button', { name: /The Milkmaid/ })
			.click();

		await expect.element(searchDialog()).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('img', { name: 'The Milkmaid, Johannes Vermeer' }))
			.toBeVisible();
		await expect
			.element(page.getByText(m.artwork.photoCredit('Jane Doe', 'CC BY-SA 4.0')))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.chooseOtherImage }))
			.toBeEnabled();

		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		expect(supabase.rpc).toHaveBeenCalledWith(
			'save_artwork',
			expect.objectContaining({
				artwork: expect.objectContaining({
					source_wikidata_id: 'Q167605',
					source_image_file: 'The Milkmaid.jpg',
					source_image_licence: 'CC BY-SA 4.0',
					source_image_attribution: 'Jane Doe',
					image_width: 2000,
					image_height: 2250
				})
			})
		);
	});

	it('closes without an image after "none of these"', async () => {
		answerSearch();
		await openSearch();

		await searchDialog().getByRole('button', { name: m.imageSearch.none }).click();

		await expect.element(searchDialog()).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.removeImage }))
			.not.toBeInTheDocument();
	});

	it('removes the picked image', async () => {
		answerSearch();
		await openSearch();
		await searchDialog()
			.getByRole('button', { name: /The Milkmaid/ })
			.click();

		await page.getByRole('button', { name: m.artworkForm.removeImage }).click();

		await expect
			.element(page.getByRole('img', { name: 'The Milkmaid, Johannes Vermeer' }))
			.not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toBeVisible();
	});

	it('says when the search failed and lets the learner search again', async () => {
		fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
		await openSearch();

		await expect.element(searchDialog().getByText(m.imageSearch.errorTitle)).toBeVisible();
		await expect.element(searchDialog().getByText(m.imageSearchErrors.failed)).toBeVisible();

		answerSearch();
		await searchDialog().getByRole('button', { name: m.imageSearch.retry }).click();

		await expect
			.element(searchDialog().getByRole('button', { name: /The Milkmaid/ }))
			.toBeVisible();
	});

	it('says when Wikidata does not know the title', async () => {
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ results: { bindings: [] } })));
		await openSearch();

		await expect.element(searchDialog().getByText(m.imageSearch.empty)).toBeVisible();
	});
});
