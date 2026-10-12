import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { afterNavigate, goto } from '$app/navigation';
import { moveToTrash } from '#lib/collection/trash.ts';
import type { ArtworkRecord, LoadArtworkResult } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { testSession } from '#lib/testing/auth.ts';
import ArtworkPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/42'),
	state: {} as App.PageState
}));

vi.mock('$app/state', () => ({ page: navigation }));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/collection/trash.ts', () => ({ moveToTrash: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;

function artwork(overrides: Partial<ArtworkRecord> = {}): ArtworkRecord {
	return {
		id: 'artwork-42',
		number: 42,
		title: 'Girl with a Pearl Earring',
		authors: ['Johannes Vermeer'],
		authorUnknown: false,
		year: 1665,
		beforeCommonEra: false,
		yearApproximate: true,
		typeCode: 'painting',
		periods: ['Baroque'],
		styles: [],
		materials: ['Oil', 'Canvas'],
		location: 'Mauritshuis',
		notes: 'A tronie, not a portrait.',
		image: { kind: 'url', url: IMAGE, width: 40, height: 50 },
		...overrides
	};
}

function renderPage(result: LoadArtworkResult = { artwork: artwork() }, number = '42'): void {
	render(ArtworkPage, { data: { session: testSession(), ...result }, params: { number } });
}

function backLink(): ReturnType<typeof page.getByRole> {
	return page.getByRole('banner').getByRole('link', { name: m.artworkView.back });
}

function details(label: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('definition').filter({ has: page.getByText(label) });
}

