import { describe, expect, it } from 'vitest';
import { fillProvider, legalText } from './documents.ts';

describe('legal documents', () => {
	it('fills in the provider and keeps a visible mark for a value that is not set', () => {
		expect(
			fillProvider('{{FIRMA}}, {{ADRES}}, NIP {{NIP}}; {{FIRMA}}', {
				company: 'Firma',
				address: 'ul. Długa 1'
			})
		).toBe('Firma, ul. Długa 1, NIP [NIP]; Firma');
	});

	it('leaves no placeholder of the provider in either document', () => {
		for (const document of ['terms', 'privacy'] as const) {
			expect(legalText(document)).not.toMatch(/\{\{\w+\}\}/);
			expect(legalText(document)).toContain('kontakt@studyatelier.art');
		}
	});
});
