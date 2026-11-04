import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { foldTitle, titleSuggestions } from './typed-title.ts';

const artworks = [
	testArtwork(1, 'Dama z gronostajem', { id: 'ermine', authors: ['Leonardo da Vinci'] }),
	testArtwork(2, 'Dama z jednorożcem', { id: 'unicorn', authors: ['Rafael Santi'] }),
	testArtwork(3, 'Portret damy w błękicie', { id: 'blue', authors: ['Thomas Gainsborough'] }),
	testArtwork(4, 'Autoportret', { id: 'rembrandt', authors: ['Rembrandt van Rijn'] }),
	testArtwork(5, 'Autoportret', { id: 'gogh', authors: ['Vincent van Gogh'] }),
	testArtwork(6, 'Autoportret', { id: 'gogh-2', authors: ['Vincent van Gogh'] }),
	testArtwork(7, 'Autoportret', { id: 'anonymous', authors: [] }),
	testArtwork(8, 'autoportret', { id: 'anonymous-2', authors: [] }),
	testArtwork(9, 'Ur', { id: 'ur', authors: [] }),
	testArtwork(10, 'Łódź na Wiśle', { id: 'lodz', authors: [] })
];

describe('foldTitle', () => {
	it('keeps one character for each letter, without case and diacritics', () => {
		expect(foldTitle('Łódź, „Wisła”')).toBe('lodz   wisla ');
	});
});

describe('titleSuggestions', () => {
	it('waits for three letters', () => {
		expect(titleSuggestions('da', artworks)).toEqual([]);
		expect(titleSuggestions('  ', artworks)).toEqual([]);
	});

	it('finds titles with a word starting with the letters, starting titles first', () => {
		expect(titleSuggestions('dam', artworks).map((suggestion) => suggestion.ids)).toEqual([
			['ermine'],
			['unicorn'],
			['blue']
		]);
	});

	it('marks where the letters typed are in the title', () => {
		const [blue] = titleSuggestions('Damy', artworks);

		expect(blue.title.slice(blue.match.start, blue.match.end)).toBe('damy');
	});

	it('ignores case and diacritics and follows the words typed', () => {
		expect(titleSuggestions('LODZ NA w', artworks).map((suggestion) => suggestion.ids)).toEqual([
			['lodz']
		]);
		expect(titleSuggestions('jednoroz', artworks).map((suggestion) => suggestion.ids)).toEqual([
			['unicorn']
		]);
	});

	it('finds a title shorter than three letters once its word is typed whole', () => {
		expect(titleSuggestions('Ur', artworks).map((suggestion) => suggestion.ids)).toEqual([['ur']]);
		expect(titleSuggestions('U', artworks)).toEqual([]);
	});

	it('merges the artworks that cannot be told apart and keeps their authors', () => {
		expect(
			titleSuggestions('auto', artworks).map((suggestion) => [suggestion.ids, suggestion.authors])
		).toEqual([
			[['rembrandt'], ['Rembrandt van Rijn']],
			[['gogh', 'gogh-2'], ['Vincent van Gogh']],
			[['anonymous', 'anonymous-2'], []]
		]);
	});

	it('shows at most the limit', () => {
		expect(titleSuggestions('auto', artworks, 2)).toHaveLength(2);
	});
});
