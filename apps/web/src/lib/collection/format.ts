import { m } from '#lib/i18n/index.ts';

const RECORD_NUMBER_DIGITS = 4;

export function formatRecordNumber(number: number): string {
	return `#${String(number).padStart(RECORD_NUMBER_DIGITS, '0')}`;
}

export function formatYear(year: number | null, approximate: boolean): string | undefined {
	return year === null ? undefined : m.atelier.year(year, approximate);
}
