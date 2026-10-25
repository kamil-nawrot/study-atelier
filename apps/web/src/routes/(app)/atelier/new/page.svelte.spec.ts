import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { afterNavigate, goto, invalidateAll } from '$app/navigation';
import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
import type { ValueLinks } from '#lib/card-index/types/value-links.ts';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { pending, testSession } from '#lib/testing/auth/auth.ts';
import {
	linkedValues,
	eraTile,
	toggleSpan,
	periodField,
	styleField,
	chooseEraAndPeriod,
	titleField,
	authorsField,
	saveButton,
	leave,
	duplicateDialog,
	addValue,
	fillRequired,
	deferred,
	answerNothingFromWikidata
} from '#lib/testing/add-artwork/add-artwork.ts';
import AddArtworkPage from './+page.svelte';

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
const bucket = { upload: vi.fn(), remove: vi.fn() };

let screen: ReturnType<typeof render>;

function renderPage(
	links: ValueLinks = emptyValueLinks(),
	placeStarter: PlaceStarter = emptyPlaceStarter(),
	ownFields?: OwnFieldDefinition[],
	ownValues: Record<string, string[]> = {}
): void {
	screen = render(AddArtworkPage, {
		data: {
			session: testSession(),
			values: emptyCategoryValues(),
			ownValues,
			ownFields,
			links,
			noteLinks: undefined,
			placeStarter
		},
		params: {}
	});
}

function savedBefore(title: string, author: string, number = 5): void {
	artworks.is.mockResolvedValue({
		data: [
			{
				id: `artwork-${number}`,
				record_number: number,
				title,
				artwork_values: [{ category_values: { category_code: 'author', name: author } }]
			}
		],
		error: null
	});
}

