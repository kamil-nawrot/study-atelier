import { describe, expect, it } from 'vitest';
import { imageFromCandidate } from './image-candidate.ts';

describe('imageFromCandidate', () => {
	const image = {
		file: 'The Milkmaid.jpg',
		src: 'https://upload.wikimedia.org/330px-The_Milkmaid.jpg',
		width: 2000,
		height: 2250,
		licence: 'Public domain',
		licenceUrl: null,
		attribution: 'Johannes Vermeer'
	};

	it('stores the Wikidata id, the file, its licence and its size', () => {
		expect(
			imageFromCandidate({ wikidataId: 'Q167605', title: 'The Milkmaid', authors: [], image })
		).toEqual({
			kind: 'commons',
			wikidataId: 'Q167605',
			file: 'The Milkmaid.jpg',
			licence: 'Public domain',
			licenceUrl: null,
			attribution: 'Johannes Vermeer',
			width: 2000,
			height: 2250
		});
	});
});
