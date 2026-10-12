import { locale, m } from '#lib/i18n/index.ts';

const RECORD_NUMBER_DIGITS = 4;

export function formatRecordNumber(number: number): string {
	return `#${String(number).padStart(RECORD_NUMBER_DIGITS, '0')}`;
}

export function parseRecordNumber(text: string): number | null {
	if (!/^\d+$/.test(text)) return null;
	const number = Number(text);
	return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function formatYear(year: number | null, approximate: boolean): string | undefined {
	return year === null ? undefined : m.atelier.year(year, approximate);
}

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
