import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import ExhibitionBody from './ExhibitionBody.svelte';

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
});
