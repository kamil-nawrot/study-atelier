import { locale, m } from '#lib/i18n/i18n.ts';

export function shortDate(iso: string, now = new Date()): string {
	const date = new Date(iso);
	return new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		month: 'short',
		year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
	}).format(date);
}

export function changedOn(iso: string, now = new Date()): string {
	return new Date(iso).toDateString() === now.toDateString()
		? m.exhibitions.changedToday
		: shortDate(iso, now);
}

export function archivedSince(iso: string): string {
	return m.trash.deletedOn(
		new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
			new Date(iso)
		)
	);
}
