import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
import { emptyCategoryValues } from '#lib/collection/category-values.ts';
import { emptyPlaceStarter } from '#lib/collection/place-starter.ts';
import { emptyValueLinks } from '#lib/collection/value-links.ts';
import type { PlaceStarter, ValueLinks } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import {
	IMAGES_BUCKET,
	OWN_IMAGE_ACCEPT,
	OWN_IMAGE_MAX_BYTES,
	OWN_IMAGE_MAX_MEGABYTES
} from '#lib/images/bucket.ts';
import { supabase } from '#lib/supabase.ts';
import { pending, testSession } from '#lib/testing/auth.ts';
import AddArtworkPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
const artworks = vi.hoisted(() => ({ select: vi.fn(), is: vi.fn() }));

vi.mock('#lib/supabase.ts', () => ({
	supabase: {
		auth: { getSession: vi.fn(), signOut: vi.fn() },
		from: vi.fn(() => artworks),
		rpc: vi.fn(),
		storage: { from: vi.fn() }
	}
}));

const rpcCall = { single: vi.fn() };
const bucket = { upload: vi.fn(), remove: vi.fn() };

function linkedValues(): ValueLinks {
	const links = emptyValueLinks();
	links.periodsByEra.early_modern = ['Dutch Golden Age', 'Mannerism'];
	links.periodsByEra.modern = ['Realism'];
	links.stylesByPeriod['dutch golden age'] = ['Delft school', 'Leiden fijnschilders'];
	return links;
}

let screen: ReturnType<typeof render>;

function renderPage(
	links: ValueLinks = emptyValueLinks(),
	placeStarter: PlaceStarter = emptyPlaceStarter()
): void {
	screen = render(AddArtworkPage, {
		data: {
			session: testSession(),
			values: emptyCategoryValues(),
			links,
			noteLinks: undefined,
			placeStarter
		},
		params: {}
	});
}

function eraTile(code: keyof typeof m.eras): ReturnType<typeof page.getByRole> {
	return page.getByRole('radio', { name: `${m.eras[code].name} ${m.eras[code].years}` });
}

async function toggleSpan(): Promise<void> {
	await page.getByText(m.artworkForm.spanSwitch, { exact: true }).click();
}

function periodField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.artworkForm.period });
}

function styleField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.artworkForm.style });
}

async function chooseEraAndPeriod(): Promise<void> {
	await userEvent.click(eraTile('early_modern'));
	await userEvent.click(periodField());
	await userEvent.click(page.getByRole('option', { name: 'Dutch Golden Age' }));
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

async function imageFile(width: number, height: number, padding = 0): Promise<File> {
	const canvas = new OffscreenCanvas(width, height);
	canvas.getContext('2d')?.fillRect(0, 0, width, height);
	const blob = await canvas.convertToBlob({ type: 'image/png' });
	return new File([blob, new Uint8Array(padding)], 'photo.png', { type: 'image/png' });
}

function stubRemoteImage(size: { width: number; height: number } | 'error'): void {
	vi.stubGlobal(
		'Image',
		class {
			naturalWidth = 0;
			naturalHeight = 0;
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;

			set src(_value: string) {
				setTimeout(() => {
					if (size === 'error') {
						this.onerror?.();
						return;
					}
					this.naturalWidth = size.width;
					this.naturalHeight = size.height;
					this.onload?.();
				});
			}
		}
	);
}

function stubSlowRemoteImage(): () => void {
	let finish = (): void => {};
	vi.stubGlobal(
		'Image',
		class {
			naturalWidth = 1200;
			naturalHeight = 900;
			onload: (() => void) | null = null;

			set src(_value: string) {
				finish = () => this.onload?.();
			}
		}
	);
	return () => finish();
}

async function openOwnImage(): Promise<void> {
	await page.getByRole('button', { name: m.artworkForm.ownImage }).click();
}

async function chooseFile(file: File): Promise<void> {
	await openOwnImage();
	const input = document.querySelector<HTMLInputElement>('input[type="file"]');
	if (!input) throw new Error('The file input is missing');
	await userEvent.upload(input, file);
}

function urlField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('textbox', { name: m.artworkForm.imageUrl });
}

