import { locale, m } from '#lib/i18n/index.ts';

export function formatDeletedOn(deletedAt: string, now = new Date()): string {
	const date = new Date(deletedAt);
	if (date.toDateString() === now.toDateString()) return m.trash.deletedOn(m.trash.today);
	const format = new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		month: 'long',
		year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
	});
	return m.trash.deletedOn(format.format(date));
}
