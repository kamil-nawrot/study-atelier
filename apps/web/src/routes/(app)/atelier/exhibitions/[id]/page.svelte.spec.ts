import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { saveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import ExhibitionPage from './+page.svelte';

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/exhibitions/x'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));
vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworkNotes: vi.fn().mockResolvedValue({ notes: new Map() }),
	loadRecentArtworks: vi.fn().mockResolvedValue({ artworks: [] }),
	searchArtworks: vi.fn().mockResolvedValue({ artworks: [] })
}));
vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	saveExhibition: vi.fn().mockResolvedValue({ revision: 2 }),
	archiveExhibition: vi.fn().mockResolvedValue({})
}));

const exhibition = {
	id: ID,
	title: 'Light',
	revision: 1,
	updatedAt: '2026-11-01T10:00:00Z',
	document: {
		type: 'doc',
		content: [
			{
				type: 'textBlock',
				content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Soft' }] }]
			}
		]
	}
};

function renderExhibition(overrides: Record<string, unknown> = {}): void {
	render(ExhibitionPage, {
		data: { session: testSession(), exhibition, artworks: [], glossary: [], ...overrides },
		params: { id: ID }
	});
}

describe('exhibition page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.url = new URL(`http://localhost/atelier/exhibitions/${ID}`);
		await page.viewport(1280, 800);
	});

	it('shows the exhibition to read, with a way to edit and to delete it', async () => {
		renderExhibition();

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Light');
		await expect.element(page.getByText('Soft')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.exhibitions.view.edit })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.view.delete }))
			.toBeVisible();
	});

	it('goes to the edit mode through the address', async () => {
		renderExhibition();

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.view.edit }));

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith(`/atelier/exhibitions/${ID}?edit`));
	});

	it('edits the exhibition in the edit mode, with the panel for adding', async () => {
		navigation.url = new URL(`http://localhost/atelier/exhibitions/${ID}?edit`);
		renderExhibition();

		await expect
			.element(page.getByRole('textbox', { name: m.exhibitions.view.titleLabel }))
			.toHaveValue('Light');
		await expect.element(page.getByText(m.exhibitions.panel.title)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.exhibitions.view.done })).toBeVisible();
	});

	it('asks before moving the exhibition to Archiwum', async () => {
		renderExhibition();

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.view.delete }));

		await expect
			.element(page.getByRole('heading', { name: m.exhibitions.deleteConfirm.title('Light') }))
			.toBeInTheDocument();
	});

	it('tells when there is no such exhibition', async () => {
		renderExhibition({ exhibition: undefined, notFound: true });

		await expect.element(page.getByText(m.exhibitions.errors.notFound)).toBeInTheDocument();
	});

	it('tells when the exhibition could not be loaded', async () => {
		renderExhibition({ exhibition: undefined, error: 'Boom' });

		await expect.element(page.getByText('Boom')).toBeInTheDocument();
	});

	it('collapses the panel and opens it again, remembering the choice', async () => {
		navigation.url = new URL(`http://localhost/atelier/exhibitions/${ID}?edit`);
		localStorage.removeItem('exhibition-panel');
		renderExhibition();

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.panel.close }));
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.panel.open }))
			.toBeVisible();
		await vi.waitFor(() => expect(localStorage.getItem('exhibition-panel')).toBe('closed'));

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.panel.open }));
		await vi.waitFor(() => expect(localStorage.getItem('exhibition-panel')).toBe('open'));
	});

	it('starts with the panel collapsed when the learner left it that way', async () => {
		navigation.url = new URL(`http://localhost/atelier/exhibitions/${ID}?edit`);
		localStorage.setItem('exhibition-panel', 'closed');
		renderExhibition();

		await expect
			.element(page.getByRole('button', { name: m.exhibitions.panel.open }))
			.toBeVisible();
		localStorage.removeItem('exhibition-panel');
	});

	it('leaves the edit mode after the changes are saved', async () => {
		navigation.url = new URL(`http://localhost/atelier/exhibitions/${ID}?edit`);
		renderExhibition();

		await userEvent.fill(
			page.getByRole('textbox', { name: m.exhibitions.view.titleLabel }),
			'Dark'
		);
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.view.done }));

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith(`/atelier/exhibitions/${ID}`));
		expect(saveExhibition).toHaveBeenCalled();
	});

	it('moves the exhibition to Archiwum and goes back to the list', async () => {
		renderExhibition();

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.view.delete }));
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.deleteConfirm.confirm }));

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/exhibitions', {
				refreshAll: true,
				state: { exhibitionMessage: m.exhibitions.moved }
			})
		);
	});

	it('leaves the panel out on a phone', async () => {
		await page.viewport(390, 844);
		navigation.url = new URL(`http://localhost/atelier/exhibitions/${ID}?edit`);
		renderExhibition();

		await expect.element(page.getByText(m.exhibitions.panel.title)).not.toBeInTheDocument();
	});
});
