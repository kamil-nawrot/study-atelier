import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import type {
	ArtworkRecord,
	LoadArtworkResult,
	OwnFieldDefinition
} from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { IMAGES_BUCKET } from '#lib/images/bucket.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testSession } from '#lib/testing/auth.ts';
import EditArtworkPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
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

function artwork(overrides: Partial<ArtworkRecord> = {}): ArtworkRecord {
	return {
		id: 'artwork-7',
		number: 7,
		images: [],
		favourite: false,
		title: 'The Milkmaid',
		authors: ['Johannes Vermeer'],
		authorUnknown: false,
		yearFrom: null,
		fromBeforeCommonEra: false,
		yearTo: 1658,
		toBeforeCommonEra: false,
		yearApproximate: true,
		typeCode: 'painting',
		eraCode: null,
		period: null,
		styles: ['Delft school'],
		materials: [],
		location: 'Rijksmuseum',
		notes: 'Seen in Amsterdam.',
		image: null,
		...overrides
	};
}

function renderPage(
	result: LoadArtworkResult = { artwork: artwork() },
	number = '7',
	ownValues: Record<string, string[]> = {}
): void {
	render(EditArtworkPage, {
		data: {
			session: testSession(),
			values: emptyCategoryValues(),
			ownValues,
			ownFields: undefined,
			pins: [],
			pinsError: undefined,
			glossary: [],
			links: emptyValueLinks(),
			noteLinks: undefined,
			placeStarter: emptyPlaceStarter(),
			...result
		},
		params: { number }
	});
}

function stubRemoteImage(size: { width: number; height: number }): void {
	vi.stubGlobal(
		'Image',
		class {
			naturalWidth = 0;
			naturalHeight = 0;
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;

			set src(_value: string) {
				setTimeout(() => {
					this.naturalWidth = size.width;
					this.naturalHeight = size.height;
					this.onload?.();
				});
			}
		}
	);
}

function titleField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('textbox', { name: m.artworkForm.title });
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.artworkForm.save, exact: true });
}

function savedArtworks(...titles: [number, string][]): void {
	artworks.is.mockResolvedValue({
		data: titles.map(([number, title]) => ({
			id: `artwork-${number}`,
			record_number: number,
			title,
			artwork_values: [{ category_values: { category_code: 'author', name: 'Johannes Vermeer' } }]
		})),
		error: null
	});
}

function duplicateDialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog', { name: m.duplicateDialog.title });
}

type Leave = Parameters<Parameters<typeof beforeNavigate>[0]>[0];

function leave(): Leave {
	const navigation = {
		type: 'link',
		to: { url: new URL('http://localhost/atelier') },
		cancel: vi.fn()
	};
	const guard = vi.mocked(beforeNavigate).mock.calls[0][0];
	guard(navigation as unknown as Leave);
	return navigation as unknown as Leave;
}

type AfterNavigate = Parameters<Parameters<typeof afterNavigate>[0]>[0];

function arrive(from: string | null): void {
	const callback = vi.mocked(afterNavigate).mock.calls[0][0];
	callback({
		from: from === null ? null : { route: { id: from }, url: new URL('/atelier', location.href) }
	} as unknown as AfterNavigate);
}

