import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
import { emptyCategoryValues } from '#lib/collection/category-values.ts';
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
vi.mock('#lib/supabase.ts', () => ({
	supabase: {
		auth: { getSession: vi.fn(), signOut: vi.fn() },
		rpc: vi.fn(),
		storage: { from: vi.fn() }
	}
}));

const rpcCall = { single: vi.fn() };
const bucket = { upload: vi.fn(), remove: vi.fn() };

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

async function imageFile(width: number, height: number): Promise<File> {
	const canvas = new OffscreenCanvas(width, height);
	canvas.getContext('2d')?.fillRect(0, 0, width, height);
	const blob = await canvas.convertToBlob({ type: 'image/png' });
	return new File([blob], 'photo.png', { type: 'image/png' });
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
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: testSession() },
			error: null
		});
		vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
		bucket.upload.mockResolvedValue({ data: { path: 'ignored' }, error: null });
		bucket.remove.mockResolvedValue({ data: [], error: null });
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

	it('explains under the button why a file cannot be added', async () => {
		renderPage();

		await chooseFile(new File(['image'], 'photo.heic', { type: 'image/heic' }));

		await expect
			.element(page.getByRole('button', { name: m.artworkForm.chooseFile }))
			.toHaveAccessibleDescription(m.ownImageErrors.fileType('JPG, PNG, WebP, GIF lub AVIF'));

		const input = document.querySelector<HTMLInputElement>('input[type="file"]');
		await userEvent.upload(
			input as HTMLInputElement,
			new File([new Uint8Array(OWN_IMAGE_MAX_BYTES + 1)], 'large.png', { type: 'image/png' })
		);

		await expect
			.element(page.getByText(m.ownImageErrors.fileTooLarge(OWN_IMAGE_MAX_MEGABYTES)))
			.toBeVisible();
		await expect.element(page.getByRole('img')).not.toBeInTheDocument();
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

		await expect.element(page.getByRole('img')).not.toBeInTheDocument();
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

		await expect.element(page.getByRole('img')).not.toBeInTheDocument();
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
