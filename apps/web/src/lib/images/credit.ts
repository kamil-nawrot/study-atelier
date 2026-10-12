import { m } from '#lib/i18n/index.ts';

const PUBLIC_DOMAIN = /^(public domain|cc0|pd\b)/i;

export function commonsCredit(licence: string | null, attribution: string | null): string {
	if (!licence || PUBLIC_DOMAIN.test(licence)) return m.artwork.credit;
	if (!attribution) return m.artwork.licenceCredit(licence);
	return m.artwork.photoCredit(attribution, licence);
}
