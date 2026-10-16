import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { afterNavigate, goto, preloadData } from '$app/navigation';
import { setFavourite } from '#lib/collection/favourite.ts';
import { moveToTrash } from '#lib/collection/trash.ts';
import type { ArtworkRecord, LoadArtworkResult } from '#lib/collection/types.ts';
import { buildNoteLinks } from '#lib/collection/note-links.ts';
import { m } from '#lib/i18n/index.ts';
import { testSession } from '#lib/testing/auth.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import ArtworkPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/42'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	goto: vi.fn(),
	preloadData: vi.fn()
}));
vi.mock('#lib/collection/trash.ts', () => ({ moveToTrash: vi.fn() }));
vi.mock('#lib/collection/favourite.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/collection/favourite.ts')>()),
	setFavourite: vi.fn()
}));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;

function artwork(overrides: Partial<ArtworkRecord> = {}): ArtworkRecord {
	return {
		id: 'artwork-42',
		number: 42,
		favourite: false,
		title: 'Girl with a Pearl Earring',
		authors: ['Johannes Vermeer'],
		authorUnknown: false,
		yearFrom: null,
		fromBeforeCommonEra: false,
		yearTo: 1665,
		toBeforeCommonEra: false,
		yearApproximate: true,
		typeCode: 'painting',
		eraCode: 'early_modern',
		period: 'Baroque',
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

function rememberWall(numbers: number[], query = ''): void {
	sessionStorage.setItem('study-atelier:wall-sequence', JSON.stringify({ query, numbers }));
}

function arrow(name: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('link', { name });
}

function arrivedFrom(route: string): void {
	for (const [callback] of vi.mocked(afterNavigate).mock.calls)
		callback({ from: { route: { id: route } } } as never);
}

function details(label: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('definition').filter({ has: page.getByText(label) });
}

describe('artwork page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		localStorage.clear();
		sessionStorage.clear();
		await page.viewport(1280, 800);
	});

	it('shows the type and the era as an icon with the name', async () => {
		renderPage();

		await expect.element(details(m.artworkTypes.painting)).toBeVisible();
		for (const name of [m.artworkTypes.painting, m.eras.early_modern.name])
			expect(details(name).element().querySelector('svg')).not.toBeNull();
		expect(details('Baroque').element().querySelector('svg')).toBeNull();
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
		await expect.element(details(m.eras.early_modern.name)).toBeVisible();
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

	it('shows formatted notes and no raw Markdown or HTML', async () => {
		renderPage({
			artwork: artwork({
				notes:
					'### Light\n\nFrom the **left** window.\n\n- Delft\n- Oil\n\n<img src=x onerror=alert(1)>'
			})
		});

		await expect.element(page.getByRole('heading', { name: 'Light', level: 3 })).toBeVisible();
		await expect.element(page.getByText('left', { exact: true })).toBeVisible();
		await expect.element(page.getByRole('listitem').filter({ hasText: 'Delft' })).toBeVisible();
		await expect.element(page.getByText('<img src=x onerror=alert(1)>')).toBeVisible();
		expect(document.querySelector('.notes img')).toBeNull();
	});

	it('links notes to values and artworks and shows the current names', async () => {
		renderPage({
			artwork: artwork({
				notes:
					'Like [old name](/atelier/values/author/author-phidias), see [x](/atelier/12) and [gone](/atelier/99).'
			}),
			noteLinks: buildNoteLinks({
				index: testCardIndex(),
				artworks: [{ number: 12, title: 'Calling of Saint Matthew', authors: [] }]
			})
		});

		await expect
			.element(page.getByRole('link', { name: 'Phidias' }))
			.toHaveAttribute('href', '/atelier/values/author/author-phidias');
		await expect
			.element(page.getByRole('link', { name: '#0012 Calling of Saint Matthew' }))
			.toHaveAttribute('href', '/atelier/12');
		await expect.element(page.getByText('gone')).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'gone' })).not.toBeInTheDocument();
	});

	it('marks the fields the learner has not filled in', async () => {
		renderPage({
			artwork: artwork({
				authors: [],
				authorUnknown: true,
				yearTo: null,
				yearApproximate: false,
				typeCode: null,
				eraCode: null,
				period: null,
				materials: [],
				location: null,
				notes: ''
			})
		});

		await expect.element(page.getByText(m.ui.unknownAuthor, { exact: true })).toBeVisible();
		expect(page.getByText(m.artworkView.empty).elements()).toHaveLength(7);
	});

	it('writes years before the common era', async () => {
		renderPage({ artwork: artwork({ yearTo: 150, toBeforeCommonEra: true }) });

		await expect.element(page.getByText('ok. 150 p.n.e.', { exact: true })).toBeVisible();
	});

	it('writes a year span', async () => {
		renderPage({ artwork: artwork({ yearFrom: 1503, yearTo: 1519 }) });

		await expect.element(page.getByText('ok. 1503–1519', { exact: true })).toBeVisible();
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

		await expect.element(page.getByRole('img', { name: m.ui.noImage })).toBeInTheDocument();
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

	it('links to the previous and next artwork of the wall the learner came from', async () => {
		rememberWall([7, 42, 30], 'epoka=early_modern');
		renderPage();

		await expect.element(arrow(m.artworkView.previous)).toHaveAttribute('href', '/atelier/7');
		await expect.element(arrow(m.artworkView.next)).toHaveAttribute('href', '/atelier/30');
		await expect.element(arrow(m.artworkView.next)).toHaveAttribute('data-sveltekit-replacestate');
		await expect.element(backLink()).toHaveAttribute('href', '/atelier?epoka=early_modern');
		expect(preloadData).toHaveBeenCalledWith('/atelier/30');
	});

	it('dims the arrow at either end of the wall', async () => {
		rememberWall([42, 30]);
		renderPage();

		await expect.element(arrow(m.artworkView.next)).toBeVisible();
		await expect.element(arrow(m.artworkView.previous)).not.toBeInTheDocument();
		expect(document.querySelectorAll('.flip.end')).toHaveLength(1);
	});

	it('has no arrows for an artwork the wall did not show', async () => {
		rememberWall([7, 30], 'epoka=early_modern');
		renderPage();

		await expect.element(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect.element(arrow(m.artworkView.next)).not.toBeInTheDocument();
		await expect.element(backLink()).toHaveAttribute('href', '/atelier');
		expect(document.querySelectorAll('.flip')).toHaveLength(0);
	});

	it('has no arrows when the wall was not shown in this tab', async () => {
		renderPage();

		await expect.element(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect.element(arrow(m.artworkView.previous)).not.toBeInTheDocument();
		expect(preloadData).not.toHaveBeenCalled();
	});

	it('goes to the neighbours with the arrow keys in place of the current artwork', async () => {
		rememberWall([7, 42, 30]);
		renderPage();
		await expect.element(arrow(m.artworkView.next)).toBeVisible();

		await userEvent.keyboard('{ArrowRight}');
		expect(goto).toHaveBeenLastCalledWith('/atelier/30', { replace: true, reset: false });

		await userEvent.keyboard('{ArrowLeft}');
		expect(goto).toHaveBeenLastCalledWith('/atelier/7', { replace: true, reset: false });
	});

	it('does not go past the end of the wall with the arrow keys', async () => {
		rememberWall([42, 30]);
		renderPage();
		await expect.element(arrow(m.artworkView.next)).toBeVisible();

		await userEvent.keyboard('{ArrowLeft}');

		expect(goto).not.toHaveBeenCalled();
	});

	it('leaves the arrow keys alone while a dialog is open', async () => {
		rememberWall([7, 42, 30]);
		renderPage();

		await page.getByRole('button', { name: m.artworkView.delete }).click();
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await userEvent.keyboard('{ArrowRight}');

		expect(goto).not.toHaveBeenCalled();
	});

	it('goes to the next artwork with a swipe to the left on the stage', async () => {
		rememberWall([7, 42, 30]);
		renderPage();
		await expect.element(arrow(m.artworkView.next)).toBeVisible();
		const stage = document.querySelector('figure') as HTMLElement;
		const touch = { isPrimary: true, pointerId: 1, pointerType: 'touch' };

		stage.dispatchEvent(new PointerEvent('pointerdown', { ...touch, clientX: 300, clientY: 200 }));
		stage.dispatchEvent(new PointerEvent('pointerup', { ...touch, clientX: 150, clientY: 210 }));

		expect(goto).toHaveBeenCalledWith('/atelier/30', { replace: true, reset: false });
	});

	it('still goes back to the wall through history after flipping through artworks', async () => {
		const back = vi.spyOn(history, 'back').mockImplementation(() => undefined);
		rememberWall([7, 42, 30]);
		renderPage();
		arrivedFrom('/(app)/atelier');
		arrivedFrom('/(app)/atelier/[number]');

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

	it('keeps the filter of the wall on the way back from an artwork that is gone', async () => {
		rememberWall([7, 42, 30], 'epoka=early_modern');
		renderPage({ error: m.artworkErrors.notFound, notFound: true });

		await expect.element(backLink()).toHaveAttribute('href', '/atelier?epoka=early_modern');
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
		expect(goto).toHaveBeenCalledWith('/atelier', { refreshAll: true, state: { trashed: 42 } });
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

	it('marks the artwork as a favourite from the top bar and confirms it', async () => {
		vi.mocked(setFavourite).mockResolvedValue({});
		renderPage();

		const heart = page.getByRole('banner').getByRole('button', { name: m.favourite.add });
		await expect.element(heart).toHaveAttribute('aria-pressed', 'false');
		await heart.click();

		expect(setFavourite).toHaveBeenCalledWith('artwork-42', true);
		await expect
			.element(page.getByRole('banner').getByRole('button', { name: m.favourite.remove }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText(m.favourite.added)).toBeVisible();
	});

	it('shows a favourite artwork with a filled heart and clears it', async () => {
		vi.mocked(setFavourite).mockResolvedValue({});
		renderPage({ artwork: artwork({ favourite: true }) });

		await page.getByRole('button', { name: m.favourite.remove }).click();

		expect(setFavourite).toHaveBeenCalledWith('artwork-42', false);
		await expect.element(page.getByText(m.favourite.removed)).toBeVisible();
	});

	it('puts the heart back and says so when the save fails', async () => {
		vi.mocked(setFavourite).mockResolvedValue({ error: m.favourite.failed });
		renderPage();

		await page.getByRole('button', { name: m.favourite.add }).click();

		await expect.element(page.getByRole('alert')).toHaveTextContent(m.favourite.failed);
		await expect
			.element(page.getByRole('button', { name: m.favourite.add }))
			.toHaveAttribute('aria-pressed', 'false');
		await expect.element(page.getByText(m.favourite.added)).not.toBeInTheDocument();
	});

	describe('value summaries', () => {
		const summaries = {
			eras: { early_modern: { summary: 'From the discovery of America to the Revolution.' } },
			values: {
				'period:Baroque': { summary: 'Movement, diagonals and strong light.' },
				'author:Johannes Vermeer': { summary: 'Painter of quiet rooms.', lifeYears: '1632–1675' }
			},
			countries: { Mauritshuis: 'Holandia' }
		};

		it('shows the country of a place after its name', async () => {
			renderPage({ artwork: artwork(), summaries });

			await expect.element(page.getByText('Mauritshuis, Holandia')).toBeVisible();
		});

		it('keeps the bare name of a place without a country', async () => {
			renderPage({ artwork: artwork(), summaries: { ...summaries, countries: {} } });

			await expect.element(page.getByText('Mauritshuis', { exact: true })).toBeVisible();
		});

		it('shows the summary of a period with its era when the badge is clicked', async () => {
			renderPage({ artwork: artwork(), summaries });

			await page.getByRole('button', { name: 'Baroque' }).click();

			const card = page.getByRole('tooltip');
			await expect.element(card).toHaveTextContent('Movement, diagonals and strong light.');
			await expect
				.element(card)
				.toHaveTextContent(
					m.valuePage.header(m.cardIndex.kinds.period.name, m.eras.early_modern.name)
				);
		});

		it('shows an author card with the years of life from the name under the title', async () => {
			renderPage({ artwork: artwork(), summaries });

			await page.getByRole('button', { name: 'Johannes Vermeer' }).click();

			await expect.element(page.getByRole('tooltip')).toHaveTextContent('1632–1675');
			await expect.element(page.getByRole('tooltip')).toHaveTextContent('Painter of quiet rooms.');
		});

		it('shows the summary of the era', async () => {
			renderPage({ artwork: artwork(), summaries });

			await page.getByRole('button', { name: m.eras.early_modern.name, exact: true }).click();

			await expect
				.element(page.getByRole('tooltip'))
				.toHaveTextContent('From the discovery of America to the Revolution.');
		});

		it('leaves a value without a summary as a plain badge', async () => {
			renderPage({ artwork: artwork(), summaries });

			await expect.element(page.getByText('Mauritshuis')).toBeVisible();
			expect(page.getByRole('button', { name: 'Mauritshuis' }).elements()).toHaveLength(0);
			expect(page.getByRole('button', { name: 'Oil' }).elements()).toHaveLength(0);
		});
	});
});