describe('add artwork page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		answerNothingFromWikidata();
		vi.mocked(supabase.rpc).mockReturnValue(rpcCall as never);
		rpcCall.single.mockResolvedValue({
			data: { id: 'artwork-12', record_number: 12 },
			error: null
		});
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: testSession() },
			error: null
		});
		vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
		bucket.upload.mockResolvedValue({ data: { path: 'ignored' }, error: null });
		bucket.remove.mockResolvedValue({ data: [], error: null });
		artworks.select.mockReturnValue(artworks);
		artworks.is.mockResolvedValue({ data: [], error: null });
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('goes back through the history on cancel, wherever the learner came from', async () => {
		const go = vi.spyOn(history, 'go').mockImplementation(() => {});
		renderPage();
		const callback = vi.mocked(afterNavigate).mock.calls[0][0];
		callback({
			from: {
				route: { id: '/(app)/atelier/review' },
				url: new URL('/atelier/review', location.href)
			}
		} as never);

		await page.getByRole('link', { name: m.artworkForm.cancel }).click();

		expect(go).toHaveBeenCalledWith(-1);
		go.mockRestore();
	});

	it('follows the cancel link when the form was opened straight from its address', async () => {
		const go = vi.spyOn(history, 'go').mockImplementation(() => {});
		renderPage();
		const callback = vi.mocked(afterNavigate).mock.calls[0][0];
		callback({ from: { route: { id: null }, url: null } } as never);
		const cancel = page.getByRole('link', { name: m.artworkForm.cancel });
		const followed = new Promise<boolean>((resolve) =>
			window.addEventListener(
				'click',
				(event) => {
					resolve(!event.defaultPrevented);
					event.preventDefault();
				},
				{ once: true }
			)
		);

		await cancel.click();

		expect(await followed).toBe(true);
		expect(go).not.toHaveBeenCalled();
		go.mockRestore();
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
			.element(page.getByRole('banner').getByRole('link', { name: m.artworkView.back }))
			.toHaveAttribute('href', '/atelier');
		await expect
			.element(page.getByRole('heading', { level: 1, name: m.artworkForm.newTitle }))
			.toBeInTheDocument();
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

	it('switches the date to a year span and saves both of its years', async () => {
		renderPage();
		await fillRequired();

		await toggleSpan();

		await expect.element(page.getByRole('textbox', { name: m.artworkForm.spanFrom })).toBeVisible();
		expect(page.getByRole('textbox', { name: m.artworkForm.year }).elements()).toHaveLength(0);

		await page.getByRole('textbox', { name: m.artworkForm.spanFrom }).fill('50');
		await page.getByText(m.artworkForm.beforeCommonEra, { exact: true }).first().click();
		await page.getByRole('textbox', { name: m.artworkForm.spanTo }).fill('20');
		await saveButton().click();

		await vi.waitFor(() =>
			expect(supabase.rpc).toHaveBeenCalledWith(
				'save_artwork',
				expect.objectContaining({
					artwork: expect.objectContaining({ year_from: -50, year_to: 20 })
				})
			)
		);
	});

	it('rejects a year span whose end is earlier than its start', async () => {
		renderPage();
		await fillRequired();
		await toggleSpan();

		await page.getByRole('textbox', { name: m.artworkForm.spanFrom }).fill('1519');
		await page.getByRole('textbox', { name: m.artworkForm.spanTo }).fill('1503');
		await saveButton().click();

		await expect.element(page.getByText(m.artworkErrors.spanOrder)).toBeVisible();
		expect(supabase.rpc).not.toHaveBeenCalled();
	});

	it('keeps the end year as the year when the year span is switched off', async () => {
		renderPage();
		await toggleSpan();
		await page.getByRole('textbox', { name: m.artworkForm.spanFrom }).fill('1503');
		await page.getByRole('textbox', { name: m.artworkForm.spanTo }).fill('1519');

		await toggleSpan();

		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.year }))
			.toHaveValue('1519');
	});

	it('clears and disables the authors when the author is unknown', async () => {
		renderPage();
		await addValue(authorsField(), 'Johannes Vermeer');

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

	it('shows the six eras in order and locks the period and the style until they are chosen', async () => {
		renderPage(linkedValues());

		await expect.element(page.getByRole('group', { name: m.artworkForm.era })).toBeVisible();
		await expect.element(eraTile('prehistory')).toBeVisible();
		await expect.element(eraTile('contemporary')).toBeVisible();
		expect(
			page.getByRole('group', { name: m.artworkForm.era }).getByRole('radio').elements()
		).toHaveLength(6);
		await expect.element(periodField()).toBeDisabled();
		await expect.element(periodField()).toHaveAttribute('placeholder', m.artworkForm.periodLocked);
		await expect.element(styleField()).toBeDisabled();
		await expect.element(styleField()).toHaveAttribute('placeholder', m.artworkForm.styleLocked);
	});

	it('unlocks the period with the periods of the chosen era only', async () => {
		renderPage(linkedValues());

		await userEvent.click(eraTile('early_modern'));
		await expect.element(periodField()).toBeEnabled();
		await userEvent.click(periodField());

		const options = page.getByRole('listbox', { name: m.artworkForm.period }).getByRole('option');
		await expect.element(options.first()).toHaveTextContent('Dutch Golden Age');
		await expect.element(page.getByRole('option', { name: 'Mannerism' })).toBeVisible();
		await expect.element(page.getByRole('option', { name: 'Realism' })).not.toBeInTheDocument();
		await expect.element(styleField()).toBeDisabled();
	});

	it('unlocks the style with the styles of the chosen period only', async () => {
		renderPage(linkedValues());

		await chooseEraAndPeriod();
		await expect.element(styleField()).toBeEnabled();
		await userEvent.click(styleField());

		await expect.element(page.getByRole('option', { name: 'Delft school' })).toBeVisible();
		await expect.element(page.getByRole('option', { name: 'Leiden fijnschilders' })).toBeVisible();
	});

	it('allows a new period and a new style when the era has none yet', async () => {
		renderPage();

		await userEvent.click(eraTile('modern'));
		await addValue(periodField(), 'Pointillism');
		await addValue(styleField(), 'Neo-impressionism');

		await expect.element(page.getByText('Pointillism', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Neo-impressionism', { exact: true })).toBeVisible();
	});

	it('clears the period and the style when another era is chosen', async () => {
		renderPage(linkedValues());
		await chooseEraAndPeriod();
		await userEvent.click(styleField());
		await userEvent.click(page.getByRole('option', { name: 'Delft school' }));

		await userEvent.click(eraTile('modern'));

		await expect.element(page.getByText('Dutch Golden Age')).not.toBeInTheDocument();
		await expect.element(page.getByText('Delft school')).not.toBeInTheDocument();
		await expect.element(periodField()).toBeEnabled();
		await expect.element(styleField()).toBeDisabled();
	});

	it('clears the period and the style when the era is cleared', async () => {
		renderPage(linkedValues());
		await chooseEraAndPeriod();

		await userEvent.click(eraTile('early_modern'));

		await expect.element(eraTile('early_modern')).not.toBeChecked();
		await expect.element(page.getByText('Dutch Golden Age')).not.toBeInTheDocument();
		await expect.element(periodField()).toBeDisabled();
		await expect.element(styleField()).toBeDisabled();
	});

	it('clears the style when the period is removed', async () => {
		renderPage(linkedValues());
		await chooseEraAndPeriod();
		await userEvent.click(styleField());
		await userEvent.click(page.getByRole('option', { name: 'Delft school' }));

		await page.getByRole('button', { name: /Dutch Golden Age/ }).click();

		await expect.element(page.getByText('Delft school')).not.toBeInTheDocument();
		await expect.element(styleField()).toBeDisabled();
		await expect.element(periodField()).toBeEnabled();
	});

	it('saves the era, the period and the style with the artwork', async () => {
		renderPage(linkedValues());
		await fillRequired();
		await chooseEraAndPeriod();
		await userEvent.click(styleField());
		await userEvent.click(page.getByRole('option', { name: 'Delft school' }));

		await saveButton().click();

		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as unknown as [
			string,
			Record<string, unknown>
		];
		expect(args.artwork).toMatchObject({ era_code: 'early_modern' });
		expect(args.values_by_category).toMatchObject({
			period: ['Dutch Golden Age'],
			style: ['Delft school']
		});
	});

	it('saves an artwork without an era with no era code and no period', async () => {
		renderPage();
		await fillRequired();

		await saveButton().click();

		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as unknown as [
			string,
			Record<string, unknown>
		];
		expect(args.artwork).toMatchObject({ era_code: null });
		expect(args.values_by_category).toMatchObject({ period: [], style: [] });
	});

	it('offers the eight types as tiles and saves no type when the chosen one is clicked again', async () => {
		renderPage();
		await fillRequired();
		const types = page.getByRole('group', { name: m.artworkForm.type });
		expect(types.getByRole('radio').elements()).toHaveLength(8);

		const sculpture = page.getByRole('radio', { name: m.artworkTypes.sculpture, exact: true });
		await sculpture.click();
		await expect.element(sculpture).toBeChecked();
		await sculpture.click();
		await expect.element(sculpture).not.toBeChecked();
		await saveButton().click();

		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as unknown as [
			string,
			Record<string, unknown>
		];
		expect(args.artwork).toMatchObject({ type_code: null });
	});

	it('saves formatted notes as Markdown', async () => {
		renderPage();
		await fillRequired();
		await page.getByRole('textbox', { name: m.artworkForm.notes }).click();
		await userEvent.keyboard('{Control>}b{/Control}');
		await userEvent.keyboard('Light');
		await userEvent.keyboard('{Control>}b{/Control}');
		await userEvent.keyboard(' from the left');

		await saveButton().click();

		await vi.waitFor(() =>
			expect(supabase.rpc).toHaveBeenCalledWith(
				'save_artwork',
				expect.objectContaining({
					artwork: expect.objectContaining({ notes: '**Light** from the left' })
				})
			)
		);
	});

	it('offers museums from the starter list in the place field and saves the one picked', async () => {
		renderPage(emptyValueLinks(), {
			museums: [{ name: 'Luwr', aliases: ['Louvre Museum'], note: 'Francja' }],
			notes: {}
		});
		await fillRequired();

		const location = page.getByRole('combobox', { name: m.artworkForm.location });
		await userEvent.click(location);
		await expect.element(page.getByRole('option', { name: /Luwr/ })).not.toBeInTheDocument();
		await userEvent.keyboard('louv');
		const museum = page.getByRole('option', { name: /Luwr/ });
		await expect.element(museum).toBeVisible();
		await expect.element(museum.getByText('Francja')).toBeVisible();
		await userEvent.click(museum);
		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		expect(supabase.rpc).toHaveBeenCalledWith('save_artwork', {
			artwork: expect.anything(),
			values_by_category: expect.objectContaining({ location: ['Luwr'] }),
			existing_id: undefined,
			images: []
		});
	});

	it('shows the own fields after the place and saves what the learner filled in', async () => {
		const fields: OwnFieldDefinition[] = [
			{ id: 'lecture', name: 'Lecture', description: null, kind: 'list', multiple: false },
			{ id: 'source', name: 'Source', description: 'Book and page', kind: 'text', multiple: false },
			{ id: 'seen', name: 'Seen in person', description: null, kind: 'flag', multiple: false }
		];
		renderPage(emptyValueLinks(), emptyPlaceStarter(), fields, { lecture: ['Baroque class'] });
		await fillRequired();

		const location = page.getByRole('combobox', { name: m.artworkForm.location }).element();
		const source = page.getByRole('textbox', { name: 'Source' });
		expect(
			location.compareDocumentPosition(source.element()) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		await expect.element(source).toHaveAccessibleDescription('Book and page');

		await addValue(page.getByRole('combobox', { name: 'Lecture' }), 'Baroque class');
		await source.fill(' Gombrich, p. 300 ');
		await page.getByText('Seen in person', { exact: true }).click();
		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		expect(supabase.rpc).toHaveBeenCalledWith(
			'save_artwork',
			expect.objectContaining({
				values_by_category: expect.objectContaining({ lecture: ['Baroque class'] }),
				field_entries: { source: 'Gombrich, p. 300', seen: true }
			})
		);
	});

	it('shows no own fields and leaves them alone when they could not be loaded', async () => {
		renderPage();
		await fillRequired();
		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		expect(supabase.rpc).toHaveBeenCalledWith(
			'save_artwork',
			expect.objectContaining({ field_entries: undefined })
		);
	});

	it('saves the artwork and opens the atelier with the new tile highlighted', async () => {
		renderPage();
		await fillRequired();
		await page.getByRole('textbox', { name: m.artworkForm.year }).fill('1658');
		await page.getByText(m.artworkForm.yearApproximate, { exact: true }).click();
		await page.getByRole('radio', { name: m.artworkTypes.painting, exact: true }).click();
		await page.getByRole('textbox', { name: m.artworkForm.notes }).fill('Seen in Amsterdam.');

		await saveButton().click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier', { refreshAll: true, state: { highlight: 12 } })
		);
		expect(supabase.rpc).toHaveBeenCalledWith('save_artwork', {
			artwork: expect.objectContaining({
				title: 'The Milkmaid',
				author_unknown: false,
				year_to: 1658,
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
			existing_id: undefined,
			images: []
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

	it('asks before saving an artwork with the same title and authors and goes back on request', async () => {
		savedBefore('the  milkmaid', 'johannes vermeer');
		renderPage();
		await fillRequired();

		await saveButton().click();

		await expect.element(duplicateDialog()).toBeVisible();
		await expect
			.element(duplicateDialog())
			.toHaveAccessibleDescription(
				m.duplicateDialog.description('#0005', 1, m.duplicateDialog.save.advice)
			);
		await page.getByRole('button', { name: m.artworkForm.keepEditing }).click();

		await expect.element(duplicateDialog()).not.toBeInTheDocument();
		await expect.element(titleField()).toHaveValue('The Milkmaid');
		await expect.element(saveButton()).toBeEnabled();
		expect(supabase.rpc).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('saves the matching artwork after the learner confirms', async () => {
		savedBefore('The Milkmaid', 'Johannes Vermeer');
		renderPage();
		await fillRequired();

		await saveButton().click();
		await page.getByRole('button', { name: m.duplicateDialog.save.confirm }).click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier', { refreshAll: true, state: { highlight: 12 } })
		);
		expect(supabase.rpc).toHaveBeenCalledTimes(1);
	});

	it('asks the same way before saving and starting the next artwork', async () => {
		savedBefore('The Milkmaid', 'Johannes Vermeer');
		renderPage();
		await fillRequired();

		await page.getByRole('button', { name: m.artworkForm.saveAndNext }).click();
		await page.getByRole('button', { name: m.duplicateDialog.save.confirm }).click();

		await expect.element(page.getByRole('status')).toHaveTextContent(m.artworkForm.saved('#0012'));
		await expect.element(titleField()).toHaveValue('');
	});

	it('does not ask when another artwork has the same title but other authors', async () => {
		savedBefore('The Milkmaid', 'Jan Steen');
		renderPage();
		await fillRequired();

		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(artworks.is).toHaveBeenCalledWith('deleted_at', null);
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

	it('brings the error into view when saving fails far from the top of the form', async () => {
		const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
		rpcCall.single.mockResolvedValue({
			data: null,
			error: { code: '23505', message: 'duplicate key' }
		});
		renderPage();
		await fillRequired();

		await saveButton().click();

		await expect.element(page.getByText(m.artworkErrors.conflict)).toBeVisible();
		await vi.waitFor(() => {
			const alert = page.getByRole('alert').element();
			expect(scrollIntoView.mock.contexts).toContain(alert);
		});
		scrollIntoView.mockRestore();
	});

	it('signs the learner out when the session is no longer valid', async () => {
		rpcCall.single.mockResolvedValue({
			data: null,
			error: { code: 'PGRST301', message: 'JWT expired' }
		});
		renderPage();
		await fillRequired();

		await saveButton().click();

		await expect.element(page.getByText(m.authErrors.sessionEnded)).toBeVisible();
		expect(supabase.auth.signOut).toHaveBeenCalledOnce();
	});

	it('keeps a change made while saving as unsaved', async () => {
		const response = deferred<{ data: unknown; error: null }>();
		rpcCall.single.mockReturnValue(response.promise);
		renderPage();
		await fillRequired();

		await saveButton().click();
		await titleField().fill('The Milkmaid (second version)');
		response.resolve({ data: { id: 'artwork-12', record_number: 12 }, error: null });
		await expect.element(saveButton()).toBeEnabled();

		const navigation = leave();

		expect(navigation.cancel).toHaveBeenCalled();
		await expect
			.element(page.getByRole('alertdialog', { name: m.artworkForm.discardTitle }))
			.toBeVisible();
	});

	it('saves once when the form is submitted again while saving', async () => {
		rpcCall.single.mockReturnValue(pending());
		renderPage();
		await fillRequired();

		await saveButton().click();
		document.querySelector('form')?.requestSubmit();
		document.querySelector('form')?.requestSubmit();

		await expect.element(page.getByRole('button', { name: m.artworkForm.saving })).toBeDisabled();
		expect(supabase.rpc).toHaveBeenCalledTimes(1);
	});

	it('enables the buttons again and says the artwork is saved when opening the next page fails', async () => {
		vi.mocked(goto).mockRejectedValueOnce(new Error('Navigation failed'));
		renderPage();
		await fillRequired();

		await saveButton().click();

		await expect.element(saveButton()).toBeEnabled();
		await expect.element(page.getByRole('status')).toHaveTextContent(m.artworkForm.saved('#0012'));
		await expect.element(page.getByText(m.artworkForm.errorTitle)).not.toBeInTheDocument();
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

	it('opens one question when the learner tries to leave twice', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		const first = leave();
		const second = leave();
		await page.getByRole('button', { name: m.artworkForm.discard, exact: true }).click();

		expect(first.cancel).toHaveBeenCalled();
		expect(second.cancel).toHaveBeenCalled();
		await vi.waitFor(() => expect(goto).toHaveBeenCalledTimes(1));
	});

	it('guards the form again when it is changed after the learner chose to discard', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		leave();
		await page.getByRole('button', { name: m.artworkForm.discard, exact: true }).click();
		await titleField().fill('The Milkmaid, second thoughts');
		const navigation = leave();

		expect(navigation.cancel).toHaveBeenCalled();
		await expect
			.element(page.getByRole('alertdialog', { name: m.artworkForm.discardTitle }))
			.toBeVisible();
	});

	it('does not sign out when the form is closed while the question is open', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		await page.getByRole('button', { name: m.menu.signOut }).click();
		await expect
			.element(page.getByRole('alertdialog', { name: m.artworkForm.discardTitle }))
			.toBeVisible();
		await (await screen).unmount();

		expect(supabase.auth.signOut).not.toHaveBeenCalled();
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
