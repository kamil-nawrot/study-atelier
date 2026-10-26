import { LEGAL_ADDRESS, LEGAL_COMPANY, LEGAL_NIP } from '$app/env/public';
import type { LegalDocument } from '#lib/legal/types/legal-document.ts';
import privacy from '#lib/legal/texts/privacy.md?raw';
import terms from '#lib/legal/texts/terms.md?raw';

type Provider = {
	company?: string;
	address?: string;
	nip?: string;
};

const TEXTS: Record<LegalDocument, string> = { terms, privacy };

export function fillProvider(text: string, provider: Provider): string {
	return text
		.replaceAll('{{FIRMA}}', provider.company ?? '[FIRMA]')
		.replaceAll('{{ADRES}}', provider.address ?? '[ADRES]')
		.replaceAll('{{NIP}}', provider.nip ?? '[NIP]');
}

export function legalText(document: LegalDocument): string {
	return fillProvider(TEXTS[document], {
		company: LEGAL_COMPANY,
		address: LEGAL_ADDRESS,
		nip: LEGAL_NIP
	});
}
