import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
import type { ValueLinks } from '#lib/card-index/types/value-links.ts';
import { m } from '#lib/i18n/i18n.ts';
import {
	IMAGES_BUCKET,
	OWN_IMAGE_ACCEPT,
	OWN_IMAGE_MAX_BYTES,
	OWN_IMAGE_MAX_MEGABYTES
} from '#lib/images/bucket/bucket.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import {
	titleField,
	authorsField,
	saveButton,
	imageFile,
	stubRemoteImage,
	stubSlowRemoteImage,
	openOwnImage,
	chooseFile,
	urlField,
	savedImages,
	savedMainImage,
	addValue,
	selectFile,
	fillRequired,
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

function renderPage(
	links: ValueLinks = emptyValueLinks(),
	placeStarter: PlaceStarter = emptyPlaceStarter(),
	ownFields?: OwnFieldDefinition[],
	ownValues: Record<string, string[]> = {}
): void {
	render(AddArtworkPage, {
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

describe('own images on the add artwork page', () => {
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
		expect(savedMainImage()).toMatchObject({
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
		expect(savedMainImage()).toMatchObject({
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
		expect(savedImages()).toEqual([
			expect.objectContaining({ own_image_url: 'https://example.org/plan.jpg' }),
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
		expect(savedImages()).toEqual([]);
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
		expect(savedImages()).toEqual([]);
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
		expect(savedMainImage()).toMatchObject({ source_wikidata_id: 'Q167605' });
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
				images: [
					expect.objectContaining({
						source_wikidata_id: 'Q167605',
						source_image_file: 'The Milkmaid.jpg',
						source_image_licence: 'CC BY-SA 4.0',
						source_image_attribution: 'Jane Doe',
						image_width: 2000,
						image_height: 2250
					})
				]
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
		await page.getByRole('textbox', { name: m.common.notes }).click();

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
			.getByRole('button', { name: m.common.replace })
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