function savedArtwork(): Record<string, unknown> {
	const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
	return args.artwork;
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

function duplicateDialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog', { name: m.duplicateDialog.title });
}

async function addValue(field: ReturnType<typeof page.getByRole>, name: string): Promise<void> {
	await field.fill(name);
	await userEvent.keyboard('{Enter}');
}

function selectFile(file: File): void {
	const input = document.querySelector<HTMLInputElement>('input[type="file"]');
	if (!input) throw new Error('The file input is missing');
	const transfer = new DataTransfer();
	transfer.items.add(file);
	input.files = transfer.files;
	input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function fillRequired(): Promise<void> {
	await titleField().fill('The Milkmaid');
	await addValue(authorsField(), 'Johannes Vermeer');
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let resolve: (value: T) => void = () => {};
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

function answerNothingFromWikidata(): void {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => new Response(JSON.stringify({ results: { bindings: [] } })))
	);
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
			extra_images: []
		});
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
			extra_images: []
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

	it('shows a picked file with its size and uploads it to the learner folder on save', async () => {
		renderPage();
		await fillRequired();

		await chooseFile(await imageFile(30, 20));

		const image = page.getByRole('img', { name: 'The Milkmaid, Johannes Vermeer' });
		await expect.element(image).toHaveAttribute('width', '30');
		await expect.element(image).toHaveAttribute('height', '20');
		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).toBeVisible();
		await expect
			.element(page.getByRole('dialog', { name: m.artworkForm.ownImageTitle }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.changeOwnImage }))
			.toBeVisible();
		expect(bucket.upload).not.toHaveBeenCalled();

		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		expect(supabase.storage.from).toHaveBeenCalledWith(IMAGES_BUCKET);
		const [path, file] = bucket.upload.mock.calls[0] as [string, File];
		expect(path).toMatch(/^user-id\/[0-9a-f-]{36}\.png$/);
		expect(file.name).toBe('photo.png');
		expect(savedArtwork()).toMatchObject({
			own_image_path: path,
			own_image_url: null,
			image_width: 30,
			image_height: 20
		});
	});

	it('opens the own image dialog with a file picker for the allowed formats', async () => {
		renderPage();

		await openOwnImage();

		await expect
			.element(page.getByRole('dialog', { name: m.artworkForm.ownImageTitle }))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.chooseFile }))
			.toHaveAccessibleDescription(
				m.artworkForm.fileHint('JPG, PNG, WebP, GIF lub AVIF', OWN_IMAGE_MAX_MEGABYTES)
			);
		expect(document.querySelector('input[type="file"]')?.getAttribute('accept')).toBe(
			OWN_IMAGE_ACCEPT
		);
	});

	it('clears the dialog when it is closed without an image', async () => {
		renderPage();
		await openOwnImage();
		await urlField().fill('http://example.com/milkmaid.jpg');
		await page.getByRole('button', { name: m.artworkForm.useImageUrl }).click();
		await expect.element(page.getByText(m.ownImageErrors.urlInvalid)).toBeVisible();

		await userEvent.keyboard('{Escape}');

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.artworkForm.ownImage })).toHaveFocus();
		await openOwnImage();
		await expect.element(urlField()).toHaveValue('');
		await expect.element(page.getByText(m.ownImageErrors.urlInvalid)).not.toBeInTheDocument();
	});

	it('makes a picked file over the limit smaller and uploads the smaller JPEG', async () => {
		renderPage();
		await fillRequired();

		await chooseFile(await imageFile(4000, 3000, OWN_IMAGE_MAX_BYTES));

		const image = page.getByRole('img', { name: 'The Milkmaid, Johannes Vermeer' });
		await expect.element(image).toHaveAttribute('width', '3200');
		await expect.element(image).toHaveAttribute('height', '2400');

		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		const [path, file] = bucket.upload.mock.calls[0] as [string, File];
		expect(path).toMatch(/^user-id\/[0-9a-f-]{36}\.jpg$/);
		expect(file).toMatchObject({ name: 'photo.jpg', type: 'image/jpeg' });
		expect(file.size).toBeLessThanOrEqual(OWN_IMAGE_MAX_BYTES);
	});

	it('explains under the button why a file cannot be added', async () => {
		renderPage();

		await chooseFile(new File(['image'], 'photo.heic', { type: 'image/heic' }));

		await expect
			.element(page.getByRole('button', { name: m.artworkForm.chooseFile }))
			.toHaveAccessibleDescription(m.ownImageErrors.fileType('JPG, PNG, WebP, GIF lub AVIF'));

		selectFile(
			new File([new Uint8Array(OWN_IMAGE_MAX_BYTES + 1)], 'large.png', { type: 'image/png' })
		);

		await expect.element(page.getByText(m.ownImageErrors.shrinkFailed)).toBeVisible();
		await expect.element(page.getByRole('img', { name: m.ui.noImage })).toBeInTheDocument();
	});

	it('adds an image from an https address after reading its size', async () => {
		stubRemoteImage({ width: 1200, height: 900 });
		renderPage();
		await fillRequired();
		await openOwnImage();

		await urlField().fill(' https://example.com/milkmaid.jpg ');
		await userEvent.keyboard('{Enter}');

		await expect
			.element(page.getByText(m.artworkForm.ownImageUrlCredit('example.com')))
			.toBeVisible();
		await expect.element(urlField()).not.toBeInTheDocument();
		expect(supabase.rpc).not.toHaveBeenCalled();

		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		expect(bucket.upload).not.toHaveBeenCalled();
		expect(savedArtwork()).toMatchObject({
			own_image_path: null,
			own_image_url: 'https://example.com/milkmaid.jpg',
			image_width: 1200,
			image_height: 900
		});
	});

	it('adds another image in a new slot and makes it the main one', async () => {
		stubRemoteImage({ width: 1200, height: 900 });
		renderPage();
		await fillRequired();
		await openOwnImage();
		await urlField().fill('https://example.com/facade.jpg');
		await userEvent.keyboard('{Enter}');

		await page.getByRole('button', { name: m.artworkForm.addImage }).click();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.imageSlot(2, 2) }))
			.toHaveAttribute('aria-pressed', 'true');
		await openOwnImage();
		await urlField().fill('https://example.org/plan.jpg');
		await userEvent.keyboard('{Enter}');
		await page.getByRole('button', { name: m.artworkForm.setMainImage }).click();
		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		expect(savedArtwork()).toMatchObject({ own_image_url: 'https://example.org/plan.jpg' });
		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
		expect(args.extra_images).toEqual([
			expect.objectContaining({ own_image_url: 'https://example.com/facade.jpg' })
		]);
	});

	it('starts the next artwork with only the main slot after saving and adding another', async () => {
		renderPage();
		await fillRequired();
		await page.getByRole('button', { name: m.artworkForm.addImage }).click();
		await page.getByRole('button', { name: m.artworkForm.addImage }).click();

		await page.getByRole('button', { name: m.artworkForm.saveAndNext }).click();

		await expect
			.element(page.getByRole('button', { name: m.artworkForm.imageSlot(1, 1) }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('leaves out an empty slot and offers at most five images', async () => {
		renderPage();
		await fillRequired();
		const add = page.getByRole('button', { name: m.artworkForm.addImage });

		for (let added = 0; added < 4; added += 1) await add.click();

		await expect.element(add).not.toBeInTheDocument();
		await page.getByRole('button', { name: m.artworkForm.removeImage }).click();
		await expect.element(add).toBeVisible();

		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
		expect(args.extra_images).toEqual([]);
	});

	it('rejects an address that is not https or does not lead to an image', async () => {
		stubRemoteImage('error');
		renderPage();
		await openOwnImage();

		await urlField().fill('http://example.com/milkmaid.jpg');
		await page.getByRole('button', { name: m.artworkForm.useImageUrl }).click();

		await expect.element(page.getByText(m.ownImageErrors.urlInvalid)).toBeVisible();

		await urlField().fill('https://example.com/milkmaid.html');
		await page.getByRole('button', { name: m.artworkForm.useImageUrl }).click();

		await expect.element(page.getByText(m.ownImageErrors.urlUnreadable)).toBeVisible();
		await expect.element(urlField()).toHaveValue('https://example.com/milkmaid.html');
	});

	it('does not use an address that loads after the dialog was closed', async () => {
		const finishLoading = stubSlowRemoteImage();
		renderPage();
		await openOwnImage();
		await urlField().fill('https://example.com/milkmaid.jpg');
		await page.getByRole('button', { name: m.artworkForm.useImageUrl }).click();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.usingImageUrl }))
			.toBeDisabled();

		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		finishLoading();

		await expect.element(page.getByRole('img', { name: m.ui.noImage })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.artworkForm.ownImage })).toBeVisible();
	});

	it('removes the image and saves the artwork without one', async () => {
		stubRemoteImage({ width: 1200, height: 900 });
		renderPage();
		await fillRequired();
		await openOwnImage();
		await urlField().fill('https://example.com/milkmaid.jpg');
		await page.getByRole('button', { name: m.artworkForm.useImageUrl }).click();

		await page.getByRole('button', { name: m.artworkForm.removeImage }).click();

		await expect.element(page.getByRole('img', { name: m.ui.noImage })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.artworkForm.ownImage })).toBeVisible();

		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		expect(savedArtwork()).toMatchObject({
			own_image_path: null,
			own_image_url: null,
			image_width: null,
			image_height: null
		});
	});

	it('says when the image could not be uploaded and keeps the form', async () => {
		bucket.upload.mockResolvedValue({
			data: null,
			error: { message: 'Failed to fetch', status: undefined }
		});
		renderPage();
		await fillRequired();
		await chooseFile(await imageFile(30, 20));

		await saveButton().click();

		await expect.element(page.getByText(m.ownImageErrors.uploadNetwork)).toBeVisible();
		await expect.element(page.getByRole('img')).toBeVisible();
		expect(supabase.rpc).not.toHaveBeenCalled();
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

	function answerSearch(
		bindings = [binding('Q167605', 'The%20Milkmaid.jpg'), binding('Q99', null)]
	): void {
		fetchMock.mockImplementation(async (input) => {
			const url = new URL(String(input));
			if (url.hostname === 'query.wikidata.org') {
				return new Response(JSON.stringify({ results: { bindings } }));
			}
			const titles = (url.searchParams.get('titles') ?? '').split('|');
			return new Response(
				JSON.stringify({
					query: {
						pages: titles.map((title) => ({
							title,
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
						}))
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

	const matched = m.artworkForm.matchFound('The Milkmaid · Johannes Vermeer · 1658');

	beforeEach(async () => {
		vi.clearAllMocks();
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
		vi.mocked(supabase.rpc).mockReturnValue(rpcCall as never);
		artworks.select.mockReturnValue(artworks);
		artworks.is.mockResolvedValue({ data: [], error: null });
		rpcCall.single.mockResolvedValue({
			data: { id: 'artwork-12', record_number: 12 },
			error: null
		});
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('fills in the image of the artwork that matches the author once the title and author are in', async () => {
		answerSearch();
		renderPage();
		await fillRequired();

		await expect.element(page.getByText(matched), { timeout: 3000 }).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.chooseOtherImage }))
			.toBeVisible();

		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
		expect(args.artwork).toMatchObject({ source_wikidata_id: 'Q167605' });
	});

	it('fills in nothing when no artwork matches the author', async () => {
		answerSearch();
		renderPage();
		await titleField().fill('The Milkmaid');
		await addValue(authorsField(), 'Rembrandt');

		await expect.element(page.getByText(m.artworkForm.matchNone), { timeout: 3000 }).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toBeVisible();
	});

	it('does not fill in an image after the learner opened the search', async () => {
		answerSearch();
		await openSearch();
		await searchDialog().getByRole('button', { name: m.imageSearch.none }).click();

		await new Promise((resolve) => setTimeout(resolve, 1000));

		await expect.element(page.getByText(matched)).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toBeVisible();
	});

	it('lists only the candidates that have an image', async () => {
		answerSearch();
		await openSearch();

		await expect
			.element(searchDialog())
			.toHaveAccessibleDescription(m.imageSearch.description('The Milkmaid', 'Johannes Vermeer'));
		await expect
			.element(searchDialog().getByRole('button', { name: /The Milkmaid/ }))
			.toHaveAccessibleName('The Milkmaid Johannes Vermeer 1658');
		expect(searchDialog().getByRole('listitem').elements()).toHaveLength(1);
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
		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toHaveFocus();
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

describe('pasting an own image on the add artwork page', () => {
	beforeEach(async () => {
		answerNothingFromWikidata();
		vi.clearAllMocks();
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: testSession() },
			error: null
		});
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		Reflect.deleteProperty(navigator, 'clipboard');
	});

	function paste(target: EventTarget, parts: { file?: File; text?: string }): ClipboardEvent {
		const data = new DataTransfer();
		if (parts.file) data.items.add(parts.file);
		if (parts.text) data.setData('text/plain', parts.text);
		const event = new ClipboardEvent('paste', {
			clipboardData: data,
			bubbles: true,
			cancelable: true
		});
		target.dispatchEvent(event);
		return event;
	}

	function stubClipboard(read: () => Promise<ClipboardItem[]>): void {
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { read } });
	}

	async function clipboardImage(): Promise<ClipboardItem> {
		const file = await imageFile(40, 30);
		return new ClipboardItem({ 'image/png': file });
	}

	it('adds an image pasted with the keyboard while nothing is being typed', async () => {
		renderPage();

		const event = paste(document.body, { file: await imageFile(40, 30) });

		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).toBeVisible();
		expect(event.defaultPrevented).toBe(true);
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.changeOwnImage }))
			.toBeVisible();
	});

	it('leaves a paste in a text field to the field', async () => {
		renderPage();
		await titleField().click();

		const event = paste(document.activeElement as Element, { file: await imageFile(40, 30) });

		expect(event.defaultPrevented).toBe(false);
		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).not.toBeInTheDocument();
	});

	it('leaves a paste in the notes editor to the editor', async () => {
		renderPage();
		await page.getByRole('textbox', { name: m.artworkForm.notes }).click();

		const event = paste(document.activeElement as Element, { file: await imageFile(40, 30) });

		expect(event.defaultPrevented).toBe(false);
		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).not.toBeInTheDocument();
	});

	it('ignores a paste that holds neither an image nor an address', () => {
		renderPage();

		const event = paste(document.body, { text: 'The Milkmaid' });

		expect(event.defaultPrevented).toBe(false);
	});

	it('uses a pasted https address like a typed one', async () => {
		stubRemoteImage({ width: 1200, height: 900 });
		renderPage();

		paste(document.body, { text: 'https://example.com/milkmaid.jpg' });

		await expect
			.element(page.getByText(m.artworkForm.ownImageUrlCredit('example.com')))
			.toBeVisible();
	});

	it('rejects a pasted image over the limit that cannot be made smaller', async () => {
		renderPage();

		paste(document.body, {
			file: new File([new Uint8Array(OWN_IMAGE_MAX_BYTES + 1)], 'large.png', { type: 'image/png' })
		});

		await expect
			.element(page.getByRole('alert').getByText(m.ownImageErrors.shrinkFailed))
			.toBeVisible();
		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).not.toBeInTheDocument();
	});

	it('asks before a pasted image replaces the current one and keeps it on request', async () => {
		stubRemoteImage({ width: 1200, height: 900 });
		renderPage();
		await openOwnImage();
		await urlField().fill('https://example.com/milkmaid.jpg');
		await userEvent.keyboard('{Enter}');
		await expect
			.element(page.getByText(m.artworkForm.ownImageUrlCredit('example.com')))
			.toBeVisible();

		paste(document.body, { file: await imageFile(40, 30) });

		const dialog = page.getByRole('alertdialog', { name: m.artworkForm.replaceImageTitle });
		await expect.element(dialog).toBeVisible();
		await expect.element(dialog.getByText(m.artworkForm.replaceImageDescription)).toBeVisible();
		await dialog.getByRole('button', { name: m.artworkForm.keepImage }).click();

		await expect.element(dialog).not.toBeInTheDocument();
		await expect
			.element(page.getByText(m.artworkForm.ownImageUrlCredit('example.com')))
			.toBeVisible();
	});

	it('replaces the current image after the learner agrees', async () => {
		stubRemoteImage({ width: 1200, height: 900 });
		renderPage();
		await openOwnImage();
		await urlField().fill('https://example.com/milkmaid.jpg');
		await userEvent.keyboard('{Enter}');
		await expect
			.element(page.getByText(m.artworkForm.ownImageUrlCredit('example.com')))
			.toBeVisible();
		vi.unstubAllGlobals();

		paste(document.body, { file: await imageFile(40, 30) });
		await page
			.getByRole('alertdialog', { name: m.artworkForm.replaceImageTitle })
			.getByRole('button', { name: m.artworkForm.replaceImage })
			.click();

		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).toBeVisible();
		await expect
			.element(page.getByText(m.artworkForm.ownImageUrlCredit('example.com')))
			.not.toBeInTheDocument();
	});

	it('does not ask when the pasted image is rejected', async () => {
		renderPage();
		await chooseFile(await imageFile(40, 30));
		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).toBeVisible();

		paste(document.body, { file: new File(['x'], 'photo.heic', { type: 'image/heic' }) });

		await expect.element(page.getByRole('alert')).toBeVisible();
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('pastes into the open dialog without asking and closes it', async () => {
		renderPage();
		await chooseFile(await imageFile(40, 30));
		await page.getByRole('button', { name: m.artworkForm.changeOwnImage }).click();

		paste(document.activeElement as Element, { file: await imageFile(50, 40) });

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).toBeVisible();
	});

	it('reads the clipboard from the button and uses the image', async () => {
		const item = await clipboardImage();
		stubClipboard(async () => [item]);
		renderPage();
		await openOwnImage();

		await page.getByRole('button', { name: m.artworkForm.pasteFromClipboard }).click();

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).toBeVisible();
	});

	it('says when the clipboard holds no image', async () => {
		stubClipboard(async () => [new ClipboardItem({ 'text/plain': new Blob(['Vermeer']) })]);
		renderPage();
		await openOwnImage();

		await page.getByRole('button', { name: m.artworkForm.pasteFromClipboard }).click();

		await expect.element(page.getByText(m.ownImageErrors.clipboardEmpty)).toBeVisible();
		await expect.element(page.getByRole('dialog')).toBeVisible();
	});

	it('says when the browser does not allow reading the clipboard', async () => {
		stubClipboard(async () => {
			throw new DOMException('Denied', 'NotAllowedError');
		});
		renderPage();
		await openOwnImage();

		await page.getByRole('button', { name: m.artworkForm.pasteFromClipboard }).click();

		await expect.element(page.getByText(m.ownImageErrors.clipboardDenied)).toBeVisible();
	});

	it('shows the keyboard hint in the dialog and under the image actions', async () => {
		renderPage();

		await expect.element(page.getByText(m.artworkForm.pasteHintForm)).toBeInTheDocument();
		await openOwnImage();
		await expect.element(page.getByText(m.artworkForm.pasteHintLead)).toBeVisible();
	});
});
