import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { refreshExpiredImages, resolveImages } from '#lib/wall/wall-data/wall-data.ts';
import { deleteValue } from '#lib/card-index/card-index-data/card-index-data.ts';
import { findRecord } from '#lib/card-index/card-index/card-index.ts';
import type { ValueDetails, ValueSubject } from '#lib/collection/types.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { emptyAuthorDetails } from '#lib/values/author-form/author-form.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { testSession } from '#lib/testing/auth.ts';
import ValuePage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/values/style/style-doric'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	refreshExpiredImages: vi.fn(),
	resolveImages: vi.fn()
}));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({ deleteValue: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const artworks: WallArtwork[] = [
	testArtwork(1, 'Parthenon', {
		yearTo: -432,
		eraCode: 'antiquity',
		period: 'Classical',
		styles: ['Doric'],
		materials: ['Marble'],
		authors: ['Phidias'],
		location: 'Athens'
	}),
	testArtwork(2, 'Temple of Hera', {
		yearTo: -550,
		eraCode: 'antiquity',
		period: 'Classical',
		styles: ['Doric']
	}),
	testArtwork(3, 'Undated column', {
		yearTo: null,
		date: undefined,
		eraCode: 'antiquity',
		period: 'Classical',
		styles: ['Doric']
	}),
	testArtwork(4, 'Erechtheion', { yearTo: -406, eraCode: 'antiquity', styles: ['Ionic'] })
];

function subjectOf(id: string): ValueSubject {
	const record = findRecord(testCardIndex(), id);
	if (!record) throw new Error(`no test value ${id}`);
	return { kind: record.category, record };
}

function renderValue(
	subject: ValueSubject | undefined,
	details: ValueDetails = emptyValueDetails(),
	failure: { error?: string; notFound?: boolean } = {}
): void {
	render(ValuePage, {
		data: {
			session: testSession(),
			subject,
			index: testCardIndex(),
			artworks,
			details,
			...failure
		},
		params: { kind: subject?.kind ?? 'style', id: 'unknown' }
	});
}

function tileLinks(): string[] {
	return page
		.getByRole('region', { name: m.valuePage.kinds.style.artworks })
		.getByRole('link')
		.elements()
		.map((link) => link.getAttribute('href') ?? '');
}

describe('value page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		vi.mocked(deleteValue).mockResolvedValue({});
		vi.mocked(resolveImages).mockResolvedValue([]);
		vi.mocked(refreshExpiredImages).mockResolvedValue([]);
		await page.viewport(1280, 800);
	});

	it('shows the kind, the number of artworks, the name and its periods', async () => {
		renderValue(subjectOf('style-doric'));

		await expect
			.element(page.getByText(m.valuePage.header('Styl', m.atelier.count(3))))
			.toBeVisible();
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Doric');
		await expect
			.element(page.getByRole('link', { name: 'Classical' }))
			.toHaveAttribute('href', '/atelier/values/period/period-classical');
	});

	it('links the eras of a period to their pages', async () => {
		renderValue(subjectOf('period-classical'));

		await expect
			.element(page.getByRole('link', { name: m.eras.antiquity.name }))
			.toHaveAttribute('href', '/atelier/values/era/antiquity');
		await expect
			.element(page.getByRole('link', { name: m.eras.early_modern.name }))
			.toHaveAttribute('href', '/atelier/values/era/early_modern');
	});

	it('shows the summary and the notes', async () => {
		renderValue(subjectOf('style-doric'), {
			summary: 'Plain capitals, no base.',
			notes: '**Fluted** shafts.'
		});

		await expect.element(page.getByText('Plain capitals, no base.')).toBeVisible();
		await expect.element(page.getByText('Fluted')).toBeVisible();
		expect(page.getByText(m.valuePage.kinds.style.noNotes).elements()).toHaveLength(0);
	});

	it('says there are no notes yet, with Edytuj only in the top bar', async () => {
		renderValue(subjectOf('style-doric'));

		await expect.element(page.getByText(m.valuePage.kinds.style.noNotes)).toBeVisible();
		const editLinks = page.getByRole('link', { name: m.valuePage.edit });
		expect(editLinks.elements()).toHaveLength(1);
		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.valuePage.edit }))
			.toHaveAttribute('href', '/atelier/values/style/style-doric/edit');
	});

	it('labels the notes', async () => {
		renderValue(subjectOf('style-doric'), { summary: '', notes: 'Fluted shafts.' });

		await expect.element(page.getByRole('heading', { name: m.valuePage.notes })).toBeVisible();
	});

	it('shows the artworks that use the value and no others', async () => {
		renderValue(subjectOf('style-doric'));

		await expect
			.element(page.getByRole('heading', { name: m.valuePage.kinds.style.artworks }))
			.toBeVisible();
		await expect.element(page.getByRole('link', { name: /Temple of Hera/ })).toBeVisible();
		expect(page.getByRole('link', { name: /Erechtheion/ }).elements()).toHaveLength(0);
		expect(
			tileLinks()
				.filter((href) => href.startsWith('/atelier/'))
				.sort()
		).toEqual(['/atelier/1', '/atelier/2', '/atelier/3'].sort());
	});

	it('says no artwork uses the value', async () => {
		renderValue(subjectOf('material-bronze'));

		await expect.element(page.getByText(m.valuePage.kinds.material.noArtworks)).toBeVisible();
		await expect
			.element(page.getByText(m.valuePage.header('Materiał', m.atelier.count(0))))
			.toBeVisible();
	});

	it('shows an era with its years and the artworks from it', async () => {
		renderValue({ kind: 'era', code: 'antiquity' });

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Starożytność');
		await expect.element(page.getByText(m.eras.antiquity.years)).toBeVisible();
		await expect
			.element(page.getByText(m.valuePage.header(m.valuePage.eraKind, m.atelier.count(4))))
			.toBeVisible();
		await expect.element(page.getByText(m.valuePage.kinds.era.artworks)).toBeVisible();
	});

	it('links back to the card index', async () => {
		renderValue(subjectOf('author-phidias'));

		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.valuePage.back }))
			.toHaveAttribute('href', '/atelier/values');
	});

	it('shows the message the form left behind', async () => {
		navigation.state = { valueMessage: m.valuePage.saved };
		renderValue(subjectOf('style-doric'));

		await expect.element(page.getByText(m.valuePage.saved)).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier/values/style/style-doric', {
			state: {},
			shallow: true,
			replace: true
		});
	});

	it('says the value does not exist', async () => {
		renderValue(undefined, emptyValueDetails(), { error: m.valuePage.notFound, notFound: true });

		await expect.element(page.getByText(m.valuePage.notFound)).toBeVisible();
		expect(page.getByRole('link', { name: m.valuePage.edit }).elements()).toHaveLength(0);
	});

	it('shows a loading error', async () => {
		renderValue(undefined, emptyValueDetails(), { error: m.collectionErrors.network });

		await expect.element(page.getByText(m.collectionErrors.network)).toBeVisible();
	});

	it('shows the portrait of an author and the years of life under the name', async () => {
		renderValue(subjectOf('author-phidias'), {
			summary: '',
			notes: '',
			author: {
				...emptyAuthorDetails(),
				image: { kind: 'url', url: 'https://images.example/phidias.jpg', width: 4, height: 5 },
				birthYear: -480,
				deathYear: -430,
				yearsApproximate: true
			}
		});

		await expect
			.element(page.getByRole('article').getByRole('img', { name: 'Phidias' }))
			.toHaveAttribute('src', 'https://images.example/phidias.jpg');
		await expect.element(page.getByText('ok. 480–430 p.n.e.')).toBeVisible();
	});

	it('shows no portrait for an author without one', async () => {
		renderValue(subjectOf('author-phidias'), {
			summary: '',
			notes: '',
			author: emptyAuthorDetails()
		});

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Phidias');
		expect(page.getByRole('article').getByRole('img', { name: 'Phidias' }).elements()).toHaveLength(
			0
		);
	});

	it('shows the type and the country of a place under its name', async () => {
		renderValue(subjectOf('location-athens'), {
			summary: '',
			notes: '',
			location: { countryCode: 'GR', placeType: 'on_site' }
		});

		await expect
			.element(page.getByText(`${m.valueForm.placeTypes.on_site} · Grecja`))
			.toBeVisible();
	});

	describe('deleting', () => {
		it('explains why a used value cannot be deleted in a tooltip on the button', async () => {
			renderValue(subjectOf('style-doric'));
			const blocked = m.valuePage.deleteBlocked(
				m.cardIndex.kinds.style.demonstrative,
				m.atelier.count(2),
				m.cardIndex.kinds.style.other
			);

			await page.getByRole('button', { name: m.valuePage.delete }).hover();
			await expect.element(page.getByRole('tooltip')).toHaveTextContent(blocked);
		});

		it('deletes an unused value from the top bar after the learner confirms', async () => {
			renderValue(subjectOf('style-loose'));

			await page.getByRole('banner').getByRole('button', { name: m.valuePage.delete }).click();
			const confirm = page.getByRole('alertdialog', {
				name: m.cardIndex.deleteConfirm.title('styl', 'Loose')
			});
			await expect.element(confirm.getByText(m.cardIndex.deleteConfirm.description)).toBeVisible();
			expect(deleteValue).not.toHaveBeenCalled();
			await confirm.getByRole('button', { name: m.cardIndex.deleteConfirm.confirm }).click();

			expect(deleteValue).toHaveBeenCalledWith(expect.objectContaining({ id: 'style-loose' }));
			expect(goto).toHaveBeenCalledWith('/atelier/values', {
				refreshAll: true,
				state: { valueMessage: m.cardIndex.deleted('Loose') }
			});
		});

		it('shows an error in the dialog when deleting fails', async () => {
			vi.mocked(deleteValue).mockResolvedValue({ error: m.cardIndex.errors.changed });
			renderValue(subjectOf('style-loose'));

			await page.getByRole('banner').getByRole('button', { name: m.valuePage.delete }).click();
			await page
				.getByRole('alertdialog')
				.getByRole('button', { name: m.cardIndex.deleteConfirm.confirm })
				.click();

			await expect
				.element(page.getByRole('alertdialog').getByText(m.cardIndex.errors.changed))
				.toBeVisible();
			expect(goto).not.toHaveBeenCalled();
		});

		it('offers no delete for an era', async () => {
			renderValue({ kind: 'era', code: 'antiquity' });

			await expect.element(page.getByRole('heading', { level: 1 })).toBeVisible();
			expect(page.getByRole('button', { name: m.valuePage.delete }).elements()).toHaveLength(0);
		});
	});
});
