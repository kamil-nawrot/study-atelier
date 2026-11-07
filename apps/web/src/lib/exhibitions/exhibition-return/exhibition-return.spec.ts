import { describe, expect, it } from 'vitest';
import { addArtworkHref, returnPathOf } from './exhibition-return.ts';

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

describe('exhibition return', () => {
	it('builds a link to the new artwork form that leads back to the exhibition in the edit mode', () => {
		const href = addArtworkHref(ID);

		expect(href.startsWith('/atelier/new?return=')).toBe(true);
		const back = new URL(href, 'http://localhost').searchParams.get('return');
		expect(returnPathOf(back)).toBe(`/atelier/exhibitions/${ID}?edit`);
	});

	it('accepts only the edit address of an exhibition', () => {
		expect(returnPathOf(`/atelier/exhibitions/${ID}?edit`)).toBeDefined();
		expect(returnPathOf(`/atelier/exhibitions/${ID}`)).toBeUndefined();
		expect(returnPathOf('https://evil.test/atelier')).toBeUndefined();
		expect(returnPathOf('//evil.test')).toBeUndefined();
		expect(returnPathOf(null)).toBeUndefined();
	});
});
