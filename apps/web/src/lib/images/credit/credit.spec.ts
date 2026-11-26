import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { albumCredit, commonsCredit } from './credit.ts';

describe('commonsCredit', () => {
	it('names only Wikimedia Commons for a public domain or CC0 image', () => {
		expect(commonsCredit('Public domain', 'Some Museum')).toBe(m.artwork.credit);
		expect(commonsCredit('CC0', null)).toBe(m.artwork.credit);
		expect(commonsCredit(null, null)).toBe(m.artwork.credit);
	});

	it('names the photographer and the licence otherwise', () => {
		expect(commonsCredit('CC BY-SA 4.0', 'Jane Doe')).toBe(
			m.artwork.photoCredit('Jane Doe', 'CC BY-SA 4.0')
		);
	});

	it('names the licence when the photographer is unknown', () => {
		expect(commonsCredit('CC BY 3.0', null)).toBe(m.artwork.licenceCredit('CC BY 3.0'));
	});
});

describe('albumCredit', () => {
	it('names the album as the source, with the photographer and the licence', () => {
		expect(albumCredit('Public domain', 'Some Museum')).toBe(m.artwork.albumCredit);
		expect(albumCredit('CC BY-SA 4.0', 'Jane Doe')).toBe(
			m.artwork.albumPhotoCredit('Jane Doe', 'CC BY-SA 4.0')
		);
		expect(albumCredit('CC BY 3.0', null)).toBe(m.artwork.albumLicenceCredit('CC BY 3.0'));
	});
});
