import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
import { emptyCategoryValues } from '#lib/collection/category-values.ts';
import { emptyValueLinks } from '#lib/collection/value-links.ts';
import type { ArtworkRecord, LoadArtworkResult } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { IMAGES_BUCKET } from '#lib/images/bucket.ts';
import { supabase } from '#lib/supabase.ts';
import { testSession } from '#lib/testing/auth.ts';
import EditArtworkPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
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

function artwork(overrides: Partial<ArtworkRecord> = {}): ArtworkRecord {
	return {
		id: 'artwork-7',
		number: 7,
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

function renderPage(result: LoadArtworkResult = { artwork: artwork() }, number = '7'): void {
	render(EditArtworkPage, {
		data: {
			session: testSession(),
			values: emptyCategoryValues(),
			links: emptyValueLinks(),
			noteLinks: undefined,
			...result
		},
		params: { number }
	});
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
		from: from === null ? null : { route: { id: from } }
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
			.element(page.getByRole('combobox', { name: m.artworkForm.type }))
			.toHaveValue('painting');
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
			.element(page.getByRole('link', { name: m.artworkForm.goBack }))
			.toHaveAttribute('href', '/atelier/7');
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

	it('saves the changes over the same artwork and returns to it with a confirmation', async () => {
		renderPage();

		await titleField().fill('The Kitchen Maid');
		await saveButton().click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/7', {
				replace: true,
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
			existing_id: 'artwork-7'
		});
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
		expect(bucket.remove).toHaveBeenCalledWith(['user-id/milkmaid.png']);
	});

	it('goes back to where the learner came from', async () => {
		const back = vi.spyOn(history, 'back').mockImplementation(() => {});
		renderPage();
		arrive('/(app)/atelier');

		await page.getByRole('link', { name: m.artworkForm.cancel }).click();

		expect(back).toHaveBeenCalled();
		back.mockRestore();
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
