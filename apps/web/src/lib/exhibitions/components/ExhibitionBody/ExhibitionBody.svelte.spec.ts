import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import ExhibitionBody from './ExhibitionBody.svelte';

vi.mock('#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts', () => ({
	loadArtworkImages: vi.fn().mockResolvedValue({
		images: new Map([
			[
				'artwork-1',
				[{ id: 'i1', kind: 'url', url: 'https://a.test/a.jpg', width: 400, height: 300 }]
			]
		])
	})
}));

vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworkNotes: vi.fn().mockResolvedValue({ notes: new Map() })
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

const text = (value: string): ExhibitionDocument => ({
	type: 'doc',
	content: [
		{
			type: 'textBlock',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }]
		}
	]
});

describe('ExhibitionBody', () => {
	it('renders headings, quotes, texts and artworks in the order of the document', async () => {
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(1, 'Judith')]);
		render(ExhibitionBody, {
			lookup,
			document: {
				type: 'doc',
				content: [
					{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Light' }] },
					...(text('Soft **glow**').content ?? []),
					{
						type: 'quote',
						content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Let there be' }] }]
					},
					{
						type: 'artwork',
						attrs: { artworkId: 'artwork-1' },
						content: [{ type: 'text', text: 'A caption' }]
					}
				]
			}
		});

		await expect.element(page.getByRole('heading', { name: 'Light' })).toBeInTheDocument();
		await expect.element(page.getByText('Let there be')).toBeInTheDocument();
		await expect.element(page.getByText('A caption')).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: 'Judith' }))
			.toHaveAttribute('href', '/atelier/1');
	});

	it('leaves out the empty text block that waits at the end of the document', async () => {
		const lookup = new ArtworkLookup();
		render(ExhibitionBody, {
			lookup,
			document: {
				type: 'doc',
				content: [...(text('Hello').content ?? []), { type: 'textBlock' }]
			}
		});

		await expect.element(page.getByText('Hello')).toBeInTheDocument();
		expect(document.querySelectorAll('.text')).toHaveLength(1);
	});

	it('leaves a gap for a divider and draws a line only for one that has it', async () => {
		render(ExhibitionBody, {
			lookup: new ArtworkLookup(),
			document: {
				type: 'doc',
				content: [{ type: 'divider' }, { type: 'divider', attrs: { line: true } }]
			}
		});

		await expect.element(page.getByRole('separator')).toBeInTheDocument();
		expect(document.querySelectorAll('.divider')).toHaveLength(2);
		expect(document.querySelectorAll('hr')).toHaveLength(1);
	});

	it('lays the blocks of a row side by side, with a close-up beside the artwork', async () => {
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(1, 'Judith')]);
		render(ExhibitionBody, {
			lookup,
			document: {
				type: 'doc',
				content: [
					{
						type: 'columns',
						content: [
							{
								type: 'column',
								content: [{ type: 'artwork', attrs: { artworkId: 'artwork-1' } }]
							},
							{
								type: 'column',
								content: [
									{
										type: 'closeUp',
										attrs: { artworkId: 'artwork-1', imageId: null, x: 0.5, y: 0.5, viewWidth: 0.4 }
									}
								]
							}
						]
					}
				]
			}
		});

		await vi.waitFor(() => expect(document.querySelectorAll('[data-row] .cell')).toHaveLength(2));
		await vi.waitFor(() => expect(document.querySelector('[data-fragment]')).not.toBeNull());
	});

	it('stacks the details of a set in its column, where the set is placed', async () => {
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(1, 'Judith')]);
		const detail = (x: number): ExhibitionDocument => ({
			type: 'closeUp',
			attrs: { artworkId: 'artwork-1', imageId: null, x, y: 0.5, viewWidth: 0.4 }
		});
		render(ExhibitionBody, {
			lookup,
			document: {
				type: 'doc',
				content: [{ type: 'set', attrs: { align: 'center' }, content: [detail(0.2), detail(0.8)] }]
			}
		});

		await vi.waitFor(() =>
			expect(document.querySelectorAll('[data-align="center"] .set [data-fragment]')).toHaveLength(
				2
			)
		);
	});
});
