import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { ConfusedPair } from '#lib/review/types/confused-pair.ts';
import { pairArtworks, pairCount, pairItems } from './confused-pairs.ts';

const monet = testArtwork(1, 'Impression', {
	authors: ['Claude Monet'],
	styles: ['Impressionism']
});
const manet = testArtwork(2, 'Olympia', { authors: ['Édouard Manet'], styles: ['Realism'] });
const both = testArtwork(3, 'Duo', { authors: ['Claude Monet', 'Édouard Manet'] });
const hidden = testArtwork(4, 'Hidden', { authors: ['Gustave Courbet'], hasImage: false });
const courbetStyle = testArtwork(5, 'Stones', {
	authors: ['Gustave Courbet'],
	styles: ['Realism']
});

const authors: ConfusedPair = { kind: 'author', first: 'Claude Monet', second: 'Édouard Manet' };

describe('confused pairs', () => {
	it('asks 2 to 4 pairs, one for every 10 questions of a round', () => {
		expect(pairCount(10)).toBe(2);
		expect(pairCount(30)).toBe(3);
		expect(pairCount(60)).toBe(4);
	});

	it('shows an artwork of each value side by side and asks for one of them', () => {
		const [item] = pairItems([authors], [monet, manet, both], 2, () => 0);
		expect(item).toMatchObject({
			mode: 'quiz_pair',
			kind: 'author',
			asked: 'Claude Monet',
			other: 'Édouard Manet',
			key: 'author:claude monet|édouard manet'
		});
		expect(item.quiz.options.map((option) => option.label).sort()).toEqual([
			'Impression',
			'Olympia'
		]);
		expect(item.quiz.options[item.quiz.answer].artwork).toBe(monet);
		expect(pairArtworks([item]).sort((a, b) => a.number - b.number)).toEqual([monet, manet]);
	});

	it('asks for the second value as well', () => {
		const [item] = pairItems([authors], [monet, manet], 1, () => 0.9);
		expect(item.asked).toBe('Édouard Manet');
		expect(item.quiz.options[item.quiz.answer].artwork).toBe(manet);
	});

	it('matches styles within the styles of an artwork and authors by the whole label', () => {
		const styles: ConfusedPair = { kind: 'style', first: 'impressionism', second: 'Realism' };
		const [item] = pairItems([styles], [monet, courbetStyle], 1, () => 0);
		expect(
			pairArtworks([item])
				.map((artwork) => artwork.number)
				.sort()
		).toEqual([1, 5]);
		const joint: ConfusedPair = {
			kind: 'author',
			first: 'Claude Monet, Édouard Manet',
			second: 'Gustave Courbet'
		};
		expect(pairItems([joint], [both, courbetStyle], 1, () => 0)).toHaveLength(1);
	});

	it('skips a pair without an artwork with an image for each value and stops at the count', () => {
		const courbet: ConfusedPair = {
			kind: 'author',
			first: 'Claude Monet',
			second: 'Gustave Courbet'
		};
		expect(pairItems([courbet], [monet, hidden], 2, () => 0)).toEqual([]);
		expect(pairItems([authors, authors], [monet, manet], 1, () => 0)).toHaveLength(1);
	});
});
