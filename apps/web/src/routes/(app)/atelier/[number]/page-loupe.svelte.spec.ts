import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import type { LoadArtworkResult } from '#lib/artworks/types/load-artwork-result.ts';
import { m } from '#lib/i18n/i18n.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import ArtworkPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/42'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/artworks/artwork-preload/artwork-preload.ts', () => ({ preloadArtwork: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;

function artwork(overrides: Partial<ArtworkRecord> = {}): ArtworkRecord {
	return {
		id: 'artwork-42',
		number: 42,
		images: [],
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
		notes: '',
		image: { kind: 'url', url: IMAGE, width: 40, height: 50 },
		...overrides
	};
}

function renderPage(result: LoadArtworkResult = { artwork: artwork() }): void {
	render(ArtworkPage, { data: { session: testSession(), ...result }, params: { number: '42' } });
}

describe('artwork page loupe', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();
		sessionStorage.clear();
		await page.viewport(1280, 800);
	});

	describe('loupe', () => {
		function pointAtLoupeCentre(): HTMLElement {
			const layer = document.querySelector('.loupe') as HTMLElement;
			const rect = layer.getBoundingClientRect();
			layer.dispatchEvent(
				new PointerEvent('pointermove', {
					pointerType: 'mouse',
					clientX: rect.left + rect.width / 2,
					clientY: rect.top + rect.height / 2,
					bubbles: true
				})
			);
			return layer;
		}

		function loupeButton(): ReturnType<typeof page.getByRole> {
			return page.getByRole('button', { name: m.loupe.label });
		}

		it('says how to leave the loupe and switches it off on a click beside the image', async () => {
			renderPage({
				artwork: artwork({ image: { kind: 'url', url: IMAGE, width: 4000, height: 5000 } })
			});

			await loupeButton().click();
			await expect.element(page.getByRole('tooltip')).toHaveTextContent(m.loupe.leave);
			document.body.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));

			await expect.element(loupeButton()).toHaveAttribute('aria-pressed', 'false');
			expect(document.querySelector('.loupe')).toBeNull();
		});

		it('switches the loupe on at once when the preferences ask for it', async () => {
			renderPage({
				artwork: artwork({ image: { kind: 'url', url: IMAGE, width: 4000, height: 5000 } }),
				preferences: { ...defaultPreferences, viewLoupeOn: true }
			});

			await expect.element(loupeButton()).toHaveAttribute('aria-pressed', 'true');
		});

		it.each([4000, 40])(
			'opens a pin with the view of the loupe on a %i px wide image',
			async (width) => {
				renderPage({
					artwork: artwork({
						image: { kind: 'url', url: IMAGE, width, height: width * 1.25, id: 'image-1' }
					}),
					pins: []
				});

				await loupeButton().click();
				const layer = pointAtLoupeCentre();
				layer.click();

				const dialog = page.getByRole('dialog');
				await expect.element(dialog).toHaveTextContent(m.pins.newTitle);
				await expect.element(dialog).toHaveTextContent(/Widok lupy \(\d+(,\d)?×\)/);
			}
		);

		it('dims the loupe and says why for an image whose size is unknown', async () => {
			renderPage({
				artwork: artwork({ image: { kind: 'url', url: IMAGE, width: null, height: null } })
			});

			await expect.element(loupeButton()).toHaveAttribute('aria-disabled', 'true');
			await loupeButton().hover();
			await expect.element(page.getByRole('tooltip')).toHaveTextContent(m.loupe.unavailable);
			(loupeButton().element() as HTMLElement).click();
			await expect.element(loupeButton()).not.toHaveAttribute('aria-pressed');
			expect(document.querySelector('.loupe')).toBeNull();
		});
	});
});