describe('artwork page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		localStorage.clear();
		await page.viewport(1280, 800);
	});

	it('shows the artwork with every field and links to editing it', async () => {
		renderPage();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Girl with a Pearl Earring');
		await expect.element(page.getByText('#0042', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Johannes Vermeer', { exact: true })).toBeVisible();
		await expect.element(page.getByText('ok. 1665', { exact: true })).toBeVisible();
		await expect.element(page.getByText(m.artworkTypes.painting)).toBeVisible();
		await expect.element(details('Baroque')).toBeVisible();
		await expect.element(page.getByText('Canvas', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Mauritshuis', { exact: true })).toBeVisible();
		await expect.element(page.getByText('A tronie, not a portrait.')).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: 'Girl with a Pearl Earring, Johannes Vermeer' }))
			.toBeVisible();
		await expect
			.element(page.getByText(m.artworkForm.ownImageUrlCredit('localhost')))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.artworkView.edit }))
			.toHaveAttribute('href', '/atelier/42/edit');
		await expect.element(backLink()).toHaveAttribute('href', '/atelier');
	});

	it('marks the fields the learner has not filled in', async () => {
		renderPage({
			artwork: artwork({
				authors: [],
				authorUnknown: true,
				year: null,
				yearApproximate: false,
				typeCode: null,
				periods: [],
				materials: [],
				location: null,
				notes: ''
			})
		});

		await expect.element(page.getByText(m.ui.unknownAuthor, { exact: true })).toBeVisible();
		expect(page.getByText(m.artworkView.empty).elements()).toHaveLength(6);
	});

	it('writes years before the common era', async () => {
		renderPage({ artwork: artwork({ year: 150, beforeCommonEra: true }) });

		await expect.element(page.getByText('ok. 150 p.n.e.', { exact: true })).toBeVisible();
	});

	it('shows the credit of a Commons image', async () => {
		renderPage({
			artwork: artwork({
				image: {
					kind: 'commons',
					wikidataId: 'Q185372',
					file: 'Girl with a Pearl Earring.jpg',
					licence: 'Public domain',
					licenceUrl: null,
					attribution: null,
					width: 1000,
					height: 1200
				}
			})
		});

		await expect.element(page.getByText(m.artwork.credit)).toBeVisible();
	});

	it('opens the image full screen and closes it', async () => {
		renderPage();

		await page.getByRole('button', { name: m.artworkView.openImage }).click();
		const viewer = page.getByRole('dialog');
		await expect.element(viewer).toBeVisible();
		await expect.element(viewer.getByRole('img')).toHaveAttribute('src', IMAGE);

		await page.getByRole('button', { name: m.artworkView.closeImage }).click();
		await expect.element(viewer).not.toBeInTheDocument();
	});

	it('offers to add an image to an artwork without one', async () => {
		renderPage({ artwork: artwork({ image: null }) });

		await expect.element(page.getByRole('img', { name: m.ui.noImage })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.artworkView.addImage }))
			.toHaveAttribute('href', '/atelier/42/edit');
		await expect
			.element(page.getByRole('button', { name: m.artworkView.openImage }))
			.not.toBeInTheDocument();
	});

	it('closes the information panel and remembers it', async () => {
		renderPage();

		await page.getByRole('button', { name: m.artworkView.hideInformation }).click();
		await expect.element(page.getByRole('heading', { level: 1 })).not.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: m.artworkView.edit })).toBeVisible();

		await page.getByRole('button', { name: m.artworkView.showInformation }).click();
		await expect.element(page.getByRole('heading', { level: 1 })).toBeVisible();

		await page.getByRole('button', { name: m.artworkView.hideInformation }).click();
		renderPage();
		await expect
			.element(page.getByRole('button', { name: m.artworkView.showInformation }).last())
			.toBeVisible();
	});

	it('goes back to the wall through history when it came from there', async () => {
		const back = vi.spyOn(history, 'back').mockImplementation(() => undefined);
		renderPage();
		vi.mocked(afterNavigate).mock.calls[0][0]({
			from: { route: { id: '/(app)/atelier' } }
		} as never);

		await backLink().click();

		expect(back).toHaveBeenCalled();
		back.mockRestore();
	});

	it('shows a not-found state for an unknown record number', async () => {
		renderPage({ error: m.artworkErrors.notFound, notFound: true });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.artworkForm.notFoundTitle('#0042'));
		await expect.element(page.getByText(m.artworkErrors.notFound)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.artworkForm.back }))
			.toHaveAttribute('href', '/atelier');
		await expect
			.element(page.getByRole('link', { name: m.artworkView.edit }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.artworkView.delete }))
			.not.toBeInTheDocument();
	});

	it('names a record number that is not a number as it was typed', async () => {
		renderPage({ error: m.artworkErrors.notFound, notFound: true }, 'abc');

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.artworkForm.notFoundTitle('abc'));
	});

	it('shows a load error in an alert', async () => {
		renderPage({ error: m.artworkErrors.network });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.artworkForm.loadErrorTitle);
		await expect.element(page.getByText(m.artworkErrors.network)).toBeVisible();
	});

	it('confirms the saved changes once', async () => {
		navigation.state = { saved: 42 };
		renderPage();

		await expect.element(page.getByText(m.artworkForm.changesSaved('#0042'))).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier/42', {
			state: {},
			shallow: true,
			replace: true
		});
	});

	it('does not confirm anything without a save', async () => {
		renderPage();

		await expect
			.element(page.getByText(m.artworkForm.changesSaved('#0042')))
			.not.toBeInTheDocument();
		expect(goto).not.toHaveBeenCalled();
	});
	it('moves the artwork to the trash after the learner confirms', async () => {
		vi.mocked(moveToTrash).mockResolvedValue({});
		renderPage();

		await page.getByRole('button', { name: m.artworkView.delete }).click();
		const dialog = page.getByRole('alertdialog', { name: m.trash.moveTitle('#0042') });
		await expect.element(dialog).toBeVisible();
		await expect.element(dialog.getByText(m.trash.moveDescription)).toBeVisible();
		await dialog.getByRole('button', { name: m.trash.move }).click();

		expect(moveToTrash).toHaveBeenCalledWith('artwork-42');
		expect(goto).toHaveBeenCalledWith('/atelier', { state: { trashed: 42 } });
	});

	it('keeps the artwork when the learner cancels', async () => {
		renderPage();

		await page.getByRole('button', { name: m.artworkView.delete }).click();
		await page.getByRole('button', { name: m.trash.cancel }).click();

		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
		expect(moveToTrash).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('shows an error in the dialog when moving to the trash fails', async () => {
		vi.mocked(moveToTrash).mockResolvedValue({ error: m.artworkErrors.network });
		renderPage();

		await page.getByRole('button', { name: m.artworkView.delete }).click();
		await page.getByRole('button', { name: m.trash.move }).click();

		const dialog = page.getByRole('alertdialog');
		await expect.element(dialog.getByText(m.artworkErrors.network)).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});
});
