import { describe, expect, it } from 'vitest';
import { maskedSegments } from './notes-markdown';

const apse = { id: 'apse', phrases: ['absyda', 'absydzie', 'apsyda'] };

describe('maskedSegments', () => {
	it('masks every form and synonym of the term as a whole word', () => {
		expect(maskedSegments('Absyda zamyka nawę; w absydzie stoi ołtarz.', apse)).toEqual([
			{ text: 'Absyda', masked: true },
			{ text: ' zamyka nawę; w ', masked: false },
			{ text: 'absydzie', masked: true },
			{ text: ' stoi ołtarz.', masked: false }
		]);
	});

	it('leaves a word that only contains the term', () => {
		expect(maskedSegments('Absydalny plan.', apse)).toEqual([
			{ text: 'Absydalny plan.', masked: false }
		]);
	});
});
