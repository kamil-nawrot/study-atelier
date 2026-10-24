import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/testing/artworks.ts';
import { m } from '#lib/i18n/index.ts';
import { distribute, WALL_PART } from '#lib/wall/masonry/masonry.ts';
import ArtworkWall from './ArtworkWall.svelte';

vi.mock('#lib/wall/masonry/masonry.ts', async (importOriginal) => {
	const original = await importOriginal<typeof import('#lib/wall/masonry/masonry.ts')>();
	return { ...original, distribute: vi.fn(original.distribute) };
});

const artworks = Array.from({ length: 8 }, (_, index) =>
	testArtwork(index + 1, `Artwork ${index + 1}`)
);

describe('ArtworkWall', () => {
	beforeEach(() => {
		vi.mocked(distribute).mockClear();
	});

	it('spreads the artworks over the columns that fit the width', async () => {
		await page.viewport(1000, 800);

		const { container } = await render(ArtworkWall, { artworks });

		expect(container.querySelectorAll('ul.column')).toHaveLength(3);
		await page.viewport(1400, 800);
		await vi.waitFor(() => expect(container.querySelectorAll('ul.column')).toHaveLength(4));
	});

	it('does not spread the artworks again while the width changes within the same columns', async () => {
		await page.viewport(1000, 800);
		const { container } = await render(ArtworkWall, { artworks });
		const calls = vi.mocked(distribute).mock.calls.length;

		await page.viewport(1100, 800);
		await page.viewport(1200, 800);
		await vi.waitFor(() => expect(window.innerWidth).toBe(1200));

		expect(container.querySelectorAll('ul.column')).toHaveLength(3);
		expect(vi.mocked(distribute)).toHaveBeenCalledTimes(calls);
	});

	it('marks an artwork with the icon of its era and leaves the others unmarked', async () => {
		await page.viewport(1000, 800);

		render(ArtworkWall, {
			artworks: [
				testArtwork(1, 'Dated', { eraCode: 'antiquity' }),
				testArtwork(2, 'Undated', { eraCode: null })
			]
		});

		await expect.element(page.getByRole('img', { name: m.eras.antiquity.name })).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: m.eras.modern.name }))
			.not.toBeInTheDocument();
	});

	describe('with a long list', () => {
		type Watcher = {
			callback: IntersectionObserverCallback;
			targets: Element[];
			options?: IntersectionObserverInit;
		};
		const watchers: Watcher[] = [];

		function reveal(matches: (element: Element) => boolean): void {
			for (const { callback, targets } of watchers) {
				for (const target of targets.filter(matches)) {
					callback([{ isIntersecting: true, target } as IntersectionObserverEntry], {} as never);
				}
			}
		}

		const long = Array.from({ length: WALL_PART * 3 }, (_, index) =>
			testArtwork(index + 1, `Artwork ${index + 1}`, {
				pendingImage: { sourceFile: `${index + 1}.jpg` }
			})
		);

		beforeEach(async () => {
			watchers.length = 0;
			vi.stubGlobal(
				'IntersectionObserver',
				class {
					watcher: Watcher;
					constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
						this.watcher = { callback, targets: [], options };
						watchers.push(this.watcher);
					}
					observe(target: Element): void {
						this.watcher.targets.push(target);
					}
					disconnect(): void {
						this.watcher.targets = [];
					}
				}
			);
			await page.viewport(1000, 800);
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('renders the first part only and more when the end comes into view', async () => {
			const { container } = await render(ArtworkWall, { artworks: long });
			expect(container.querySelectorAll('li')).toHaveLength(WALL_PART);

			reveal((element) => element.matches('div:not(.wall)'));

			await expect.poll(() => container.querySelectorAll('li').length).toBe(WALL_PART * 2);
		});

		it('keeps the columns of the artworks already shown when more are added', async () => {
			const { container } = await render(ArtworkWall, { artworks: long });
			const firstColumn = (): string[] =>
				Array.from(container.querySelectorAll('ul.column:first-child li')).map(
					(item) => item.textContent ?? ''
				);
			const before = firstColumn();

			reveal((element) => element.matches('div:not(.wall)'));
			await expect.poll(() => container.querySelectorAll('li').length).toBe(WALL_PART * 2);

			expect(firstColumn().slice(0, before.length)).toEqual(before);
		});

		it('stops adding parts when every artwork is shown', async () => {
			const { container } = await render(ArtworkWall, { artworks: long.slice(0, WALL_PART + 5) });

			reveal((element) => element.matches('div:not(.wall)'));

			await expect.poll(() => container.querySelectorAll('li').length).toBe(WALL_PART + 5);
			expect(container.querySelector('.wall + div')).toBeNull();
		});

		it('reports an artwork that comes near the screen while it still waits for an image', async () => {
			const onnearscreen = vi.fn();
			const { container } = await render(ArtworkWall, { artworks: long, onnearscreen });

			reveal((element) => element === container.querySelector('li'));

			expect(onnearscreen).toHaveBeenCalledTimes(1);
			expect(onnearscreen).toHaveBeenCalledWith(expect.objectContaining({ number: 1 }));
		});

		it('fades a tile while less than a fifth of it is on screen and shows it again after', async () => {
			const { container } = await render(ArtworkWall, { artworks: long });
			const tile = container.querySelector('li')!;
			function see(ratio: number): void {
				for (const { callback, targets } of watchers) {
					if (targets.includes(tile)) {
						callback(
							[{ isIntersecting: ratio > 0, intersectionRatio: ratio, target: tile }] as never,
							{} as never
						);
					}
				}
			}

			see(0.19);
			expect(tile.classList.contains('faded')).toBe(true);

			see(0.2);
			expect(tile.classList.contains('faded')).toBe(false);

			see(0);
			expect(tile.classList.contains('faded')).toBe(true);
		});

		it('leaves the area under a sticky strip out of what counts as visible', async () => {
			const { container } = await render(ArtworkWall, { artworks: long, inset: 40 });
			const tile = container.querySelector('li')!;

			const faders = watchers.filter(
				(watcher) =>
					watcher.targets.includes(tile) && watcher.options?.rootMargin?.startsWith('-40px')
			);

			expect(faders).toHaveLength(1);
		});

		it('does not watch an artwork that has its image already', async () => {
			const onnearscreen = vi.fn();
			await render(ArtworkWall, { artworks: [testArtwork(1, 'Ready')], onnearscreen });

			reveal((element) => element.tagName === 'LI');

			expect(onnearscreen).not.toHaveBeenCalled();
		});
	});

	it('shows a heart on every tile that names the action and reports the artwork', async () => {
		await page.viewport(1000, 800);
		const onfavourite = vi.fn();
		const loved = testArtwork(2, 'Loved', { favourite: true });

		render(ArtworkWall, { artworks: [testArtwork(1, 'Plain'), loved], onfavourite });

		await expect
			.element(page.getByRole('button', { name: m.favourite.add }))
			.toHaveAttribute('aria-pressed', 'false');
		await page.getByRole('button', { name: m.favourite.remove }).click();

		expect(onfavourite).toHaveBeenCalledWith(loved);
	});

	it('shows no heart without a handler', async () => {
		await page.viewport(1000, 800);

		render(ArtworkWall, { artworks: [testArtwork(1, 'Plain')] });

		await expect.element(page.getByRole('button')).not.toBeInTheDocument();
	});
});