describe('edit artwork page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockReturnValue(rpcCall as never);
		rpcCall.single.mockResolvedValue({ data: { id: 'artwork-7', record_number: 7 }, error: null });
		vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
		bucket.remove.mockResolvedValue({ data: [], error: null });
		artworks.select.mockReturnValue(artworks);
		artworks.is.mockResolvedValue({ data: [], error: null });
		await page.viewport(1280, 800);
	});

	it('shows the saved era chosen and the period and the style unlocked', async () => {
		renderPage({
			artwork: artwork({
				eraCode: 'early_modern',
				period: 'Dutch Golden Age',
				styles: ['Delft school']
			})
		});

		const era = m.eras.early_modern;
		await expect
			.element(page.getByRole('radio', { name: `${era.name} ${era.years}` }))
			.toBeChecked();
		await expect.element(page.getByText('Dutch Golden Age', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Delft school', { exact: true })).toBeVisible();
		await expect.element(page.getByRole('button', { name: /Delft school/ })).toBeVisible();
	});

	it('keeps the style of an artwork without a period locked but removable', async () => {
		renderPage({ artwork: artwork({ eraCode: null, period: null, styles: ['Delft school'] }) });

		await expect.element(page.getByRole('combobox', { name: m.artworkForm.style })).toBeDisabled();
		await expect.element(page.getByText('Delft school', { exact: true })).toBeVisible();

		await page.getByRole('button', { name: /Delft school/ }).click();

		await expect.element(page.getByText('Delft school', { exact: true })).not.toBeInTheDocument();
	});

	it('keeps the period of an artwork without an era when an era is chosen', async () => {
		renderPage({ artwork: artwork({ eraCode: null, period: 'Pointillism', styles: [] }) });
		await expect.element(page.getByText('Pointillism', { exact: true })).toBeVisible();

		await userEvent.click(
			page.getByRole('radio', { name: `${m.eras.modern.name} ${m.eras.modern.years}` })
		);

		await expect.element(page.getByText('Pointillism', { exact: true })).toBeVisible();
	});

	it('fills the form with the saved artwork and has no "save and add next"', async () => {
		renderPage();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.artworkForm.editTitle('#0007'));
		await expect.element(titleField()).toHaveValue('The Milkmaid');
		await expect.element(page.getByText('Johannes Vermeer', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Delft school', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Rijksmuseum', { exact: true })).toBeVisible();
		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.year }))
			.toHaveValue('1658');
		await expect
			.element(page.getByRole('radio', { name: m.artworkTypes.painting, exact: true }))
			.toBeChecked();
		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.notes }))
			.toHaveTextContent('Seen in Amsterdam.');
		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toBeEnabled();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.saveAndNext }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.artworkForm.cancel }))
			.toHaveAttribute('href', '/atelier/7');
		await expect
			.element(page.getByRole('banner').getByRole('link', { name: artwork().title }))
			.toHaveAttribute('href', '/atelier/7');
		await expect
			.element(page.getByRole('heading', { level: 1, name: m.artworkForm.editTitle('#0007') }))
			.toBeInTheDocument();
	});

	it('shows the uploaded image through its signed preview URL', async () => {
		renderPage({
			artwork: artwork({
				image: {
					kind: 'upload',
					path: 'user-id/milkmaid.png',
					previewUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
					width: 4,
					height: 5
				}
			})
		});

		await expect
			.element(page.getByRole('img', { name: 'The Milkmaid, Johannes Vermeer' }))
			.toHaveAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
		await expect.element(page.getByText(m.artworkForm.ownImageCredit)).toBeVisible();
	});

	it('keeps the id of the main image when its photo is replaced from an address', async () => {
		stubRemoteImage({ width: 1200, height: 900 });
		renderPage({
			artwork: artwork({
				image: {
					kind: 'url',
					url: 'https://example.com/facade.jpg',
					width: 4,
					height: 3,
					id: 'image-0'
				},
				images: [
					{ kind: 'url', url: 'https://example.com/plan.jpg', width: 3, height: 4, id: 'image-1' }
				]
			})
		});

		await page.getByRole('button', { name: m.artworkForm.changeOwnImage }).click();
		await page
			.getByRole('textbox', { name: m.artworkForm.imageUrl })
			.fill('https://example.org/new.jpg');
		await page.getByRole('button', { name: m.artworkForm.useImageUrl }).click();
		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
		expect(args.images).toEqual([
			expect.objectContaining({ id: 'image-0', own_image_url: 'https://example.org/new.jpg' }),
			expect.objectContaining({ id: 'image-1', own_image_url: 'https://example.com/plan.jpg' })
		]);
	});

	it('keeps the ids of the images when another one is made the main one', async () => {
		renderPage({
			artwork: artwork({
				image: {
					kind: 'url',
					url: 'https://example.com/facade.jpg',
					width: 4,
					height: 3,
					id: 'image-0'
				},
				images: [
					{ kind: 'url', url: 'https://example.com/plan.jpg', width: 3, height: 4, id: 'image-1' }
				]
			})
		});

		await page.getByRole('button', { name: m.artworkForm.imageSlot(2, 2) }).click();
		await page.getByRole('button', { name: m.artworkForm.setMainImage }).click();
		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
		expect(args.images).toEqual([
			expect.objectContaining({ id: 'image-1', own_image_url: 'https://example.com/plan.jpg' }),
			expect.objectContaining({ id: 'image-0', own_image_url: 'https://example.com/facade.jpg' })
		]);
	});

	it('saves the changes over the same artwork and returns to it with a confirmation', async () => {
		renderPage();

		await titleField().fill('The Kitchen Maid');
		await saveButton().click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/7', {
				replace: true,
				refreshAll: true,
				state: { saved: 7 }
			})
		);
		expect(supabase.rpc).toHaveBeenCalledWith('save_artwork', {
			artwork: expect.objectContaining({
				title: 'The Kitchen Maid',
				year_to: 1658,
				year_approximate: true,
				type_code: 'painting',
				notes: 'Seen in Amsterdam.'
			}),
			values_by_category: {
				author: ['Johannes Vermeer'],
				period: [],
				style: ['Delft school'],
				material: [],
				location: ['Rijksmuseum']
			},
			existing_id: 'artwork-7',
			images: []
		});
	});

	it('fills the own fields with the saved entries and saves an emptied list as empty', async () => {
		const ownFields: OwnFieldDefinition[] = [
			{ id: 'motifs', name: 'Motifs', description: null, kind: 'list', multiple: true },
			{ id: 'source', name: 'Source', description: null, kind: 'text', multiple: false },
			{ id: 'seen', name: 'Seen in person', description: null, kind: 'flag', multiple: false }
		];
		renderPage({
			artwork: artwork({ own: { motifs: ['Milk'], source: 'Gombrich', seen: true } }),
			ownFields
		});

		await expect.element(page.getByRole('textbox', { name: 'Source' })).toHaveValue('Gombrich');
		await expect.element(page.getByRole('checkbox', { name: 'Seen in person' })).toBeChecked();
		await page.getByRole('button', { name: m.ui.valueField.remove('Milk') }).click();
		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		expect(supabase.rpc).toHaveBeenCalledWith(
			'save_artwork',
			expect.objectContaining({
				values_by_category: expect.objectContaining({ motifs: [] }),
				field_entries: { source: 'Gombrich', seen: true }
			})
		);
	});

	it('says the changes are saved when opening the artwork fails', async () => {
		vi.mocked(goto).mockRejectedValueOnce(new Error('Navigation failed'));
		renderPage();

		await titleField().fill('The Kitchen Maid');
		await saveButton().click();

		await expect.element(saveButton()).toBeEnabled();
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(m.artworkForm.changesSaved('#0007'));
	});

	it('does not look for duplicates when the title and authors stay the same', async () => {
		savedArtworks([7, 'The Milkmaid'], [12, 'The Milkmaid']);
		renderPage();

		await page.getByRole('textbox', { name: m.artworkForm.year }).fill('1660');
		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('asks when the changed title matches another artwork, never itself', async () => {
		savedArtworks([7, 'The Milkmaid'], [12, 'The Kitchen Maid'], [3, 'The Kitchen Maid']);
		renderPage();

		await titleField().fill('the kitchen maid');
		await saveButton().click();

		await expect
			.element(duplicateDialog())
			.toHaveAccessibleDescription(
				m.duplicateDialog.description('#0003 i #0012', 2, m.duplicateDialog.save.advice)
			);
		await page.getByRole('button', { name: m.duplicateDialog.save.confirm }).click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
	});

	it('does not ask when only the artwork itself has the changed title', async () => {
		savedArtworks([7, 'The Milkmaid']);
		renderPage();

		await titleField().fill('the milkmaid ');
		await saveButton().click();

		await vi.waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
		expect(duplicateDialog().query()).toBeNull();
	});

	it('removes the uploaded file after the image is removed and saved', async () => {
		renderPage({
			artwork: artwork({
				image: { kind: 'upload', path: 'user-id/milkmaid.png', width: 4, height: 5 }
			})
		});

		await page.getByRole('button', { name: m.artworkForm.removeImage }).click();
		await saveButton().click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		expect(supabase.storage.from).toHaveBeenCalledWith(IMAGES_BUCKET);
		expect(bucket.remove).toHaveBeenCalledWith([
			'user-id/milkmaid.png',
			'user-id/milkmaid-thumb.jpg'
		]);
	});

	it('goes back to where the learner came from', async () => {
		const go = vi.spyOn(history, 'go').mockImplementation(() => {});
		renderPage();
		arrive('/(app)/atelier');

		await page.getByRole('link', { name: m.artworkForm.cancel }).click();

		expect(go).toHaveBeenCalledWith(-1);
		go.mockRestore();
	});

	it('shows the pins of the shown image on its preview and none on an image that is not saved', async () => {
		renderPage({
			artwork: artwork({
				image: {
					kind: 'url',
					url: 'https://example.com/main.jpg',
					width: 4,
					height: 3,
					id: 'image-0'
				},
				images: [{ kind: 'url', url: 'https://example.com/plan.jpg', width: 3, height: 4 }]
			}),
			pins: [
				{ id: 'pin-1', imageId: 'image-0', x: 0.5, y: 0.5, glossaryEntryId: null, text: 'A detail' }
			]
		});

		await expect.element(page.getByRole('button', { name: 'Pinezka 1' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.pins.placeHere })).toBeVisible();
		await page.getByRole('button', { name: m.artworkForm.imageSlot(2, 2) }).click();
		await expect
			.element(page.getByRole('button', { name: m.pins.placeHere }))
			.not.toBeInTheDocument();
	});

	it('asks before removing an image that holds pins and keeps it on cancel', async () => {
		renderPage({
			artwork: artwork({
				image: {
					kind: 'url',
					url: 'https://example.com/main.jpg',
					width: 4,
					height: 3,
					id: 'image-0'
				}
			}),
			pins: [
				{ id: 'pin-1', imageId: 'image-0', x: 0.5, y: 0.5, glossaryEntryId: null, text: 'A detail' }
			]
		});

		await page.getByRole('button', { name: m.artworkForm.removeImage }).click();
		const dialog = page.getByRole('alertdialog', { name: m.artworkForm.removeImageTitle });
		await expect.element(dialog).toHaveTextContent(m.pins.imagePins(1));
		await dialog.getByRole('button', { name: m.artworkForm.removeImageCancel }).click();
		await expect.element(page.getByRole('button', { name: 'Pinezka 1' })).toBeVisible();

		await page.getByRole('button', { name: m.artworkForm.removeImage }).click();
		await dialog.getByRole('button', { name: m.artworkForm.removeImageConfirm }).click();
		await expect.element(page.getByRole('button', { name: 'Pinezka 1' })).not.toBeInTheDocument();
	});

	it('says that the pins could not be loaded and offers no placing of pins', async () => {
		renderPage({
			artwork: artwork({
				image: {
					kind: 'url',
					url: 'https://example.com/main.jpg',
					width: 4,
					height: 3,
					id: 'image-0'
				}
			}),
			pinsError: m.pins.errors.network
		});

		await expect.element(page.getByText(m.pins.loadFailed)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.pins.placeHere }))
			.not.toBeInTheDocument();
	});

	it('places a pin from the preview of a saved image', async () => {
		renderPage({
			artwork: artwork({
				image: {
					kind: 'url',
					url: 'https://example.com/main.jpg',
					width: 4,
					height: 3,
					id: 'image-0'
				}
			})
		});

		await page.getByRole('button', { name: m.pins.placeHere }).click();

		await expect.element(page.getByRole('dialog', { name: m.pins.newTitle })).toBeVisible();
	});

	it('leaves without asking when nothing was changed', async () => {
		renderPage();

		const navigation = leave();

		expect(navigation.cancel).not.toHaveBeenCalled();
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('asks before discarding changes to the artwork', async () => {
		renderPage();
		await titleField().fill('The Kitchen Maid');

		const navigation = leave();

		expect(navigation.cancel).toHaveBeenCalled();
		await expect
			.element(page.getByRole('alertdialog', { name: m.artworkForm.discardTitle }))
			.toBeVisible();
	});

	it('says the artwork does not exist for an unknown or trashed record number', async () => {
		renderPage({ error: m.artworkErrors.notFound, notFound: true }, '99');

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.artworkForm.notFoundTitle('#0099'));
		await expect.element(page.getByText(m.artworkErrors.notFound)).toBeVisible();
		await expect.element(titleField()).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.artworkForm.back }))
			.toHaveAttribute('href', '/atelier');
	});

	it('says the artwork could not be loaded when the request failed', async () => {
		renderPage({ error: m.artworkErrors.network });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.artworkForm.loadErrorTitle);
		await expect.element(page.getByRole('alert')).toHaveTextContent(m.artworkErrors.network);
		await expect.element(titleField()).not.toBeInTheDocument();
	});

	it('opens a record with a year span in the span mode', async () => {
		renderPage({ artwork: artwork({ yearFrom: 1503, yearTo: 1519 }) });

		await expect
			.element(page.getByRole('switch', { name: m.artworkForm.spanSwitch }))
			.toBeChecked();
		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.spanFrom }))
			.toHaveValue('1503');
		await expect
			.element(page.getByRole('textbox', { name: m.artworkForm.spanTo }))
			.toHaveValue('1519');
	});
});
