import { locale } from '#lib/i18n/i18n.ts';

export function tierDate(date: Date): string {
	return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
		date
	);
}
